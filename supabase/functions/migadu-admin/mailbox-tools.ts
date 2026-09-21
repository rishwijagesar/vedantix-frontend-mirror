import { MailError, listFrom, localPart, recoveryEmail, type MigaduCall } from "./api.ts";

export async function sendInvitation(api:MigaduCall, mailbox:string, body:any, domain:string) {
  const current=await api(mailbox);
  const recipient=recoveryEmail(current?.password_recovery_email,domain,true);
  if(recoveryEmail(body.confirm_recovery_email,domain,true)!==recipient || body.confirm_address!==localPart(body.local_part)+"@"+domain)
    throw new MailError("Het mailbox- of reserveadres is gewijzigd. Vernieuw het overzicht en bevestig opnieuw.",409);
  if(body.password || body.password_recovery_email!==undefined)
    throw new MailError("Sla een ander reserveadres eerst apart op. Een uitnodiging bevat geen wachtwoord.");
  // Native Migadu invitation flow: provider owns the link, expiry and password entry.
  // No generated password, reset token or provider response reaches the admin browser.
  await api(mailbox,"PUT",{password_method:"invitation",password_recovery_email:recipient});
  return recipient;
}

export function usableIdentity(identity:any, target:string):boolean {
  return String(identity?.local_part).toLowerCase()===target && identity.password_use==="mailbox"
    && identity.may_send===true && identity.may_receive===true && identity.may_access_imap===true;
}

export async function usePrimaryAddress(api:MigaduCall, base:string, parent:string, body:any, domain:string) {
  const target=localPart(body.new_local_part);
  if(body.confirm_address!==parent+"@"+domain || body.confirm_new_address!==target+"@"+domain)
    throw new MailError("Bevestig het huidige en het gewenste e-mailadres.");
  const mailbox=base+"/mailboxes/"+encodeURIComponent(parent);
  const current=await api(mailbox);
  if(target===parent) return {target,current};
  const identities=listFrom(await api(mailbox+"/identities"),"identities");
  const existing=identities.find(i=>String(i.local_part).toLowerCase()===target);
  if(existing) {
    if(!usableIdentity(existing,target))
      throw new MailError("Dit adres bestaat al met andere toegangsinstellingen. Die worden niet automatisch veranderd.",409);
  } else {
    const boxes=listFrom(await api(base+"/mailboxes"),"mailboxes");
    const aliases=listFrom(await api(base+"/aliases"),"aliases");
    if([...boxes,...aliases].some(v=>String(v.local_part).toLowerCase()===target))
      throw new MailError("Dit adres is al in gebruik. Kies een vrij adres; bestaande mailboxen en berichten worden niet samengevoegd of verwijderd.",409);
    await api(mailbox+"/identities","POST",{local_part:target,name:String(current.name||target).slice(0,100),password_use:"mailbox",may_send:true,may_receive:true,may_access_imap:true,may_access_pop3:current.may_access_pop3===true});
    const verified=await api(mailbox+"/identities/"+encodeURIComponent(target));
    if(!usableIdentity(verified,target)) throw new MailError("Het adres is mogelijk aangemaakt, maar de toegang is nog niet bevestigd. Vernieuw eerst het overzicht.",502);
  }
  return {target,current};
}
