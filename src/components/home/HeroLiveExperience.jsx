import { useEffect, useRef, useState } from "react";
import { CalendarDays, Users, Check, Megaphone, FileText, ArrowRight, LayoutDashboard, Pause, Play, CircleCheck, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import VedantixLogo from "../VedantixLogo";
import "../../styles/hero-live-experience.css";
const tools = [{name:"Planning", Icon:CalendarDays},{name:"Klanten", Icon:Users},{name:"Taken", Icon:Check},{name:"Marketing", Icon:Megaphone},{name:"Facturen", Icon:FileText}];
export default function HeroLiveExperience() {
 const [paused,setPaused]=useState(false);const [reduced,setReduced]=useState(false);const [visible,setVisible]=useState(true);const root=useRef(null);
 useEffect(()=>{const media=matchMedia("(prefers-reduced-motion: reduce)");const update=()=>setReduced(media.matches);const visibility=()=>setVisible(!document.hidden);update();visibility();media.addEventListener("change",update);document.addEventListener("visibilitychange",visibility);const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting&&!document.hidden));if(root.current)observer.observe(root.current);return()=>{media.removeEventListener("change",update);document.removeEventListener("visibilitychange",visibility);observer.disconnect();};},[]);
 return <figure ref={root} className="workspace-scene" data-paused={paused||!visible} data-reduced={reduced} aria-label="Illustratief voorbeeld: losse planning, klanten, taken, marketing en facturen komen samen in één Vedantix-werkplek.">
  <div className="workspace-caption"><span>ILLUSTRATIEF VOORBEELD</span><Button variant="ghost" size="icon" className="workspace-control" disabled={reduced} title={reduced?"Statische weergave bij verminderde beweging":paused?"Animatie afspelen":"Animatie pauzeren"} aria-label={paused?"Animatie afspelen":"Animatie pauzeren"} aria-pressed={paused} onClick={()=>setPaused(p=>!p)}>{paused?<Play/>:<Pause/>}</Button></div>
  <svg className="workspace-connections" viewBox="0 0 600 480" aria-hidden="true"><path d="M70 80 Q170 80 300 220 M530 90 Q420 90 300 220 M70 350 Q160 350 300 220 M530 350 Q450 350 300 220 M300 440 L300 260"/></svg>
  <div className="workspace-dashboard">
   <div className="workspace-bar"><VedantixLogo variant="full" size="sm" theme="dark"/><span>Jouw werkplek</span><span className="workspace-avatar">V</span></div>
   <div className="workspace-body"><aside className="workspace-sidebar"><span className="workspace-selected"><LayoutDashboard/>Overzicht</span><span><Users/>Klanten</span><span><CalendarDays/>Planning</span><span><FileText/>Offertes</span><span><Megaphone/>Marketing</span></aside>
   <div className="workspace-main"><div className="workspace-heading"><div><small>Alles verbonden</small><strong>Goedemorgen, team.</strong></div><span className="workspace-online"><span/>Actueel</span></div>
   <div className="workspace-flow"><span><CircleCheck/>Aanvraag</span><ArrowRight/><span><FileText/>Offerte</span><ArrowRight/><span><CalendarDays/>Planning</span></div>
   <div className="workspace-record"><span className="workspace-record-icon"><Users/></span><div><strong>Voorbeeldbedrijf</strong><small>Aanvraag · offerte · afspraak</small></div><span className="workspace-tag">Verbonden</span></div>
   <div className="workspace-task-heading"><strong>Vandaag op de planning</strong><span>Gedeeld met je team</span></div>
   <div className="workspace-task"><CircleCheck/><span>Klantaanvraag bespreken<small>Sales · Voorbeeldbedrijf</small></span><b>09:30</b></div>
   <div className="workspace-task"><FileText/><span>Offerte voorbereiden<small>Sales & finance · dezelfde gegevens</small></span><b>11:00</b></div>
   <div className="workspace-task"><CalendarDays/><span>Uitvoering inplannen<small>Planning · na akkoord</small></span><b>14:00</b></div>
   </div></div><div className="workspace-bottom"><span><Check/> Eén centrale werkplek</span><span>Gegevens bij elkaar</span></div>
  </div>
  {tools.map(({name,Icon},i)=><div key={name} className={`workspace-tool workspace-tool-${i}`}><span><Icon/></span><strong>{name}</strong><small>Verbonden in je app</small></div>)}
  <div className="workspace-notification"><span><Bell/></span><div><strong>Aanvraag klaar voor opvolging</strong><small>Klantgegevens direct bij de offerte</small></div><CircleCheck/></div>
 </figure>;
}
