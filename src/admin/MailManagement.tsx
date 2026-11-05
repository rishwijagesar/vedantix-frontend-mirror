import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { KeyRound, Mail, Plus, RefreshCw, Settings2, Trash2 } from "lucide-react";
import { SavedMailContacts } from "./SavedMailContacts";
import { MailDnsSetup } from "./MailDnsSetup";
import type { Domain } from "./control-center-data";
import { mailAction, type DnsRecord, type MailConfig, type MailDomain, type Mailbox } from "./mail-management-data";

const input="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-400";
const button="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50";
const primary="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-50";
function Field({label,children}:{label:string;children:ReactNode}) {return <label className="block text-sm font-medium text-slate-800">{label}{children}</label>;}
function Alert({children}:{children:ReactNode}) {return <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{children}</p>;}
function PasswordFields() {
  const [password,setPassword]=useState("");
  const [repeat,setRepeat]=useState("");
  const [visible,setVisible]=useState(false);
  function generate() {
    const chars="abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#%+-";
    const bytes=crypto.getRandomValues(new Uint32Array(24));
    const value=Array.from(bytes,b=>chars[b%chars.length]).join("");
    setPassword(value);setRepeat(value);setVisible(true);
  }
  return <div className="space-y-3">
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Nieuw wachtwoord"><input className={input} name="password" type={visible?"text":"password"} autoComplete="new-password" required minLength={12} maxLength={200} value={password} onChange={e=>setPassword(e.target.value)}/></Field>
      <Field label="Herhaal wachtwoord"><input className={input} name="repeat_password" type={visible?"text":"password"} autoComplete="new-password" required minLength={12} maxLength={200} value={repeat} onChange={e=>setRepeat(e.target.value)}/></Field>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className={button} onClick={generate}>Sterk wachtwoord maken</button>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={visible} onChange={e=>setVisible(e.target.checked)}/> Wachtwoord tonen</label>
    </div>
    <p className="text-xs leading-5 text-slate-500">Bewaar dit wachtwoord vóór het opslaan in je wachtwoordmanager. Het wordt daarna niet meer getoond. Gebruik het ook in de mailapp van de klant.</p>
  </div>;
}
export default function MailManagement({domains,onChanged}:{domains:Domain[];onChanged:()=>Promise<void>}) {
  const [config,setConfig]=useState<MailConfig|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [selected,setSelected]=useState(domains[0]?.id||"");
  const [settings,setSettings]=useState(false);
  const [revision,setRevision]=useState(0);
  const [contactRevision,setContactRevision]=useState(0);
  const formRef=useRef<HTMLFormElement>(null);
  async function status() {
    setError("");
    try {setConfig((await mailAction("status")).config);}
    catch(e){setError(e instanceof Error?e.message:"Verbinding kon niet worden geladen.");}
  }
  useEffect(()=>{void status();},[]);
  useEffect(()=>{if(!domains.some(d=>d.id===selected))setSelected(domains[0]?.id||"");},[domains,selected]);
  async function connect(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();const form=new FormData(event.currentTarget);setBusy(true);setError("");setMessage("");
    try {
      await mailAction("connect",{email:String(form.get("email")||""),api_key:String(form.get("api_key")||"")});
      setSettings(false);setMessage("Migadu is verbonden voor mailboxbeheer.");setRevision(v=>v+1);await status();
    } catch(e){setError(e instanceof Error?e.message:"Koppelen mislukt.");}
    finally{formRef.current?.reset();setBusy(false);}
  }
  async function disconnect() {
    if(!window.confirm("Mailboxbeheer loskoppelen? Je bestaande mailboxen blijven werken bij Migadu."))return;
    setBusy(true);setError("");
    try{await mailAction("disconnect");setMessage("Mailboxbeheer is losgekoppeld.");await status();setRevision(v=>v+1);}
    catch(e){setError(e instanceof Error?e.message:"Loskoppelen mislukt.");}
    finally{setBusy(false);}
  }
  const domain=domains.find(d=>d.id===selected);
  return <section aria-label="Mailboxbeheer" className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="flex items-center gap-2 text-lg font-semibold"><Mail size={20}/> Mailboxen beheren</h2><p className="mt-1 text-sm text-slate-500">Maak zakelijke e-mailadressen aan en beheer ze direct in Vedantix.</p></div>
      {config?.connected&&<button type="button" className={button} disabled={busy} onClick={()=>setSettings(v=>!v)}><Settings2 size={15}/> Koppeling</button>}
    </div>
    {error&&<Alert>{error}</Alert>}
    {message&&<p role="status" className="text-sm text-emerald-800">{message}</p>}
    {!config?<div className="flex items-center gap-3 text-sm text-slate-500">{error?<button className={button} type="button" onClick={status}>Opnieuw laden</button>:"Verbinding laden…"}</div>:(!config.connected||settings)?<form ref={formRef} onSubmit={connect} className="space-y-4 rounded-xl bg-slate-50 p-4">
      <h3 className="font-semibold">Migadu eenmalig verbinden</h3>
      <p className="text-sm leading-6 text-slate-600">Maak in Migadu onder <a className="underline" href="https://admin.migadu.com/account/api/keys" target="_blank" rel="noopener noreferrer">My Account → API Keys</a> een sleutel voor Vedantix. Vul hieronder het e-mailadres van je Migadu-account en die sleutel in. De bestaande koppeling voor het versturen van meldingen blijft apart werken.</p>
      <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
        <Field label="E-mailadres Migadu-account"><input className={input} type="email" name="email" autoComplete="username" required defaultValue={config.account_email||""}/></Field>
        <Field label="Migadu API-sleutel"><input className={input} type="password" name="api_key" autoComplete="off" required maxLength={4096}/></Field>
      </fieldset>
      <p className="text-xs text-slate-500">De sleutel wordt versleuteld opgeslagen en is alleen op de server beschikbaar. Deel hem niet via chat of e-mail.</p>
      <div className="flex flex-wrap gap-2"><button className={primary} disabled={busy}>{busy?"Verbinding controleren…":"Verbinden en opslaan"}</button>
        {config.connected&&<button type="button" className={button} disabled={busy} onClick={disconnect}>Loskoppelen</button>}
      </div>
    </form>:<p className="text-sm text-emerald-800">Verbonden met {config.account_email}</p>}
    {config&&<div className="space-y-5">
      <Field label="Kies een domein"><select className={input} value={selected} disabled={busy||!domains.length} onChange={e=>setSelected(e.target.value)}>{!domains.length&&<option value="">Voeg eerst een domein toe via Domeinen</option>}{domains.map(d=><option key={d.id} value={d.id}>{d.domain_name}</option>)}</select></Field>
      {domain&&config.connected&&<DomainMail key={domain.id+":"+revision} domain={domain} onChanged={onChanged} onContactChange={()=>setContactRevision(v=>v+1)}/>}
      {domain&&<SavedMailContacts key={domain.id} domainId={domain.id} domainName={domain.domain_name} revision={contactRevision}/>}
    </div>}
  </section>;
}
type Editor={kind:"create"|"edit"|"password"|"delete"|"address";box?:Mailbox | undefined}|null;
function DomainMail({domain,onChanged,onContactChange}:{domain:Domain;onChanged:()=>Promise<void>;onContactChange:()=>void}) {
  const [details,setDetails]=useState<MailDomain|null>(null);
  const [records,setRecords]=useState<DnsRecord[]|null>(null);
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [editor,setEditor]=useState<Editor>(null);
  const [setup,setSetup]=useState(false);
  const [confirmation,setConfirmation]=useState("");
  const [formKey,setFormKey]=useState(0);
  const [passwordMethod,setPasswordMethod]=useState("invitation");
  const [backupEmail,setBackupEmail]=useState("");
  const [newPart,setNewPart]=useState("info");
  async function reload() {
    setLoading(true);
    try{setDetails(await mailAction("domain",{domain_id:domain.id}));}
    catch(e){setError(e instanceof Error?e.message:"Mailboxen konden niet worden geladen.");}
    finally{setLoading(false);}
  }
  useEffect(()=>{void reload();},[domain.id]);
  async function run(action:string,body:Record<string,unknown>,success:string) {
    setBusy(true);setError("");setMessage("");
    try{
      const result=await mailAction(action,{...body,domain_id:domain.id});
      const confirmation=result.invitation_requested?"Uitnodiging aangevraagd bij Migadu voor "+result.recipient+". De klant stelt via die e-mail zelf een wachtwoord in. Controleer zo nodig de spammap.":success;
      setMessage(result.warning?confirmation+" "+result.warning:confirmation);setEditor(null);setConfirmation("");
      onContactChange();
      await reload();
      if(action==="activate_domain")await onChanged();
      return true;
    } catch(e){setError(e instanceof Error?e.message:"De wijziging is niet bevestigd.");return false;}
    finally{setBusy(false);}
  }
  async function showRecords() {
    setBusy(true);setError("");
    try{setRecords((await mailAction("records",{domain_id:domain.id})).records);setSetup(true);}
    catch(e){setError(e instanceof Error?e.message:"DNS-records konden niet worden geladen.");}
    finally{setBusy(false);}
  }
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();if(!editor)return;
    const values=new FormData(event.currentTarget);
    const password=String(values.get("password")||"");
    const manual=passwordMethod==="password";
    if(["create","password"].includes(editor.kind)&&manual&&password!==String(values.get("repeat_password")||"")){setError("De twee wachtwoorden komen niet overeen.");return;}
    const part=editor.box?.local_part||String(values.get("local_part")||"");
    const action=editor.kind==="create"?"create_mailbox":editor.kind==="edit"?"update_mailbox":editor.kind==="address"?"set_primary_address":editor.kind==="password"?(manual?"reset_password":"send_invitation"):"delete_mailbox";
    const body:Record<string,unknown>={local_part:part};
    if((editor.kind==="create"||editor.kind==="password")&&manual)body["password"]=password;
    if(editor.kind==="create"){
      body["password_method"]=passwordMethod;
      body["password_recovery_email"]=backupEmail.trim();
      if(!manual&&values.get("confirm_send")==="on")body["confirm_invitation_email"]=backupEmail.trim();
    }
    if(editor.kind==="create"||editor.kind==="edit")body["name"]=String(values.get("name")||"");
    if(editor.kind==="edit"){
      body["password_recovery_email"]=backupEmail.trim();
      for(const key of ["may_send","may_receive","may_access_imap","may_access_pop3"])body[key]=values.get(key)==="on";
    }
    if(editor.kind==="password"&&!manual&&values.get("confirm_send")==="on"){
      body["confirm_address"]=part+"@"+domain.domain_name;
      body["confirm_recovery_email"]=editor.box?.password_recovery_email||"";
    }
    if(editor.kind==="address"&&values.get("confirm_address_change")==="on"){
      body["new_local_part"]=newPart.trim().toLowerCase();
      body["confirm_address"]=part+"@"+domain.domain_name;
      body["confirm_new_address"]=newPart.trim().toLowerCase()+"@"+domain.domain_name;
    }
    if(editor.kind==="delete")body["confirm_address"]=String(values.get("confirm_address")||"");
    await run(action,body,editor.kind==="create"?"Mailbox aangemaakt.":editor.kind==="password"?"Het nieuwe wachtwoord is ingesteld. Werk het ook bij in de mailapp.":editor.kind==="delete"?"Mailbox verwijderd. Het bewaarde reserveadres blijft beschikbaar.":editor.kind==="address"?"Het gewenste e-mailadres is ingesteld voor dezelfde inbox. Gebruik dit adres in de mailapp; het mailboxwachtwoord blijft hetzelfde.":"Mailbox en reserveadres bijgewerkt.");
    setFormKey(v=>v+1);
  }
  function open(kind:NonNullable<Editor>["kind"],box?:Mailbox){
    setEditor({kind,box});setError("");setMessage("");setFormKey(v=>v+1);
    setPasswordMethod("invitation");setBackupEmail(box?.password_recovery_email||"");
    setNewPart(box?.primary_address&&box.primary_address!==box.address?(box.primary_address.split("@")[0] ?? "info"):"info");
  }
  const active=details?.domain?.can_receive===true&&details?.domain?.can_send===true;
  return <div className="space-y-4">
    {error&&<Alert>{error}</Alert>}
    {message&&<p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="font-semibold">{domain.domain_name}</h3>
      <button type="button" className={button} disabled={busy||loading} onClick={()=>{setError("");void reload();}}><RefreshCw size={14}/> {loading?"Laden…":"Mailboxen vernieuwen"}</button>
    </div>
    {details&&!details.registered&&<div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <h4 className="font-semibold">Dit domein is nog niet beschikbaar in je Migadu-account</h4>
      <p className="text-sm leading-6">Je kunt het hier toevoegen. Migadu maakt ook de standaardadressen admin, postmaster en abuse aan. Daarna kun je de mailinstellingen hier laten controleren en voor gekoppelde Route 53-domeinen automatisch instellen.</p>
      <Field label={"Typ "+domain.domain_name+" om het domein toe te voegen"}><input className={input} value={confirmation} onChange={e=>setConfirmation(e.target.value)} autoComplete="off" disabled={busy}/></Field>
      <button type="button" disabled={busy||confirmation!==domain.domain_name} className={primary} onClick={()=>run("add_domain",{confirm_domain:confirmation},"Domein toegevoegd. Open nu de DNS-instellingen om het in gebruik te nemen.")}>Domein toevoegen aan Migadu</button>
    </div>}
    {details?.registered&&<>
      <div className={"flex flex-wrap items-center justify-between gap-3 rounded-xl p-4 "+(active?"bg-emerald-50":"bg-amber-50")}>
        <div><strong className="text-sm">{active?"Domein actief bij Migadu":"Domein nog niet klaar voor verzenden en ontvangen"}</strong><p className="mt-1 text-xs text-slate-600">{active?"Mailboxen kunnen worden beheerd. Controleer hieronder ook de DNS-health.":"Je kunt mailboxen alvast aanmaken. Rond de DNS-inrichting en activatie af voordat de klant ze gebruikt."}</p></div>
        <button type="button" className={button} disabled={busy||loading} onClick={showRecords}>DNS instellen</button>
      </div>
      {setup&&records&&<MailDnsSetup domainId={domain.id} domainName={domain.domain_name} records={records} activating={busy||loading} onClose={()=>setSetup(false)} onActivate={()=>run("activate_domain",{confirm_domain:domain.domain_name},"Activatie gecontroleerd bij Migadu.")}/>}
      <div className="flex flex-wrap items-center justify-between gap-3"><h4 className="text-sm font-semibold">{details.mailboxes.length} mailbox(en)</h4><button type="button" className={primary} disabled={busy||loading} onClick={()=>open("create")}><Plus size={16}/> Nieuwe mailbox</button></div>
      {!details.mailboxes.length?<p className="rounded-xl border border-dashed p-5 text-sm text-slate-500">Nog geen mailboxen. Maak bijvoorbeeld info@{domain.domain_name} aan.</p>:<div className="divide-y rounded-xl border border-slate-200">{details.mailboxes.map(box=><div className="flex flex-wrap items-center justify-between gap-3 p-4" key={box.local_part}>
        <div className="min-w-0"><strong className="block break-all text-sm">{box.primary_address||box.address||box.local_part+"@"+domain.domain_name}</strong>{box.primary_address&&box.primary_address!==box.local_part+"@"+domain.domain_name&&<span className="mt-1 block text-xs text-slate-500">Eén inbox · onderliggende mailbox {box.local_part}@{domain.domain_name}</span>}{box.password_recovery_email&&<span className="mt-1 block break-all text-xs text-slate-600">Reserveadres: {box.password_recovery_email}</span>}<span className="text-xs text-slate-500">{box.name} · Verzenden {box.may_send?"aan":"uit"} · Ontvangen {box.may_receive?"aan":"uit"}</span></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={button} aria-label={"Aanpassen "+box.local_part+"@"+domain.domain_name} disabled={busy||loading} onClick={()=>open("edit",box)}><Settings2 size={14}/> Aanpassen</button>
          <button type="button" className={button} aria-label={"E-mailadres kiezen voor "+box.local_part+"@"+domain.domain_name} disabled={busy||loading} onClick={()=>open("address",box)}><Mail size={14}/> E-mailadres</button>
          <button type="button" className={button} aria-label={"Wachtwoord wijzigen "+box.local_part+"@"+domain.domain_name} disabled={busy||loading} onClick={()=>open("password",box)}><KeyRound size={14}/> Wachtwoord</button>
          <button type="button" className={button} aria-label={"Verwijderen "+box.local_part+"@"+domain.domain_name} disabled={busy||loading} onClick={()=>open("delete",box)}><Trash2 size={14}/> Verwijderen</button>
        </div>
      </div>)}</div>}
    </>}
    {editor&&<form key={formKey} onSubmit={submit} className="space-y-4 rounded-xl border border-slate-300 bg-slate-50 p-4">
      <h4 className="font-semibold">{editor.kind==="create"?"Nieuwe mailbox":editor.kind==="edit"?"Mailbox aanpassen":editor.kind==="password"?"Wachtwoord herstellen":editor.kind==="address"?"Ander e-mailadres voor dezelfde inbox":"Mailbox definitief verwijderen"}</h4>
      {editor.box&&<p className="break-all text-sm">{editor.box.local_part}@{domain.domain_name}</p>}
      <fieldset disabled={busy||loading} className="space-y-4">
        {editor.kind==="create"&&<Field label="E-mailadres"><div className="mt-1.5 flex flex-wrap items-center gap-2"><input aria-label="Naam vóór het @-teken" className={input+" max-w-xs"} name="local_part" required placeholder="info" maxLength={64} autoComplete="off"/><span className="break-all text-sm">@{domain.domain_name}</span></div></Field>}
        {(editor.kind==="create"||editor.kind==="edit")&&<Field label="Naam"><input className={input} name="name" required maxLength={100} defaultValue={editor.box?.name||""} placeholder="Bijvoorbeeld: NatureHealing"/></Field>}
        {(editor.kind==="create"||editor.kind==="password")&&<Field label="Wachtwoord instellen"><select className={input} value={passwordMethod} onChange={e=>setPasswordMethod(e.target.value)}><option value="invitation">Klant kiest zelf via e-mail (aanbevolen)</option><option value="password">Zelf een wachtwoord instellen</option></select></Field>}
        {(editor.kind==="create"||editor.kind==="edit")&&<div className="space-y-2"><Field label={"Reserve-e-mailadres van de klant"+(editor.kind==="create"&&passwordMethod==="invitation"?" *":"")}><input className={input} type="email" name="password_recovery_email" maxLength={254} required={editor.kind==="create"&&passwordMethod==="invitation"} value={backupEmail} onChange={e=>setBackupEmail(e.target.value)} placeholder="Bijvoorbeeld het persoonlijke Gmail- of Outlook-adres" autoComplete="off"/></Field><p className="text-xs leading-5 text-slate-500">Gebruik een adres buiten {domain.domain_name} waar de klant bij kan als deze mailbox niet werkt. Het wordt ook als apart contactadres in Vedantix bewaard. Dit stelt geen doorstuuradres in.</p></div>}
        {(editor.kind==="create"||editor.kind==="password")&&(passwordMethod==="password"?<PasswordFields/>:<div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4"><p className="text-sm leading-6">Migadu stuurt een uitnodiging waarmee de klant zelf een wachtwoord instelt. Jij ziet het wachtwoord niet.</p>{editor.kind==="password"&&<><p className="break-all text-sm"><strong>Reserveadres:</strong> {editor.box?.password_recovery_email||"Nog niet ingesteld"}</p><button type="button" className={button} onClick={()=>open("edit",editor.box)}>Reserveadres aanpassen</button></>}<label className="flex items-start gap-2 text-sm"><input className="mt-1" type="checkbox" name="confirm_send" required/><span>Stuur de uitnodiging naar <strong className="break-all">{editor.kind==="create"?(backupEmail||"het ingevulde reserveadres"):editor.box?.password_recovery_email||"het reserveadres"}</strong>.</span></label><p className="text-xs leading-5 text-slate-600">Na het kiezen van een nieuw wachtwoord moet de klant dit ook in de mailapp bijwerken.</p></div>)}
        {editor.kind==="address"&&<div className="space-y-3"><p className="text-sm leading-6">Gebruik bijvoorbeeld info@{domain.domain_name} voor dezelfde inbox, bestaande berichten en hetzelfde wachtwoord. De klant kan hiermee inloggen, verzenden en ontvangen. Migadu bewaart {editor.box?.local_part}@{domain.domain_name} als onderliggende mailbox; er komt geen tweede mailbox bij.</p><Field label="Gewenst e-mailadres"><div className="flex flex-wrap items-center gap-2"><input className={input+" max-w-xs"} required maxLength={64} value={newPart} onChange={e=>setNewPart(e.target.value)} autoComplete="off"/><span className="text-sm">@{domain.domain_name}</span></div></Field><label className="flex items-start gap-2 text-sm"><input className="mt-1" type="checkbox" name="confirm_address_change" required/><span>Gebruik <strong className="break-all">{newPart||"…"}@{domain.domain_name}</strong> als adres voor deze bestaande inbox.</span></label></div>}
        {editor.kind==="edit"&&<div className="space-y-2">{[["may_send","E-mail versturen"],["may_receive","E-mail ontvangen"],["may_access_imap","Toegang via IMAP (mailapps)"],["may_access_pop3","Toegang via POP3"]].map(([key,label])=><label className="flex items-center gap-2 text-sm" key={key}><input type="checkbox" name={key} defaultChecked={Boolean(editor.box?.[key as keyof Mailbox])}/>{label}</label>)}<p className="text-xs leading-5 text-slate-500">Gebruik de knop E-mailadres om een ander adres voor dezelfde inbox te kiezen.</p></div>}
        {editor.kind==="delete"&&<><p className="text-sm font-medium text-red-800">Dit verwijdert de mailbox en de opgeslagen e-mails bij Migadu. Maak eerst een back-up als je de berichten wilt bewaren. Deze actie kan niet via Vedantix ongedaan worden gemaakt.</p><Field label="Typ het volledige e-mailadres ter bevestiging"><input className={input} name="confirm_address" required autoComplete="off" placeholder={editor.box?.local_part+"@"+domain.domain_name}/></Field></>}
      </fieldset>
      <div className="flex flex-wrap gap-2"><button className={primary+(editor.kind==="delete"?" bg-red-700 hover:bg-red-800":"")} disabled={busy||loading||(editor.kind==="password"&&passwordMethod==="invitation"&&!editor.box?.password_recovery_email)}>{busy?"Bezig…":editor.kind==="delete"?"Definitief verwijderen":editor.kind==="create"?(passwordMethod==="invitation"?"Mailbox aanmaken en klant uitnodigen":"Mailbox aanmaken"):editor.kind==="password"&&passwordMethod==="invitation"?"Uitnodiging aanvragen":editor.kind==="address"?"E-mailadres gebruiken":"Opslaan"}</button><button className={button} type="button" disabled={busy} onClick={()=>setEditor(null)}>Annuleren</button></div>
    </form>}
  </div>;
}


