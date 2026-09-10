import { supabase } from "@/lib/supabase";

export type WebsitePreviewLink = {
  id: string;
  website_id: string;
  public_token: string;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
  last_opened_at: string | null;
  open_count: number;
};

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function listWebsitePreviewLinks(): Promise<WebsitePreviewLink[]> {
  const { data, error } = await supabase
    .from("website_preview_links")
    .select("id,website_id,public_token,expires_at,revoked_at,created_at,last_opened_at,open_count")
    .order("created_at", { ascending: false });
  throwIfError(error);
  return (data ?? []) as WebsitePreviewLink[];
}

export async function createWebsitePreviewLink(websiteId: string, validDays: number): Promise<void> {
  const { error } = await supabase.rpc("create_website_preview_link", {
    p_website_id: websiteId,
    p_valid_days: validDays,
  });
  throwIfError(error);
}

export async function revokeWebsitePreviewLink(linkId: string): Promise<void> {
  const { error } = await supabase.rpc("revoke_website_preview_link", { p_link_id: linkId });
  throwIfError(error);
}

export function publicPreviewUrl(token: string) {
  return `https://vedantix.nl/preview/${token}`;
}
