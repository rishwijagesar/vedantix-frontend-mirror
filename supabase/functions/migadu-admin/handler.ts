import { sendInvitation, usableIdentity, usePrimaryAddress } from "./mailbox-tools.ts";
import { MailError, accountCredentials, createMigaduClient, domainName, dnsRecords, listFrom, localPart, mailboxPayload, safeDomain, safeMailbox, recoveryEmail, type Credentials, type MigaduCall } from "./api.ts";

type Client = any;
const origins = new Set(["https://vedantix.nl", "https://www.vedantix.nl", "https://vedantix-migration-test.lovable.app"]);
const actions = new Set(["status","contacts","connect","disconnect","domain","records","add_domain","activate_domain","create_mailbox","update_mailbox","reset_password","delete_mailbox","send_invitation","set_primary_address"]);
const mutationActions = new Set(["connect","disconnect","add_domain","activate_domain","create_mailbox","update_mailbox","reset_password","delete_mailbox","send_invitation","set_primary_address"]);
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
    let admin: Client = null, auditId: string | null = null;
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
        if (body.action.endsWith("_mailbox") || ["reset_password","send_invitation","set_primary_address"].includes(body.action)) part=localPart(body.local_part);
      }
      const contactColumns="local_part,recovery_email,preferred_local_part,updated_at";
      const savedContacts=async()=>await data(admin.from("migadu_mailbox_contacts").select(contactColumns).eq("domain_id",domain.id));
      if(body.action==="contacts") return reply({ok:true,contacts:await savedContacts()});
      const saveContact=async(local:string, fields:Record<string,unknown>)=>{
        const previous=await data(admin.from("migadu_mailbox_contacts").select(contactColumns).eq("domain_id",domain.id).eq("local_part",local).maybeSingle());
        await data(admin.from("migadu_mailbox_contacts").upsert({
          domain_id:domain.id,local_part:local,recovery_email:previous?.recovery_email||null,
          preferred_local_part:previous?.preferred_local_part||null,...fields,updated_at:new Date().toISOString(),
        },{onConflict:"domain_id,local_part"}));
      };
      const payload = ["create_mailbox","update_mailbox","reset_password"].includes(body.action) ? mailboxPayload(body.action,body,name) : undefined;
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
        const contacts=await savedContacts();
        const mailboxes=listFrom(await api(base+"/mailboxes"),"mailboxes").map(safeMailbox);
        for(const box of mailboxes) {
          (box as any).primary_address=box.local_part+"@"+name;
          const contact=contacts.find((c:any)=>c.local_part===box.local_part);
          if(contact?.preferred_local_part && contact.preferred_local_part!==box.local_part) {
            try {
              const identities=listFrom(await api(base+"/mailboxes/"+encodeURIComponent(box.local_part)+"/identities"),"identities");
              if(identities.some(i=>usableIdentity(i,contact.preferred_local_part))) (box as any).primary_address=contact.preferred_local_part+"@"+name;
            } catch { /* Show the confirmed parent address if the identity cannot be verified. */ }
          }
        }
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
      if(body.action==="send_invitation") {
        const recipient=await sendInvitation(api,mailbox,body,name);
        let warning:string|undefined;
        try {await saveContact(part,{recovery_email:recipient});}
        catch {warning="Het reserveadres kon nog niet in Vedantix worden bewaard. Controleer dit via Aanpassen; verstuur de uitnodiging niet opnieuw.";}
        return completed({invitation_requested:true,recipient,...(warning?{warning}:{})});
      }
      if(body.action==="set_primary_address") {
        const result=await usePrimaryAddress(api,base,part,body,name);
        let recovery="";
        try {recovery=recoveryEmail(result.current.password_recovery_email,name);} catch { /* Legacy addresses can be corrected separately. */ }
        await saveContact(part,{preferred_local_part:result.target,...(recovery?{recovery_email:recovery}:{})});
        return completed({primary_address:result.target+"@"+name,parent_address:part+"@"+name});
      }
      if(body.action==="delete_mailbox") {
        // Keep a contact record before deletion; deleting a mailbox never deletes its reserve contact.
        const current=await api(mailbox);
        if(current.password_recovery_email) await saveContact(part,{recovery_email:recoveryEmail(current.password_recovery_email,name)});
      }
      const method=body.action==="delete_mailbox" ? "DELETE" : body.action==="create_mailbox" ? "POST" : "PUT";
      await api(mailbox,method,payload);
      // No provider response is forwarded for mutations: it could contain credentials.
      let warning:string|undefined;
      if(payload && Object.hasOwn(payload,"password_recovery_email")) {
        try {await saveContact(part,{recovery_email:payload.password_recovery_email||null});}
        catch {warning="De wijziging bij Migadu is bevestigd, maar het reserveadres kon nog niet in Vedantix worden bewaard. Controleer dit via Aanpassen.";}
      }
      return completed({...(payload?.password_method==="invitation"?{invitation_requested:true,recipient:payload.password_recovery_email}:{}),...(warning?{warning}:{})});
    } catch(error) {
      if (auditId && admin) {
        try { await admin.from("migadu_management_audit").update({status:"unconfirmed",finished_at:new Date().toISOString()}).eq("id",auditId); } catch { /* Never log raw provider errors or request bodies. */ }
      }
      return reply({error:error instanceof MailError ? error.message : "Mailboxbeheer kon het verzoek niet bevestigen. Vernieuw het overzicht voordat je opnieuw probeert."},error instanceof MailError ? error.status : 500);
    }
  };
}

