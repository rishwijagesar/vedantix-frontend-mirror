import { csv, inPeriod, safeFilename, entryAmounts, summarize, type AdminData, type Period, type Evidence } from './administration-model.ts';
// ZIP STORE (no compression), UTF-8 filenames, CRC-32. No service receives the archive.
export function zipStore(files: { name: string; bytes: Uint8Array }[]): Uint8Array {
  const encoder = new TextEncoder();
  const locals: Uint8Array[] = [], central: Uint8Array[] = [];
  let offset = 0;
  const crc = (bytes: Uint8Array) => { let c=0xffffffff;for(const b of bytes){c^=b;for(let n=0;n<8;n++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0; };
  for(const file of files){
    const name=encoder.encode(file.name);const checksum=crc(file.bytes);
    const local=new Uint8Array(30+name.length);const l=new DataView(local.buffer);
    l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x800,true);l.setUint16(12,33,true);
    l.setUint32(14,checksum,true);l.setUint32(18,file.bytes.length,true);l.setUint32(22,file.bytes.length,true);l.setUint16(26,name.length,true);local.set(name,30);
    const directory=new Uint8Array(46+name.length);const d=new DataView(directory.buffer);
    d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x800,true);d.setUint16(14,33,true);
    d.setUint32(16,checksum,true);d.setUint32(20,file.bytes.length,true);d.setUint32(24,file.bytes.length,true);d.setUint16(28,name.length,true);d.setUint32(42,offset,true);directory.set(name,46);
    locals.push(local,file.bytes);central.push(directory);offset+=local.length+file.bytes.length;
  }
  const centralSize=central.reduce((n,b)=>n+b.length,0);const end=new Uint8Array(22);const e=new DataView(end.buffer);
  e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,centralSize,true);e.setUint32(16,offset,true);
  const output=new Uint8Array(offset+centralSize+22);let cursor=0;for(const part of [...locals,...central,end]){output.set(part,cursor);cursor+=part.length;}return output;
}
export function evidenceForPeriod(data: AdminData,p: Period) {
  const entries=new Set(data.entries.filter(e=>inPeriod(e.entry_date,p)).map(e=>e.id));
  const bank=new Set(data.bank.filter(b=>inPeriod(b.transaction_date,p)).map(b=>b.id));
  const invoices=new Set(data.invoices.filter(i=>inPeriod(i.invoice_date,p)).map(i=>i.id));
  return data.documents.filter(d=>inPeriod(d.document_date,p) || (d.entry_id && entries.has(d.entry_id)) || (d.bank_id && bank.has(d.bank_id)) || (d.invoice_id && invoices.has(d.invoice_id)));
}
export function exportFiles(data: AdminData,p: Period) {
  const s=summarize(data,p), documents=evidenceForPeriod(data,p);
  const entries=data.entries.filter(e=>inPeriod(e.entry_date,p)),bank=data.bank.filter(b=>inPeriod(b.transaction_date,p));
  const text=(name:string,content:string)=>({name,bytes:new TextEncoder().encode(content)});
  const rows=entries.flatMap(e=>e.lines.map((l,i)=>[e.id,e.entry_date,e.supplier,e.document_number,e.document_kind,e.description,e.category,e.treatment,e.business_percent,i+1,l.code,l.base,l.vat,l.deductible,e.vat_reviewed,e.void_reason || '',e.notes]));
  return [
    text('LEESMIJ.txt',`Vedantix administratie — ${p.label}\nPeriode: ${p.start} t/m ${p.end}\nGemaakt: ${new Date().toISOString()}\nBedragen in EUR. Inkoopbedragen zijn positief ingevuld; CREDIT draait het teken om. Verkoopcreditnota's zijn al negatief.\nOmzet/resultaat en btw zijn een voorbereiding op basis van factuurdatum, geen ingediende aangifte of fiscale winstberekening. Kosten bevatten het zakelijke deel en niet-teruggevraagde btw. Investeringen zijn uitgesloten van resultaat; afschrijving moet apart worden verwerkt.\nBuitenlandse/verlegde btw, privégebruik, KOR, balans, periodecorrecties en fiscale aftrek moeten afzonderlijk worden gecontroleerd. Bankregels zijn handmatig geregistreerd en geen automatisch banksaldo; ze wijzigen bestaande verkoopbetalingen niet.\nGeen automatische verzending naar e-Boekhouden. De CSV-bestanden zijn algemene controlegegevens, geen gegarandeerd e-Boekhouden-importformaat.\nBewijsstukken worden in originele vorm opgenomen; manifest bevat koppelingen en SHA-256. Bij een ontbrekend of beschadigd READY-bestand wordt deze export afgebroken. PENDING-documenten zijn onvolledige uploads, geen bewaard bewijs.\nBrongegevens.json bevat ook eerdere perioden voor aansluitingen/openstaande bedragen. Bewaar de ZIP veilig. Verkoopfactuur-PDF's en contract-PDF's blijven via de bestaande documentdownloads beschikbaar.\n`),
    text('kosten-en-aankopen.csv',csv([['id','factuurdatum','leverancier','factuurnummer','soort','omschrijving','categorie','verwerking','zakelijk_percentage','regel','btw_code','ex_btw','btw','terug_te_vragen_btw','btw_gecontroleerd','vervallen_reden','notities'],...rows])),
    text('verkoop.csv',csv([['id','nummer','datum','soort','ex_btw','btw','incl_btw'],...s.sales.map(i=>[i.id,i.invoice_number,i.invoice_date,'FACTUUR',i.total_ex_vat,i.vat_total,i.total_incl_vat]),...s.credits.map(c=>[c.id,c.credit_number,c.credit_date,'CREDITNOTA',c.total_ex_vat,c.vat_total,c.total_incl_vat])])),
    text('bank-en-kas.csv',csv([['id','datum','rekening','omschrijving','bedrag','referentie','soort','inkoop_id','factuur_id','vervallen_reden'],...bank.map(b=>[b.id,b.transaction_date,b.account,b.description,b.amount,b.reference,b.kind,b.entry_id,b.invoice_id,b.void_reason])])),
    text('overzicht.csv',csv([['periode','omzet_ex_btw','kosten_inclusief_niet_aftrekbare_btw','voorlopig_resultaat','verkoop_btw','gecontroleerde_inkoop_btw','voorlopig_btw_verschil','investeringen','klanten_open_einde_periode','leveranciers_open_einde_periode'],[p.label,s.revenue,s.costs,s.result,s.outputVat,s.inputVat,s.vatDifference,s.investments,s.outstanding,s.payable]])),
    text('bewijsstukken.csv',csv([['id','datum','bestand','status','sha256','inkoop_id','bank_id','factuur_id','contract_id','notitie'],...documents.map(d=>[d.id,d.document_date,d.filename,d.status,d.sha256,d.entry_id,d.bank_id,d.invoice_id,d.contract_id,d.note])])),
    text('brongegevens.json',JSON.stringify({period:p,data},null,2)),
  ];
}
export async function makeAdministrationZip(data:AdminData,p:Period,read:(d:Evidence)=>Promise<Uint8Array>,history:unknown[]=[],progress?:(done:number,total:number)=>void) {
  const docs=evidenceForPeriod(data,p).filter(d=>d.status==='READY');
  if(docs.reduce((n,d)=>n+d.byte_size,0)>200*1024*1024)throw new Error('Deze selectie bevat meer dan 200 MB bewijs. Exporteer per kwartaal of download grote bestanden afzonderlijk.');
  const files=exportFiles(data,p);files.push({name:'wijzigingshistorie.json',bytes:new TextEncoder().encode(JSON.stringify(history,null,2))});
  for(let i=0;i<docs.length;i++){const d=docs[i];files.push({name:`bewijsstukken/${d.id}-${safeFilename(d.filename)}`,bytes:await read(d)});progress?.(i+1,docs.length);}
  return zipStore(files);
}
