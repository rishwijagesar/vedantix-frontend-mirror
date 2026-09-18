import { supabase } from "@/lib/supabase";
export type MailConfig = { connected:boolean;account_email:string|null;last_verified_at:string|null };
export type Mailbox = { local_part:string;address:string;name:string;may_send:boolean;may_receive:boolean;may_access_imap:boolean;may_access_pop3:boolean };
export type MailDomain = { registered:boolean;domain:{name:string;state:string;can_send:boolean;can_receive:boolean}|null;mailboxes:Mailbox[] };
export type DnsRecord = { purpose:string;name:string;type:string;value:string;priority:number|null };
export async function mailAction(action:string, body:Record<string,unknown>={}) {
  const {data,error}=await supabase.functions.invoke("migadu-admin",{
    body:{...body,action,request_id:crypto.randomUUID()},
  });
  if(error) {
    let message="Mailboxbeheer is tijdelijk niet bereikbaar. Probeer opnieuw.";
    if(error.context instanceof Response) {
      try { const details=await error.context.clone().json(); if(typeof details?.error==="string") message=details.error; } catch { /* Use a safe fallback. */ }
    }
    throw new Error(message);
  }
  if(!data?.ok) throw new Error(data?.error || "Het verzoek is niet bevestigd.");
  return data;
}
