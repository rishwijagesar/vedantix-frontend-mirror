import { useEffect, useState } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { supabase } from '@/lib/supabase';
import { analyticsPublicPath, safeAnalyticsPage } from '@/lib/website-analytics';
import { MARKETING_CONSENT_EVENT, readMarketingConsent } from '@/lib/marketing-consent';
let configured: string | null = null;
function stop() { const w = window as any; if (configured) w['ga-disable-' + configured] = true; }
export default function WebsiteAnalytics() {
  const path = useRouterState({ select: state => state.location.pathname });
  const [consent, setConsent] = useState<string | null>(null);
  useEffect(() => { setConsent(readMarketingConsent()); const sync = () => { const value = readMarketingConsent(); if (value !== 'granted') stop(); setConsent(value); }; window.addEventListener(MARKETING_CONSENT_EVENT, sync); window.addEventListener('storage', sync); return () => { window.removeEventListener(MARKETING_CONSENT_EVENT, sync); window.removeEventListener('storage', sync); stop(); }; }, []);
  useEffect(() => {
    let cancelled = false;
    if (consent !== 'granted' || !analyticsPublicPath(path)) { stop(); return; }
    // Read public ID on each navigation; paused/disconnected sites stop sending page views.
    void Promise.resolve(supabase.rpc('website_analytics_config', { p_origin: window.location.origin })).then(({ data, error }) => {
      if (cancelled || error || readMarketingConsent() !== 'granted') return;
      if (typeof data !== 'string' || !/^G-[A-Z0-9]+$/.test(data)) { stop(); return; }
      const w = window as any;
      if (configured && configured !== data) stop();
      w['ga-disable-' + data] = false;
      w.dataLayer = w.dataLayer || [];
      w.gtag = w.gtag || function () { w.dataLayer.push(arguments); };
      const page = safeAnalyticsPage(window.location.origin, path);
      if (configured !== data) {
        configured = data;
        w.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
        w.gtag('js', new Date());
        w.gtag('config', data, page);
        const script = document.createElement('script'); script.async = true; script.src = 'https://www.googletagmanager.com/gtag/js?id=' + data; document.head.appendChild(script);
      }
      w.gtag('set', page);
      w.gtag('event', 'page_view', { ...page, send_to: data });
    }).catch(() => { /* Analytics failure must never interrupt the website. */ });
    return () => { cancelled = true; stop(); };
  }, [consent, path]);
  return null;
}
