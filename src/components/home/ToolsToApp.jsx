import { CalendarDays, FileSpreadsheet, Inbox, MessageCircle, Receipt } from "lucide-react";

/**
 * Woordweb: vijf losse tools (ballonnen) die samenkomen in één app op maat.
 * Coördinaten in een viewBox van 520 x 460; ballonnen en app staan in procenten daarvan,
 * zodat het hele beeld meeschaalt.
 */
const W = 520;
const H = 460;
const TOOLS = [
  { tool: "Excel", module: "Klanten en gegevens", icon: FileSpreadsheet, color: "#16a34a", x: 92, y: 62, to: [205, 172] },
  { tool: "Mail", module: "Aanvragen", icon: Inbox, color: "#2563eb", x: 260, y: 34, to: [260, 172] },
  { tool: "WhatsApp", module: "Klantcontact", icon: MessageCircle, color: "#0d9488", x: 428, y: 62, to: [315, 172] },
  { tool: "Planningstool", module: "Planning", icon: CalendarDays, color: "#7c3aed", x: 78, y: 300, to: [158, 300] },
  { tool: "Boekhoudpakket", module: "Facturen", icon: Receipt, color: "#ea580c", x: 442, y: 300, to: [362, 300] },
];

function curve({ x, y, to: [tx, ty] }) {
  const side = Math.abs(ty - y) < 40;
  const c1 = side ? [x + (tx - x) * 0.5, y] : [x, y + (ty - y) * 0.6];
  const c2 = side ? [x + (tx - x) * 0.5, ty] : [tx, ty - (ty - y) * 0.4];
  return `M${x} ${y} C${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${tx} ${ty}`;
}
const pct = (v, total) => `${(v / total) * 100}%`;

export default function ToolsToApp() {
  return (
    <div className="vx-web-wrap">
    <div
      className="vx-web"
      role="img"
      aria-label="Excel, mail, WhatsApp, een planningstool en een boekhoudpakket komen samen in één app op maat met klanten, aanvragen, klantcontact, planning en facturen."
    >
      <svg className="vx-web__lines" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        {TOOLS.map((t) => (
          <path key={t.tool} d={curve(t)} stroke={t.color} />
        ))}
      </svg>
      {TOOLS.map((t) => (
        <span key={t.tool} className="vx-web__bubble" style={{ left: pct(t.x, W), top: pct(t.y, H), "--c": t.color }} aria-hidden="true">
          <t.icon aria-hidden="true" />
          {t.tool}
        </span>
      ))}
      <div className="vx-web__app" style={{ left: pct(158, W), top: pct(172, H), width: pct(204, W), height: pct(250, H) }} aria-hidden="true">
        <div className="vx-web__bar"><span /><span /><span /><b>Jouw app</b></div>
        <ul>
          {TOOLS.map((t) => (
            <li key={t.module} style={{ "--c": t.color }}><t.icon aria-hidden="true" />{t.module}</li>
          ))}
        </ul>
      </div>
      <span className="vx-web__label vx-web__label--now" aria-hidden="true">Nu: losse tools</span>
      <span className="vx-web__label vx-web__label--after" aria-hidden="true">Straks: één app op maat</span>
    </div>
    </div>
  );
}
