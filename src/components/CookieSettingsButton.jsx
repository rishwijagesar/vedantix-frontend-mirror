import { OPEN_COOKIE_SETTINGS_EVENT } from "../lib/marketing-consent";

export default function CookieSettingsButton() {
  const openSettings = () => {
    window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
  };

  return (
    <button
      type="button"
      onClick={openSettings}
      style={{
        marginTop: 12,
        border: "1px solid #cbd5e1",
        borderRadius: 10,
        background: "#fff",
        color: "#0f172a",
        padding: "10px 14px",
        font: "inherit",
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      Cookie-instellingen openen
    </button>
  );
}
