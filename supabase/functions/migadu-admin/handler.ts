import { MailError, accountCredentials, createMigaduClient, domainName, dnsRecords, listFrom, localPart, mailboxPayload, safeDomain, safeMailbox, type Credentials, type MigaduCall } from "./api.ts";

type Client = any;
const origins = new Set(["https://vedantix.nl", "https://www.vedantix.nl", "https://vedantix-migration-test.lovable.app"]);
const actions = new Set(["status","connect","disconnect","domain","records","add_domain","activate_domain","create_mailbox","update_mailbox","reset_password","delete_mailbox"]);
const mutationActions = new Set(["connect","disconnect","add_domain","activate_domain","create_mailbox","update_mailbox","reset_password","delete_mailbox"]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
async function data(query: any) {
  const result = await query;
  if (result.error) throw new Error("Database operation failed");
  return result.data;
}
export function createMailHandler(
  createUser: (authorization: string) => Client,
  createAdmin: () => Client,
  provider: (credentials: Credentials) => MigaduCall = createMigaduClient,
) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get("Origin");
    const headers = { "Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store",
      "Access-Control-Allow-Origin":origin && origins.has(origin) ? origin : "https://vedantix.nl",
      "Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info",
      "Access-Control-Allow-Methods":"POST,OPTIONS", Vary:"Origin" };
    const reply = (body: unknown, status=200) => new Response(JSON.stringify(body),{status,headers});
    if (origin && !origins.has(origin)) return reply({error:"Origin niet toegestaan."},403);
    if (request.method==="OPTIONS") return new Response(null,{status:204,headers});
    if (request.method!=="POST") return reply({error:"Gebruik POST."},405);
    const authorization = request.headers.get("Authorization") || "";
    if (!/^Bearer\s+\S+$/i.test(authorization)) return reply({error:"Log opnieuw in."},401);
    let admin: Client, auditId: string | null = null;
    try {
      const user = createUser(authorization);
      const auth = await user.auth.getUser();
      if (auth.error || !auth.data?.user?.id) return reply({error:"Log opnieuw in."},401);
      const access = await user.rpc("is_staff",{required_roles:["ADMIN"]});
      if (access.error || access.data!==true) return reply({error:"Alleen een beheerder kan mailboxen beheren."},403);
      const raw = await request.text();
      if (raw.length>12000) return reply({error:"Verzoek te groot."},413);
      let body: any;
      try { body=JSON.parse(raw); } catch { return reply({error:"Ongeldig verzoek."},400); }
      if (!body || typeof body!=="object" || !actions.has(body.action)) return reply({error:"Onbekende actie."},400);
      admin=createAdmin();
      const config=await data(admin.from("migadu_management_config").select("connected,account_email,last_verified_at").eq("id",true).single());
      if (body.action==="status") return reply({ok:true,config});
      let domain: any = null, name = "", part = "";
      if (!["connect","disconnect"].includes(body.action)) {
        if (!uuid.test(String(body.domain_id))) throw new MailError("Selecteer een domein.");
        // Resolve the target from our own authorized domain registry, never from a caller-supplied hostname.
        domain=await data(user.from("domains").select("id,domain_name,dns_provider").eq("id",body.domain_id).maybeSingle());
        if (!domain) throw new MailError("Domein niet gevonden.",404);
        name=domainName(domain.domain_name);
        if (body.action.endsWith("_mailbox") || body.action==="reset_password") part=localPart(body.local_part);
      }
      const payload = ["create_mailbox","update_mailbox","reset_password"].includes(body.action) ? mailboxPayload(body.action,body) : undefined;
      if (body.action==="delete_mailbox" && body.confirm_address!==part+"@"+name)
        throw new MailError("Typ het volledige e-mailadres om de mailbox definitief te verwijderen.");
      if (["add_domain","activate_domain"].includes(body.action) && body.confirm_domain!==name)
        throw new MailError("Bevestig het domein dat je wilt instellen.");
      if (mutationActions.has(body.action)) {
        if (!uuid.test(String(body.request_id))) throw new MailError("Vernieuw de pagina en probeer opnieuw.");
        const record=await admin.from("migadu_management_audit").insert({
          request_id:body.request_id,actor_id:auth.data.user.id,domain_id:domain?.id || null,
          action:body.action,target:part ? part+"@"+name : name || "Migadu-koppeling",status:"pending",
        }).select("id").single();
        if (record.error?.code==="23505") throw new MailError("Dit verzoek is al verwerkt of wordt verwerkt. Vernieuw eerst het overzicht.",409);
        if (record.error || !record.data?.id) throw new Error("Audit unavailable");
        auditId=record.data.id;
      }
      const completed = async (result: any) => {
        if (auditId) {
          const saved=await admin.from("migadu_management_audit").update({status:"succeeded",finished_at:new Date().toISOString()}).eq("id",auditId);
          // The provider may already have committed the operation; never imply it should be retried.
          if (saved.error) return reply({...result,ok:true,warning:"De wijziging is gelukt. Het activiteitenlog kon nog niet worden bijgewerkt."});
        }
        return reply({...result,ok:true});
      };
      if (body.action==="disconnect") {
        await data(admin.rpc("migadu_management_secret",{p_action:"delete",p_credentials:null}));
        return completed({});
      }
      if (body.action==="connect") {
        const credentials=accountCredentials(body);
        listFrom(await provider(credentials)("/domains"),"domains");
        await data(admin.rpc("migadu_management_secret",{p_action:"save",p_credentials:credentials}));
        return completed({});
      }
      if (!config.connected) throw new MailError("Koppel eerst je Migadu-account voor mailboxbeheer.");
      const secret=await data(admin.rpc("migadu_management_secret",{p_action:"read",p_credentials:null}));
      const api=provider(accountCredentials(secret || {}));
      const base="/domains/"+encodeURIComponent(name);
      if (body.action==="domain") {
        const registered=listFrom(await api("/domains"),"domains").find(d=>String(d.name).toLowerCase()===name);
        if (!registered) return reply({ok:true,registered:false,domain:null,mailboxes:[]});
        const mailboxes=listFrom(await api(base+"/mailboxes"),"mailboxes").map(safeMailbox);
        return reply({ok:true,registered:true,domain:safeDomain(registered),mailboxes});
      }
      if (body.action==="records") return reply({ok:true,records:dnsRecords(await api(base+"/records"))});
      if (body.action==="add_domain") {
        await api("/domains","POST",{name,hosted_dns:false,create_default_addresses:true});
        return completed({});
      }
      if (body.action==="activate_domain") {
        const activated=await api(base+"/activate");
        let warning: string | undefined;
        if (activated?.can_send === true && activated?.can_receive === true) {
          // Updating provider metadata does not change DNS. Keep monitoring selectors aligned with Migadu.
          try {
            const expected=dnsRecords(await api(base+"/records"));
            const selectors=expected.filter(r=>r.purpose==="Ondertekening").map(r=>r.name.split("._domainkey")[0]);
            await data(admin.from("domains").update({email_provider:"Migadu",dkim_selectors:selectors}).eq("id",domain.id));
          } catch { warning="Het domein is actief. De lokale monitoringgegevens konden nog niet worden bijgewerkt."; }
        }
        return completed({domain:safeDomain(activated),...(warning ? {warning} : {})});
      }
      const mailbox=base+"/mailboxes"+(body.action==="create_mailbox" ? "" : "/"+encodeURIComponent(part));
      const method=body.action==="delete_mailbox" ? "DELETE" : body.action==="create_mailbox" ? "POST" : "PUT";
      await api(mailbox,method,payload);
      // No provider response is forwarded for mutations: it could contain credentials.
      return completed({});
    } catch(error) {
      if (auditId && admin) {
        try { await admin.from("migadu_management_audit").update({status:"unconfirmed",finished_at:new Date().toISOString()}).eq("id",auditId); } catch { /* Never log raw provider errors or request bodies. */ }
      }
      return reply({error:error instanceof MailError ? error.message : "Mailboxbeheer kon het verzoek niet bevestigen. Vernieuw het overzicht voordat je opnieuw probeert."},error instanceof MailError ? error.status : 500);
    }
  };
}
