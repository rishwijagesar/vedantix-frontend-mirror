import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";
import { GENERAL_TERMS } from "./general-terms.ts";

export async function buildTermsPdf() {
  const pdf=await PDFDocument.create();
  pdf.setTitle("Algemene voorwaarden Vedantix - "+GENERAL_TERMS.dateLabel);
  pdf.setSubject("Gepubliceerde versie "+GENERAL_TERMS.version+" - "+GENERAL_TERMS.canonical);
  const regular=await pdf.embedFont(StandardFonts.Helvetica), bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  const width=595.28,height=841.89,margin=46;
  const dark=rgb(.06,.09,.16), muted=rgb(.35,.39,.46);
  let page=pdf.addPage([width,height]),y=height-55;
  const ensure=(heightNeeded:number)=>{if(y-heightNeeded<60){page=pdf.addPage([width,height]);y=height-55;}};
  const write=(text:string,size=9.5,font=regular)=>{
    let line="";
    const words=text.replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[–—]/g,"-").split(/\s+/);
    for(const word of words){
      const next=line?line+" "+word:word;
      if(font.widthOfTextAtSize(next,size)>width-2*margin && line){ensure(15);page.drawText(line,{x:margin,y,size,font,color:dark});y-=14;line=word;}
      else line=next;
    }
    if(line){ensure(15);page.drawText(line,{x:margin,y,size,font,color:dark});y-=14;}
  };
  write("VEDANTIX",20,bold);y-=18;
  write("Algemene voorwaarden",18,bold);y-=7;
  write("Versie "+GENERAL_TERMS.dateLabel,10);write(GENERAL_TERMS.canonical,9);y-=18;
  for(const section of GENERAL_TERMS.sections){
    ensure(55);write(section.title,11,bold);y-=7;
    for(const block of section.blocks){write((block.kind==="li"?"- ":"")+block.text);y-=6;}
    y-=9;
  }
  ensure(45);write("Vragen over deze voorwaarden? admin@vedantix.nl",9);
  pdf.getPages().forEach((p,i)=>p.drawText("Vedantix - voorwaarden "+GENERAL_TERMS.version+" - "+(i+1)+"/"+pdf.getPageCount(),{x:margin,y:28,size:7,font:regular,color:muted}));
  return pdf.save();
}
