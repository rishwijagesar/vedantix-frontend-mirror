import { CalendarDays, Check, FileText, Inbox, LayoutDashboard, Receipt, Users } from "lucide-react";

const NAV = [
  { label: "Overzicht", icon: LayoutDashboard, active: true },
  { label: "Klanten", icon: Users },
  { label: "Offertes", icon: FileText },
  { label: "Planning", icon: CalendarDays },
  { label: "Facturen", icon: Receipt },
];

const STEPS = ["Aanvraag", "Offerte", "Planning", "Factuur"];

const ROWS = [
  { name: "Familie de Vries", detail: "Nieuwe aanvraag", step: 0 },
  { name: "Bakkerij Jansen", detail: "Offerte verstuurd", step: 1 },
  { name: "Kantoor Bakker", detail: "Ingepland voor dinsdag", step: 2 },
  { name: "Praktijk Smit", detail: "Factuur betaald", step: 3 },
];

/**
 * Pure-CSS illustration of a custom app. It uses fictional example data and says so in its caption,
 * so it can never be mistaken for a real client screenshot.
 */
export default function AppMock() {
  return (
    <figure className="vx-app" aria-label="Illustratie van een bedrijfsapp op maat">
      <div className="vx-app__bar" aria-hidden="true">
        <span /><span /><span />
        <b>Werkplek</b>
      </div>
      <div className="vx-app__body">
        <nav className="vx-app__nav" aria-hidden="true">
          {NAV.map(({ label, icon: Icon, active }) => (
            <span key={label} className={active ? "is-active" : undefined}><Icon size={16} />{label}</span>
          ))}
        </nav>
        <div className="vx-app__main">
          <div className="vx-app__kpis" aria-hidden="true">
            <div><small>Nieuwe aanvragen</small><strong>4</strong></div>
            <div><small>Open offertes</small><strong>7</strong></div>
            <div><small>Gepland deze week</small><strong>12</strong></div>
          </div>
          <ul className="vx-app__rows">
            {ROWS.map((row) => (
              <li key={row.name}>
                <span className="vx-app__avatar" aria-hidden="true">{row.name.slice(0, 1)}</span>
                <span className="vx-app__who"><strong>{row.name}</strong><small>{row.detail}</small></span>
                <ol className="vx-app__steps" aria-label={`Stap: ${STEPS[row.step]}`}>
                  {STEPS.map((step, index) => (
                    <li key={step} className={index < row.step ? "is-done" : index === row.step ? "is-current" : undefined}>
                      {index < row.step ? <Check size={11} aria-hidden="true" /> : null}
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
          <p className="vx-app__note"><Inbox size={14} aria-hidden="true" /> Eén keer invoeren, daarna loopt het werk door.</p>
        </div>
      </div>
      <figcaption>Illustratie met voorbeeldgegevens</figcaption>
    </figure>
  );
}
