import { useEffect, useState } from "react";
import { mailAction, type MailContact } from "./mail-management-data";

export function SavedMailContacts({domainId,domainName,revision}:{domainId:string;domainName:string;revision:number}) {
  const [contacts,setContacts]=useState<MailContact[]>([]);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  async function load() {
    setLoading(true);setError("");
    try {setContacts((await mailAction("contacts",{domain_id:domainId})).contacts);}
    catch(e) {setError(e instanceof Error?e.message:"Reserveadressen konden niet worden geladen.");}
    finally {setLoading(false);}
  }
  useEffect(()=>{void load();},[domainId,revision]);
  return <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4" aria-label="Bewaarde reserveadressen">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">Bewaarde reserveadressen</h3><button type="button" className="text-xs underline disabled:opacity-50" disabled={loading} onClick={load}>Vernieuwen</button></div>
    <p className="text-xs leading-5 text-slate-600">Deze contactadressen blijven in Vedantix bewaard wanneer je een mailbox verwijdert of Migadu loskoppelt. Ze worden niet gebruikt om inkomende mail door te sturen.</p>
    {error&&<p role="alert" className="text-sm text-red-800">{error}</p>}
    {loading?<p className="text-xs text-slate-500">Laden…</p>:contacts.some(c=>c.recovery_email)?<ul className="divide-y divide-slate-200">{contacts.filter(c=>c.recovery_email).map(c=><li key={c.local_part} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><span className="break-all">{c.preferred_local_part||c.local_part}@{domainName}</span><a className="break-all text-blue-700 underline" href={"mailto:"+encodeURIComponent(c.recovery_email!)}>{c.recovery_email}</a></li>)}</ul>:<p className="text-xs text-slate-500">Nog geen reserveadres bewaard. Voeg dit toe bij het aanmaken of aanpassen van een mailbox.</p>}
  </section>;
}
