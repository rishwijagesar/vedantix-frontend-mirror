// Allow only public marketing routes. Customer document tokens must never reach Analytics.
export function analyticsPublicPath(path: string) {
  return /^(?:\/(?:diensten|ai-oplossingen|webapps-klantportalen|mobiele-apps|koppelingen-automatisering|prijzen|proces|resultaten|contact|faq|groeimodel|starters|templates|voorwie|ai-vindbaarheid|online-groei-audit|privacy|terms|data-deletion|planning|vedantixhome)?\/?|\/blog(?:\/[a-z0-9-]+)?\/?|\/website-[a-z0-9-]+\/?|\/website\/[a-z0-9-]+(?:\/[a-z0-9-]+)?\/?)$/.test(path);
}
export function safeAnalyticsPage(origin: string, path: string) { return { page_location: origin + path, page_referrer: '', page_title: '', send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false }; }
