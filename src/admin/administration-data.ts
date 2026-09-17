import { supabase } from '@/lib/supabase';
import { type AdminData, type Entry, type Bank, type Evidence, fileDetails } from './administration-model';
const bucket = 'administration-evidence';
export async function allRows(table: string, columns = '*'): Promise<any[]> {
  const rows: any[] = [];
  for (let from = 0;; from += 500) {
    const { data,error } = await supabase.from(table).select(columns).order('id').range(from,from+499);
    if (error) throw new Error('Administratie kon niet volledig worden geladen. Probeer opnieuw.');
    rows.push(...(data || []));
    if (!data || data.length < 500) return rows;
  }
}
export async function loadAdministration(): Promise<AdminData> {
  const { data: allowed, error } = await supabase.rpc('is_staff',{ required_roles:['ADMIN'] });
  if (error || !allowed) throw new Error('Alleen beheerders kunnen deze administratie openen.');
  const [entries,bank,documents,invoices,credits,payments,contracts,requests] = await Promise.all([
    allRows('administration_entries'),allRows('administration_bank'),allRows('administration_documents'),
    allRows('invoices','id,invoice_number,invoice_date,title,status,is_active,finalized_at,total_ex_vat,vat_total,total_incl_vat,customer_snapshot,invoice_items(vat_rate,line_total_ex_vat,line_vat)'),
    allRows('credit_notes','id,invoice_id,credit_number,credit_date,status,finalized_at,total_ex_vat,vat_total,total_incl_vat'),
    allRows('invoice_payments','id,invoice_id,amount,payment_date,voided_at,metadata'),
    allRows('contracts','id,contract_number,title'),
    allRows('payment_requests','id,invoice_id,metadata'),
  ]);
  return { entries,bank,documents,invoices,credits,payments,contracts,test_invoice_ids:requests.filter(r=>String(r.metadata?.test_fixture||'').toLowerCase()==='true'||String(r.metadata?.mollie_mode||'').toLowerCase()==='test').map(r=>r.invoice_id) };
}
export async function saveRecord(table: 'administration_entries' | 'administration_bank' | 'administration_documents', values: Record<string,unknown>, existing?: Pick<Entry | Bank | Evidence,'id' | 'revision'>) {
  const request = existing ? supabase.from(table).update(values).eq('id',existing.id).eq('revision',existing.revision) : supabase.from(table).insert(values);
  const { data,error } = await request.select().maybeSingle();
  if (error) {
    if (error.code === '23505') throw new Error('Deze leverancier en dit factuurnummer, of deze bankreferentie, zijn al vastgelegd. Controleer op een dubbele boeking.');
    if (error.code === 'P0001') throw new Error(error.message);
    throw new Error('Opslaan mislukt. Controleer de bedragen en verplichte velden, of vernieuw je sessie.');
  }
  if (!data) throw new Error('Deze boeking is ondertussen gewijzigd. Vernieuw het overzicht voordat je opnieuw opslaat.');
  return data;
}
export async function uploadEvidence(file: File, values: Record<string,unknown>) {
  const { ext,mime } = fileDetails(file.name,file.size);
  const sha256 = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))).map(b=>b.toString(16).padStart(2,'0')).join('');
  const id = crypto.randomUUID();
  const path = `${id}/original.${ext}`;
  const doc = await saveRecord('administration_documents',{ ...values,id,filename:file.name,object_path:path,mime_type:mime,byte_size:file.size,sha256,status:'PENDING' });
  const { error } = await supabase.storage.from(bucket).upload(path,file,{ contentType:mime,upsert:false });
  if (error) throw new Error(`Upload van ${file.name} is niet voltooid. Het bewijsstuk staat als onvolledig in het archief; probeer de upload opnieuw.`);
  return saveRecord('administration_documents',{ status:'READY' },doc);
}
export async function evidenceBytes(doc: Evidence) {
  const { data,error } = await supabase.storage.from(bucket).download(doc.object_path);
  if (error || !data) throw new Error(`Download van ${doc.filename} mislukt.`);
  const bytes = new Uint8Array(await data.arrayBuffer());
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(b=>b.toString(16).padStart(2,'0')).join('');
  if (hash !== doc.sha256) throw new Error(`Bestandscontrole mislukt voor ${doc.filename}.`);
  return bytes;
}
export function downloadBlob(blob: Blob, name: string) {
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export async function historyFor(entity: string,id: string) {
  const { data,error }=await supabase.from('administration_history').select('id,action,occurred_at,old_data,new_data').eq('entity',entity).eq('entity_id',id).order('id',{ascending:false});
  if(error) throw new Error('Wijzigingshistorie kon niet worden geladen.');return data || [];
}
