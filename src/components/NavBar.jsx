import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { ChevronDown, ArrowUpRight, Globe2, Server, Wrench, LayoutDashboard, PanelsTopLeft, Smartphone, Sparkles, Workflow, Search, Megaphone, Bot, Menu, X } from "lucide-react";
import { SERVICE_GROUPS } from "../data/service-navigation";
import VedantixLogo from "./VedantixLogo";
import "../styles/navbar.css";
const icons={Globe2,Server,Wrench,LayoutDashboard,PanelsTopLeft,Smartphone,Sparkles,Workflow,Search,Megaphone,Bot};
export default function NavBar(){
 const location=useLocation();const home=location.pathname==="/";const [scrolled,setScrolled]=useState(false);const [mobile,setMobile]=useState(false);const [services,setServices]=useState(false);const [group,setGroup]=useState(null);const root=useRef(null);const trigger=useRef(null);const menuToggle=useRef(null);const timer=useRef(null);
 const close=()=>{setServices(false);setMobile(false);setGroup(null);};
 const cancel=()=>{if(timer.current)clearTimeout(timer.current);};
 const enter=()=>{cancel();if(matchMedia('(min-width: 1101px) and (hover: hover)').matches)setServices(true);};
 const leave=()=>{cancel();timer.current=setTimeout(()=>{if(!root.current?.contains(document.activeElement))setServices(false);},180);};
 useEffect(()=>{close();},[location.pathname]);
 useEffect(()=>{if(!home)document.body.setAttribute('data-has-fixed-navbar','true');else document.body.removeAttribute('data-has-fixed-navbar');const scroll=()=>setScrolled(scrollY>40);scroll();window.addEventListener('scroll',scroll,{passive:true});return()=>{document.body.removeAttribute('data-has-fixed-navbar');window.removeEventListener('scroll',scroll);};},[home]);
 useEffect(()=>{const outside=e=>{if(!root.current?.contains(e.target))close();};document.addEventListener('pointerdown',outside);return()=>{document.removeEventListener('pointerdown',outside);cancel();};},[]);
 useEffect(()=>{const escape=e=>{if(e.key==='Escape'&&(services||mobile)){e.preventDefault();cancel();close();(services?trigger.current:menuToggle.current)?.focus();}};document.addEventListener('keydown',escape);return()=>document.removeEventListener('keydown',escape);},[services,mobile]);
 function key(event){if(event.key==='Escape'){event.preventDefault();const wasServices=services;close();(wasServices?trigger.current:menuToggle.current)?.focus();}}
 return <header ref={root} className={`site-header${scrolled||!home||services||mobile?' is-solid': ' is-home'}`} onKeyDown={key} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))close();}}><div className="site-header-inner">
  <Link to="/" className="site-brand" aria-label="Vedantix home"><VedantixLogo variant="full" size="md" theme={scrolled||!home||services||mobile?'dark':'light'}/></Link>
  <nav className="site-nav" aria-label="Hoofdnavigatie">
   <Button ref={menuToggle} variant="ghost" className="site-menu-toggle" aria-label={mobile?'Menu sluiten':'Menu openen'} aria-expanded={mobile} aria-controls="site-main-links" onClick={()=>{setMobile(v=>!v);setServices(false);}}>{mobile?<X/>:<Menu/>}<span>{mobile?'Sluiten':'Menu'}</span></Button>
   <div id="site-main-links" className={`site-nav-links${mobile?' is-open':''}`}>
    <div className="site-services" onMouseEnter={enter} onMouseLeave={leave}>
     <Button ref={trigger} variant="ghost" className="site-nav-link site-services-trigger" aria-expanded={services} aria-controls="site-services-panel" onClick={()=>{cancel();setServices(v=>!v);}} onKeyDown={e=>{if(e.key==='ArrowDown'){e.preventDefault();setServices(true);requestAnimationFrame(()=>root.current?.querySelector('#site-services-panel a')?.focus());}}}>Diensten<ChevronDown className={services?'is-turned':''}/></Button>
     <div id="site-services-panel" className="site-megamenu" hidden={!services} onMouseEnter={cancel}>
      <div className="site-megamenu-heading"><Link to="/diensten" onClick={close}>Alle diensten <ArrowUpRight/></Link><span>Van een sterke website tot één centrale werkplek.</span></div>
      <div className="site-megamenu-groups">{SERVICE_GROUPS.map((g,i)=><section key={g.name} className="site-service-group"><h2 className="site-group-desktop">{g.name}</h2><Button variant="ghost" className="site-group-toggle" aria-expanded={group===i} aria-controls={`service-group-${i}`} onClick={()=>setGroup(group===i?null:i)}>{g.name}<ChevronDown/></Button><div id={`service-group-${i}`} className={`site-group-items${group===i?' is-expanded':''}`}>{g.items.map(item=>{const Icon=icons[item.icon];return <Link key={item.href} to={item.href} className="site-service-item" onClick={close}><span className="site-service-icon"><Icon/></span><span><strong>{item.label}</strong><small>{item.description}</small></span><ArrowUpRight className="site-service-arrow"/></Link>;})}</div></section>)}</div>
     </div>
    </div>
    {[['/software-op-maat','Software op maat'],['/prijzen','Prijzen'],['/proces','Werkwijze'],['/resultaten','Resultaten'],['/over-ons','Over ons'],['/contact','Contact']].map(([to,label])=><Link key={to} to={to} className="site-nav-link" onClick={close}>{label}</Link>)}
    <Link to="/contact#contact-form" className="site-mobile-cta" onClick={close}>Plan een bedrijfsscan <ArrowUpRight/></Link>
   </div>
   <Link to="/contact#contact-form" className="site-nav-cta" onClick={close}>Plan een bedrijfsscan →</Link>
  </nav></div></header>;
}
