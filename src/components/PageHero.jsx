/**
 * Gedeelde paginakop voor binnenpagina's: zelfde donkere achtergrond, typografie en knoppen als de homepage.
 * - eyebrow: korte label boven de titel
 * - title: de H1 (string of JSX)
 * - lead: inleidende zin
 * - actions: knoppen (JSX)
 * - aside: optionele kaart rechts (vanaf laptop), onder de tekst op mobiel en tablet
 * - children: extra inhoud onder de knoppen (bijv. keuzekaarten)
 */
export default function PageHero({ id, eyebrow, title, lead, actions, aside, children, as: Tag = "section" }) {
  return (
    <Tag className="vx-page vx-pagehero" aria-labelledby={id}>
      <div className={`vx-container vx-pagehero__inner${aside ? " has-aside" : ""}`}>
        <div className="vx-pagehero__copy">
          {eyebrow ? <p className="vx-eyebrow">{eyebrow}</p> : null}
          <h1 id={id} className="vx-h1">{title}</h1>
          {lead ? <p className="vx-lead">{lead}</p> : null}
          {actions ? <div className="vx-pagehero__actions">{actions}</div> : null}
          {children}
        </div>
        {aside ? <aside className="vx-pagehero__aside">{aside}</aside> : null}
      </div>
    </Tag>
  );
}
