import { useState, type FormEvent } from "react";
import { Plus, UserRound } from "lucide-react";
import { createCustomer, updateCustomer, type Customer } from "./control-center-data";

type BillingCustomer = Customer & {
  address_line1?: string | null;
  address_line2?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
  kvk_number?: string | null;
  vat_number?: string | null;
  iban?: string | null;
};

type CustomerFormValues = {
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  city: string | null;
  country: string;
  kvk_number: string | null;
  vat_number: string | null;
  iban: string | null;
};

function value(form: FormData, key: string) {
  const raw = String(form.get(key) || "").trim();
  return raw || null;
}

function normalizeIban(raw: string | null) {
  return raw ? raw.replace(/\s+/g, "").toUpperCase() : null;
}

function readCustomerForm(form: FormData): CustomerFormValues {
  const companyName = String(form.get("company_name") || "").trim();
  if (!companyName) throw new Error("Vul een bedrijfsnaam in.");

  const email = value(form, "email");
  if (email && !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Vul een geldig e-mailadres in.");

  const iban = normalizeIban(value(form, "iban"));
  if (iban && !/^[A-Z]{2}[0-9A-Z]{13,32}$/.test(iban)) {
    throw new Error("Vul een geldig IBAN-rekeningnummer in.");
  }

  return {
    company_name: companyName,
    contact_name: value(form, "contact_name"),
    email,
    phone: value(form, "phone"),
    address_line1: value(form, "address_line1"),
    address_line2: value(form, "address_line2"),
    postal_code: value(form, "postal_code"),
    city: value(form, "city"),
    country: String(form.get("country") || "Nederland").trim() || "Nederland",
    kvk_number: value(form, "kvk_number"),
    vat_number: value(form, "vat_number"),
    iban,
  };
}

const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100";
const fields: Array<{ label: string; name: keyof CustomerFormValues; type?: string; placeholder?: string }> = [
  { label: "Bedrijfsnaam", name: "company_name" },
  { label: "Contactpersoon", name: "contact_name" },
  { label: "E-mail", name: "email", type: "email" },
  { label: "Telefoon", name: "phone", type: "tel" },
  { label: "Adres", name: "address_line1" },
  { label: "Adresregel 2", name: "address_line2" },
  { label: "Postcode", name: "postal_code" },
  { label: "Plaats", name: "city" },
  { label: "Land", name: "country" },
  { label: "KVK-nummer", name: "kvk_number" },
  { label: "BTW-ID", name: "vat_number" },
  { label: "IBAN-rekeningnummer", name: "iban", placeholder: "NL00BANK0123456789" },
];

function CustomerForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  busy,
}: {
  initial?: Partial<CustomerFormValues>;
  submitLabel: string;
  onSubmit: (form: FormData) => Promise<void>;
  onCancel: () => void;
  busy: boolean;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(new FormData(event.currentTarget));
      }}
      className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      {fields.map(({ label, name, type, placeholder }) => (
        <label key={name} className="text-sm font-medium text-slate-700">
          {label}{name === "company_name" ? " *" : ""}
          <input
            name={name}
            type={type || "text"}
            placeholder={placeholder}
            defaultValue={String(initial?.[name] ?? (name === "country" ? "Nederland" : ""))}
            required={name === "company_name"}
            className={inputClass}
          />
        </label>
      ))}
      <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-3">
        <button disabled={busy} className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? "Opslaan…" : submitLabel}
        </button>
        <button type="button" disabled={busy} onClick={onCancel} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50">
          Annuleren
        </button>
      </div>
    </form>
  );
}

export default function BillingCustomersModule({ customers, onChanged }: { customers: BillingCustomer[]; onChanged: () => Promise<void> }) {
  const [selected, setSelected] = useState<BillingCustomer | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function create(form: FormData) {
    setBusy(true); setError(null); setMessage(null);
    try {
      const values = readCustomerForm(form);
      const customer = await createCustomer({ ...values, status: "LEAD" });
      await onChanged();
      setCreating(false);
      setSelected(customer as BillingCustomer);
      setMessage("Klant aangemaakt. Je kunt deze klant nu gebruiken voor een offerte, contract of factuur.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Klant aanmaken mislukt.");
    } finally {
      setBusy(false);
    }
  }

  async function save(form: FormData) {
    if (!selected) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      const values = readCustomerForm(form);
      const updated = await updateCustomer(selected.id, values as Partial<Customer>);
      await onChanged();
      setSelected(updated as BillingCustomer);
      setMessage("Klantgegevens opgeslagen.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opslaan mislukt.");
    } finally {
      setBusy(false);
    }
  }

  if (creating) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-100 p-2.5"><Plus size={18} /></div>
          <div><h2 className="text-lg font-semibold">Nieuwe klant</h2><p className="text-sm text-slate-500">Leg de gegevens één keer vast; offertes, contracten en facturen gebruiken daarna dezelfde klantgegevens.</p></div>
        </div>
        {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        <CustomerForm submitLabel="Klant aanmaken" onSubmit={create} onCancel={() => { setCreating(false); setError(null); }} busy={busy} />
      </section>
    );
  }

  if (selected) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <button type="button" onClick={() => { setSelected(null); setMessage(null); setError(null); }} className="mb-4 text-sm font-semibold text-slate-600">← Alle klanten</button>
        <h2 className="text-lg font-semibold">{selected.company_name}</h2>
        <p className="mt-1 text-sm text-slate-500">Gegevens die op nieuwe offertes, contracten en facturen worden vastgelegd.</p>
        {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        {message ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : null}
        <CustomerForm initial={selected} submitLabel="Klantgegevens opslaan" onSubmit={save} onCancel={() => setSelected(null)} busy={busy} />
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="text-lg font-semibold">Klantgegevens</h2><p className="mt-1 text-sm text-slate-500">Vul klantgegevens in voordat je een offerte, contract of factuur maakt.</p></div>
        <button type="button" onClick={() => { setCreating(true); setError(null); setMessage(null); }} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16}/> Nieuwe klant</button>
      </div>

      {customers.length ? (
        <div className="mt-5 space-y-2">
          {customers.map((customer) => (
            <button key={customer.id} type="button" onClick={() => setSelected(customer)} className="flex w-full items-center justify-between rounded-xl border border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50">
              <div className="flex min-w-0 items-center gap-3">
                <span className="rounded-lg bg-slate-100 p-2 text-slate-600"><UserRound size={16}/></span>
                <div className="min-w-0"><strong className="block truncate text-sm">{customer.company_name}</strong><span className="block truncate text-xs text-slate-400">{customer.email || "Geen e-mail"} · {customer.city || "adres nog niet compleet"}{customer.iban ? ` · ${customer.iban}` : ""}</span></div>
              </div>
              <span className="ml-3 shrink-0 text-xs font-semibold text-slate-500">Bewerken →</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-slate-200 p-8 text-center"><p className="text-sm font-medium text-slate-700">Nog geen klanten</p><p className="mt-1 text-sm text-slate-500">Maak je eerste klant aan om een contract of factuur te kunnen opstellen.</p></div>
      )}
    </section>
  );
}
