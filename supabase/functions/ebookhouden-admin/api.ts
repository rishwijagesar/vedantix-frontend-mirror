export type Ledger = { id: number; code: string; description: string; category: string };
export type AccountMapping = { debtor: number; revenue: number; bank: number | null; mollie: number | null; creditor?: number | null; [key: string]: number | null | undefined };

export class SetupError extends Error {}
const base = "https://api.e-boekhouden.nl/v1";

async function request(fetcher: typeof fetch, path: string, init: RequestInit) {
  try {
    const response = await fetcher(`${base}${path}`, { ...init, redirect: "error", signal: AbortSignal.timeout(15000) });
    if (!response.ok) {
      if ([401, 403].includes(response.status)) throw new SetupError("Geen toegang tot e-Boekhouden. Controleer het API-token en de rechten voor jouw administratie.");
      if (response.status === 429) throw new SetupError("e-Boekhouden ontvangt te veel verzoeken. Probeer het later opnieuw.");
      throw new SetupError("e-Boekhouden kon het verzoek niet verwerken. Controleer het account en probeer opnieuw.");
    }
    return response;
  } catch (error) {
    if (error instanceof SetupError) throw error;
    // Never forward an upstream body, exception or token to the browser/logs.
    throw new SetupError("e-Boekhouden is tijdelijk niet bereikbaar. Probeer opnieuw.");
  }
}

export async function verifyEboekhoudenToken(accessToken: string, fetcher: typeof fetch = fetch): Promise<Ledger[]> {
  if (!accessToken.trim() || accessToken.length > 4096) throw new SetupError("Vul een geldig API-token in.");
  let session = "";
  try {
    const response = await request(fetcher, "/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessToken: accessToken.trim(), source: "Vedantix" }) });
    const auth = await response.json();
    session = auth.token ?? auth.Token;
    if (typeof session !== "string" || !session) throw new SetupError("e-Boekhouden gaf geen geldige sessie terug.");
    const ledgers: Ledger[] = [];
    for (let offset = 0; offset < 20000; offset += 1000) {
      const page = await request(fetcher, `/ledger?limit=1000&offset=${offset}`, { method: "GET", headers: { Authorization: session } });
      const data = await page.json();
      const items = data.items ?? data.Items;
      if (!Array.isArray(items)) throw new SetupError("De boekhoudrekeningen konden niet worden gelezen.");
      for (const row of items) {
        const ledger = { id: Number(row.id ?? row.Id), code: row.code ?? row.Code, description: row.description ?? row.Description, category: row.category ?? row.Category };
        if (!Number.isSafeInteger(ledger.id) || ledger.id <= 0 || [ledger.code, ledger.description, ledger.category].some(value => typeof value !== "string")) throw new SetupError("e-Boekhouden gaf ongeldige rekeninggegevens terug.");
        ledgers.push(ledger);
      }
      if (items.length < 1000) return ledgers;
    }
    throw new SetupError("Er zijn te veel boekhoudrekeningen om de lijst volledig te controleren.");
  } catch (error) {
    if (error instanceof SetupError) throw error;
    throw new SetupError("Het antwoord van e-Boekhouden kon niet worden gelezen.");
  } finally {
    if (session) {
      try { await request(fetcher, "/session", { method: "DELETE", headers: { Authorization: session } }); } catch { /* Session expires; no credentials are logged. */ }
    }
  }
}

export function validateAccountMapping(input: unknown, ledgers: Ledger[]): AccountMapping {
  const values = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const pick = (key: string, categories: string[], required: boolean) => {
    const value = values[key];
    if ((value === null || value === undefined || value === "") && !required) return null;
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) throw new SetupError("Kies de vereiste boekhoudrekeningen uit jouw administratie.");
    const ledger = ledgers.find(item => item.id === value);
    if (!ledger || !categories.includes(ledger.category)) throw new SetupError("Een gekozen rekening bestaat niet of heeft niet het juiste type. Vernieuw de rekeningen.");
    return ledger.id;
  };
  const mapping = { debtor: pick("debtor", ["DEB"], true)!, revenue: pick("revenue", ["VW"], true)!, bank: pick("bank", ["FIN"], false), mollie: pick("mollie", ["BAL", "FIN"], false) };
  const chosen = Object.values(mapping).filter(value => value !== null);
  if (new Set(chosen).size !== chosen.length) throw new SetupError("Gebruik voor ieder doel een afzonderlijke rekening.");
  const extended: AccountMapping = mapping;
  if (values.creditor != null) extended.creditor = pick("creditor", ["CRED"], false);
  for (const key of ["software","hosting","hardware","office","marketing","travel","education","professional","insurance","bank","depreciation","other"]) {
    if (values["cost_" + key] != null) {
      const id = pick("cost_" + key, ["VW"], false);
      if (id === mapping.revenue) throw new SetupError("Gebruik voor kosten een andere rekening dan omzet.");
      extended["cost_" + key] = id;
    }
  }
  return extended;
}

