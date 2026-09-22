import { supabase } from '@/lib/supabase';
export type GoogleConnection = { id: string; label: string; client_email: string; updated_at: string };
export type InsightSettings = { pagespeed_enabled: boolean; pagespeed_path: string; pagespeed_devices: string[]; ga_enabled: boolean; ga_connection_id: string | null; ga_property: string | null; ga_stream: string | null; ga_measurement_id: string | null; ga_pending: boolean; ga_property_info: any };
export type InsightRun = { id: string; kind: 'pagespeed' | 'analytics'; status: string; target_url: string; note: string; result: any; error: string | null; created_at: string };
export const defaultSettings: InsightSettings = { pagespeed_enabled: false, pagespeed_path: '/', pagespeed_devices: ['mobile', 'desktop'], ga_enabled: false, ga_connection_id: null, ga_property: null, ga_stream: null, ga_measurement_id: null, ga_pending: false, ga_property_info: null };
export async function insights(action: string, input: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('website-insights', { body: { ...input, action, request_id: crypto.randomUUID() } });
  if (error) {
    let message = 'De aanvraag kon niet worden afgerond. Vernieuw het overzicht.';
    try { const body = await error.context?.json(); if (typeof body?.error === 'string') message = body.error; } catch { /* Keep the safe fallback. */ }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}
