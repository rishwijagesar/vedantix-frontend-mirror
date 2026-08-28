import { supabase } from "@/lib/supabase";

export type StaffRole = "ADMIN" | "OPERATOR" | "READ_ONLY";

export type StaffUser = {
  user_id: string;
  role: StaffRole;
  active: boolean;
  created_at: string;
};

export type StaffInvite = {
  id: string;
  email: string;
  role: StaffRole;
  active: boolean;
  invited_by: string | null;
  accepted_by: string | null;
  accepted_at: string | null;
  created_at: string;
};

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function listStaffUsers(): Promise<StaffUser[]> {
  const { data, error } = await supabase.from("staff_users").select("*").order("created_at");
  throwIfError(error);
  return (data ?? []) as StaffUser[];
}

export async function listStaffInvites(): Promise<StaffInvite[]> {
  const { data, error } = await supabase.from("staff_invites").select("*").order("created_at", { ascending: false });
  throwIfError(error);
  return (data ?? []) as StaffInvite[];
}

export async function inviteStaff(email: string, role: StaffRole): Promise<StaffInvite> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) throw new Error("E-mailadres is verplicht.");

  const { data: claimsData } = await supabase.auth.getClaims();
  const invitedBy = claimsData?.claims?.sub ?? null;

  const { data, error } = await supabase
    .from("staff_invites")
    .insert({ email: normalized, role, invited_by: invitedBy })
    .select("*")
    .single();
  throwIfError(error);
  return data as StaffInvite;
}

export async function cancelStaffInvite(id: string): Promise<void> {
  const { error } = await supabase.from("staff_invites").update({ active: false }).eq("id", id);
  throwIfError(error);
}

export async function updateStaffUser(userId: string, changes: Partial<Pick<StaffUser, "role" | "active">>): Promise<StaffUser> {
  const { data, error } = await supabase
    .from("staff_users")
    .update(changes)
    .eq("user_id", userId)
    .select("*")
    .single();
  throwIfError(error);
  return data as StaffUser;
}
