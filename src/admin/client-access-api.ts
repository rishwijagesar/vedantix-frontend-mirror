export type ClientSite = { slug: string; name: string; origin: string; active: boolean };
export type ClientMember = { site_slug: string; user_id: string; email: string | null; active: boolean };
export type ClientInvitation = { id: string; site_slug: string; email: string; status: string; created_at: string; sent_at: string | null; expires_at: string | null };
export type ClientAccessOverview = { can_manage: true; sites: ClientSite[]; members: ClientMember[]; invitations: ClientInvitation[]; audit?: unknown[] };
export type ClientAccessMutation =
  | { action: "invite"; site_slug: string; email: string; request_id: string }
  | { action: "set_membership_active"; site_slug: string; user_id: string; active: boolean; request_id: string }
  | { action: "recovery"; site_slug: string; user_id: string; request_id: string }
  | { action: "cancel_invitation"; invitation_id: string; request_id: string };
export type ClientAccessMutationResult = { ok: true; invitation_id?: string; status?: string };
export type ClientAccessBody = ClientAccessMutation | { action: "list"; site_slug?: string };
export type ClientAccessInvoke = (body: ClientAccessBody) => Promise<{ data: unknown; error: unknown }>;

export class ClientAccessError extends Error {
  status: number | undefined;
  constructor(message: string, status?: number) { super(message); this.name = "ClientAccessError"; this.status = status; }
}

function statusOf(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const context = "context" in error ? error.context : undefined;
  if (context && typeof context === "object" && "status" in context && typeof context.status === "number") return context.status;
  return "status" in error && typeof error.status === "number" ? error.status : undefined;
}

async function call(invoke: ClientAccessInvoke, body: ClientAccessBody): Promise<Record<string, unknown>> {
  let result: Awaited<ReturnType<ClientAccessInvoke>>;
  try { result = await invoke(body); }
  catch { throw new ClientAccessError("De verbinding met klanttoegang is onderbroken. Probeer dezelfde actie opnieuw."); }
  if (result.error) {
    const status = statusOf(result.error);
    const message = status === 401 ? "Je sessie is verlopen. Log opnieuw in."
      : status === 403 ? "Alleen een bevoegde Vedantix-beheerder kan klanttoegang beheren."
      : status === 429 ? "Deze actie is onlangs aangevraagd. Wacht even voordat je opnieuw probeert."
      : status === 409 ? "Deze toegang of uitnodiging is gewijzigd. Vernieuw het overzicht en controleer de gegevens."
      : status === 400 ? "Controleer het e-mailadres, de gekozen website en de accountstatus."
      : "Klanttoegang is tijdelijk niet beschikbaar. Probeer dezelfde actie opnieuw.";
    throw new ClientAccessError(message, status);
  }
  if (!result.data || typeof result.data !== "object" || Array.isArray(result.data)) throw new ClientAccessError("De dienst gaf geen geldig antwoord. Vernieuw het overzicht.");
  return result.data as Record<string, unknown>;
}

export function createClientAccessApi(invoke: ClientAccessInvoke) {
  return {
    async list(siteSlug?: string): Promise<ClientAccessOverview> {
      const data = await call(invoke, { action: "list", ...(siteSlug ? { site_slug: siteSlug } : {}) });
      if (data["can_manage"] !== true || !Array.isArray(data["sites"]) || !Array.isArray(data["members"]) || !Array.isArray(data["invitations"])) throw new ClientAccessError("Klanttoegang kon niet veilig worden geladen.");
      return data as ClientAccessOverview;
    },
    async mutate(body: ClientAccessMutation): Promise<ClientAccessMutationResult> {
      const data = await call(invoke, body);
      if (data["ok"] !== true) throw new ClientAccessError("De wijziging is niet bevestigd. Vernieuw het overzicht voordat je verdergaat.");
      if ((body.action === "invite" || body.action === "recovery") && data["status"] !== "sent") {
        if (data["status"] === "pending" || data["status"] === "sending") throw new ClientAccessError("De verzending wordt nog verwerkt. Wacht even en controleer de status opnieuw.", 202);
        throw new ClientAccessError("De e-mail is niet verstuurd. Annuleer deze bevestiging, vernieuw het overzicht en maak indien nodig een nieuwe aanvraag.", 422);
      }
      return data as ClientAccessMutationResult;
    },
  };
}

export function invitationStatus(status: string): string {
  const labels: Record<string, string> = { pending: "In afwachting", sent: "Verstuurd", accepted: "Geaccepteerd", cancelled: "Ingetrokken", canceled: "Ingetrokken", revoked: "Ingetrokken", expired: "Verlopen", failed: "Verzenden mislukt", sending: "Wordt verstuurd", queued: "In wachtrij", superseded: "Vervangen door nieuwe uitnodiging" };
  return labels[status.toLowerCase()] || "Status onbekend";
}

export function invitationIsOpen(invitation: ClientInvitation, now = Date.now()): boolean {
  return ["sending", "sent"].includes(invitation.status.toLowerCase())
    && (!invitation.expires_at || Date.parse(invitation.expires_at) > now);
}
