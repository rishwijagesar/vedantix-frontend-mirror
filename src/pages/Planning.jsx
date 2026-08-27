import { useEffect, useMemo, useState } from "react";
import { Availability, Appointment } from "../api/entities";

const PAGE_STYLES = `
  *{box-sizing:border-box;margin:0;padding:0}
  input,textarea,select,button{font-family:inherit}

  .planning-page{
    font-family:'Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    color:#1a1a2e;
    min-height:100vh;
    background:#f7f9fc;
  }

  .planning-header{
    background:linear-gradient(135deg,#0a1628,#0d2146);
    padding:clamp(50px,8vw,80px) 5% clamp(40px,6vw,60px);
  }

  .planning-header-inner{
    max-width:680px;
    margin:0 auto;
    text-align:center;
  }

  .planning-back{
    color:rgba(255,255,255,0.72);
    text-decoration:none;
    font-size:.9rem;
    display:inline-block;
    margin-bottom:24px;
  }

  .planning-back:hover{
    color:#fff;
  }

  .planning-badge{
    display:inline-flex;
    align-items:center;
    gap:8px;
    background:rgba(0,194,255,0.1);
    border:1px solid rgba(0,194,255,0.3);
    color:#00c2ff;
    padding:6px 18px;
    border-radius:100px;
    font-size:.82rem;
    font-weight:600;
    margin-bottom:20px;
  }

  .planning-title{
    font-size:clamp(2rem,5vw,3rem);
    font-weight:900;
    color:#fff;
    line-height:1.1;
    margin-bottom:16px;
    letter-spacing:-1px;
  }

  .planning-title span{
    color:#00c2ff;
  }

  .planning-subtitle{
    color:rgba(255,255,255,0.78);
    font-size:1.05rem;
    line-height:1.7;
  }

  .planning-progress{
    background:#fff;
    border-bottom:1px solid #e5e7eb;
    padding:0 5%;
  }

  .planning-progress-inner{
    max-width:680px;
    margin:0 auto;
    display:flex;
    gap:0;
  }

  .planning-progress-item{
    flex:1;
    padding:16px 8px;
    text-align:center;
    border-bottom:3px solid transparent;
  }

  .planning-progress-item.active{
    border-bottom-color:#1a73e8;
  }

  .planning-progress-label{
    font-size:.8rem;
    font-weight:700;
    color:#9ca3af;
  }

  .planning-progress-item.active .planning-progress-label{
    color:#1a73e8;
  }

  .planning-progress-item.done .planning-progress-label{
    color:#10b981;
  }

  .planning-main{
    max-width:680px;
    margin:0 auto;
    padding:48px 20px;
  }

  .planning-section-title{
    font-size:1.5rem;
    font-weight:800;
    margin-bottom:8px;
    color:#111827;
  }

  .planning-section-subtitle{
    color:#6b7280;
    margin-bottom:32px;
    line-height:1.7;
  }

  .selected-date-note{
    color:#1a73e8;
    font-weight:600;
    margin-bottom:24px;
    text-transform:capitalize;
  }

  .date-list{
    display:flex;
    flex-direction:column;
    gap:12px;
    margin-bottom:32px;
  }

  .date-card{
    width:100%;
    border:2px solid #e5e7eb;
    border-radius:14px;
    padding:18px 20px;
    cursor:pointer;
    transition:all .2s;
    background:#fff;
    text-align:left;
  }

  .date-card:hover{
    border-color:#1a73e8;
  }

  .date-card.selected{
    border-color:#1a73e8;
    background:#eff6ff;
  }

  .date-card-inner{
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:16px;
  }

  .date-card-title{
    font-weight:700;
    font-size:1rem;
    color:#1a1a2e;
    text-transform:capitalize;
  }

  .date-card.selected .date-card-title{
    color:#1e40af;
  }

  .date-card-meta{
    color:#6b7280;
    font-size:.85rem;
    margin-top:2px;
  }

  .date-card-check{
    width:24px;
    height:24px;
    border-radius:50%;
    border:2px solid #e5e7eb;
    background:transparent;
    display:flex;
    align-items:center;
    justify-content:center;
    flex-shrink:0;
  }

  .date-card.selected .date-card-check{
    border-color:#1a73e8;
    background:#1a73e8;
    color:#fff;
  }

  .time-grid{
    display:grid;
    grid-template-columns:repeat(auto-fill,minmax(110px,1fr));
    gap:10px;
    margin-bottom:32px;
  }

  .time-slot{
    padding:10px 18px;
    border:2px solid #e5e7eb;
    border-radius:10px;
    cursor:pointer;
    font-weight:600;
    font-size:.9rem;
    transition:all .2s;
    background:#fff;
    color:#374151;
    text-align:center;
  }

  .time-slot:hover{
    border-color:#1a73e8;
    color:#1a73e8;
  }

  .time-slot.selected{
    background:#1a73e8;
    color:#fff;
    border-color:#1a73e8;
  }

  .time-slot:disabled{
    cursor:not-allowed;
    opacity:.6;
  }

  .info-box{
    background:#f0f9ff;
    border:1px solid #bae6fd;
    border-radius:12px;
    padding:16px;
    margin-bottom:32px;
  }

  .info-box p{
    color:#0369a1;
    font-size:.88rem;
    line-height:1.65;
  }

  .warning-box{
    background:#fffbeb;
    border:1px solid #fcd34d;
    border-radius:14px;
    padding:28px;
    text-align:center;
  }

  .warning-box-icon{
    font-size:2rem;
    margin-bottom:12px;
  }

  .warning-box h3{
    font-weight:700;
    color:#92400e;
    margin-bottom:8px;
  }

  .warning-box p{
    color:#b45309;
    font-size:.9rem;
    line-height:1.65;
  }

  .loading-box{
    text-align:center;
    padding:40px;
    color:#6b7280;
  }

  .loading-box-icon{
    font-size:2rem;
    margin-bottom:12px;
  }

  .summary-box{
    background:#eff6ff;
    border:1px solid #bfdbfe;
    border-radius:12px;
    padding:16px;
    margin-bottom:28px;
  }

  .summary-box p{
    color:#1e40af;
    font-size:.9rem;
    line-height:1.65;
  }

  .form-grid{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:14px;
  }

  .form-stack{
    display:flex;
    flex-direction:column;
    gap:14px;
  }

  .form-input{
    width:100%;
    padding:13px 16px;
    border:2px solid #e5e7eb;
    border-radius:10px;
    font-size:.93rem;
    outline:none;
    background:#fff;
    transition:border-color .2s, box-shadow .2s;
    font-family:inherit;
  }

  .form-input:focus{
    border-color:#1a73e8;
    box-shadow:0 0 0 3px rgba(26,115,232,.12);
  }

  .form-input[aria-invalid="true"]{
    border-color:#dc2626;
  }

  .btn-row{
    display:flex;
    justify-content:space-between;
    gap:12px;
    margin-top:8px;
  }

  .btn-main{
    background:#1a73e8;
    color:#fff;
    padding:13px 28px;
    border-radius:10px;
    font-weight:700;
    font-size:.95rem;
    border:none;
    cursor:pointer;
    transition:all .2s;
  }

  .btn-main:hover:not(:disabled){
    background:#1558b0;
  }

  .btn-main:disabled{
    opacity:.55;
    cursor:not-allowed;
  }

  .btn-out{
    background:transparent;
    color:#1a73e8;
    padding:13px 28px;
    border-radius:10px;
    font-weight:600;
    font-size:.95rem;
    border:2px solid #1a73e8;
    cursor:pointer;
    transition:all .2s;
  }

  .btn-out:hover{
    background:#1a73e8;
    color:#fff;
  }

  .btn-success{
    background:#10b981;
    color:#fff;
    padding:14px 32px;
    border-radius:10px;
    font-weight:700;
    font-size:1rem;
    border:none;
    cursor:pointer;
    transition:all .2s;
  }

  .btn-success:hover:not(:disabled){
    background:#0f9f71;
  }

  .btn-success:disabled{
    opacity:.55;
    cursor:not-allowed;
  }

  .error-box{
    margin-bottom:20px;
    padding:14px 16px;
    border-radius:12px;
    background:#fef2f2;
    border:1px solid #fecaca;
    color:#991b1b;
    font-size:.9rem;
    line-height:1.6;
  }

  .success-screen{
    min-height:100vh;
    background:linear-gradient(135deg,#0a1628,#0d2146);
    display:flex;
    align-items:center;
    justify-content:center;
    font-family:'Inter',sans-serif;
    padding:20px;
  }

  .success-card{
    background:#fff;
    border-radius:24px;
    padding:48px;
    text-align:center;
    max-width:480px;
    width:100%;
  }

  .success-icon{
    font-size:3rem;
    margin-bottom:16px;
  }

  .success-title{
    font-size:1.8rem;
    font-weight:800;
    margin-bottom:12px;
    color:#0a1628;
  }

  .success-text{
    color:#6b7280;
    margin-bottom:24px;
    line-height:1.7;
  }

  .success-summary{
    background:#f0f9ff;
    border:1px solid #bae6fd;
    border-radius:12px;
    padding:20px;
    margin-bottom:28px;
    text-align:left;
  }

  .success-summary-title{
    font-weight:700;
    color:#0369a1;
    margin-bottom:10px;
  }

  .success-summary p{
    color:#0c4a6e;
    font-size:.9rem;
    margin-bottom:4px;
    line-height:1.6;
  }

  .success-home-link{
    background:#1a73e8;
    color:#fff;
    padding:12px 28px;
    border-radius:10px;
    text-decoration:none;
    font-weight:700;
    display:inline-block;
  }

  .wa-fab{
    position:fixed;
    bottom:28px;
    right:28px;
    z-index:500;
  }

  .wa-btn{
    width:58px;
    height:58px;
    border-radius:50%;
    background:#25d366;
    border:none;
    cursor:pointer;
    box-shadow:0 4px 20px rgba(37,211,102,0.45);
    display:flex;
    align-items:center;
    justify-content:center;
    transition:transform .2s;
    position:relative;
  }

  .wa-btn:hover{
    transform:scale(1.08);
  }

  .wa-badge{
    position:absolute;
    top:-4px;
    right:-4px;
    background:#ef4444;
    color:#fff;
    width:18px;
    height:18px;
    border-radius:50%;
    font-size:.65rem;
    font-weight:800;
    display:flex;
    align-items:center;
    justify-content:center;
  }

  .wa-bubble{
    position:absolute;
    bottom:68px;
    right:0;
    background:#fff;
    border-radius:16px;
    box-shadow:0 8px 32px rgba(0,0,0,0.15);
    width:290px;
    overflow:hidden;
    animation:waPop .2s ease;
  }

  @keyframes waPop{
    from{opacity:0;transform:scale(.92) translateY(10px)}
    to{opacity:1;transform:scale(1) translateY(0)}
  }

  .wa-header{
    background:#075e54;
    padding:16px 18px;
    display:flex;
    align-items:center;
    gap:12px;
    position:relative;
  }

  .wa-avatar{
    width:40px;
    height:40px;
    border-radius:50%;
    background:#128c7e;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:1.2rem;
    flex-shrink:0;
  }

  .wa-header-title{
    color:#fff;
    font-weight:700;
    font-size:.9rem;
  }

  .wa-header-subtitle{
    color:rgba(255,255,255,0.7);
    font-size:.75rem;
  }

  .wa-close{
    position:absolute;
    top:10px;
    right:12px;
    background:none;
    border:none;
    color:rgba(255,255,255,0.7);
    cursor:pointer;
    font-size:1rem;
  }

  .wa-body{
    padding:16px 18px;
  }

  .wa-msg{
    background:#f0f0f0;
    border-radius:0 10px 10px 10px;
    padding:10px 13px;
    font-size:.85rem;
    color:#1a1a2e;
    line-height:1.5;
    margin-bottom:14px;
  }

  .wa-open{
    display:block;
    background:#25d366;
    color:#fff;
    text-align:center;
    padding:11px;
    border-radius:9px;
    font-weight:700;
    text-decoration:none;
    font-size:.88rem;
  }

  @media(max-width:768px){
    .form-grid{grid-template-columns:1fr}
  }

  @media(max-width:480px){
    .planning-title{font-size:1.8rem}
    .btn-row{flex-direction:column}
    .btn-row button{width:100%}
    .time-grid{grid-template-columns:1fr 1fr}
    .wa-fab{bottom:20px;right:20px}
    .wa-bubble{width:270px}
    .success-card{padding:32px 24px}
  }
`;

const PACKAGE_OPTIONS = [
  "Starter — €99/m",
  "Growth — €149/m",
  "Pro — €249/m",
  "Custom — op maat",
  "Weet ik nog niet",
];

function formatDate(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function incrementTime(time) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + 30;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function isFutureOrToday(dateStr) {
  const today = new Date().toISOString().split("T")[0];
  return dateStr >= today;
}

function getAvailableFutureDates(data) {
  return [...data]
    .filter(
      (item) =>
        item?.date &&
        isFutureOrToday(item.date) &&
        Array.isArray(item.time_slots) &&
        item.time_slots.length > 0
    )
    .sort((a, b) => a.date.localeCompare(b.date));
}

function WhatsAppWidget() {
  const [open, setOpen] = useState(false);
  const url =
    "https://wa.me/310626219989?text=" +
    encodeURIComponent("Hallo Vedantix! Ik heb een vraag.");

  return (
    <div className="wa-fab">
      {open && (
        <div className="wa-bubble" role="dialog" aria-label="WhatsApp contact">
          <div className="wa-header">
            <div className="wa-avatar" aria-hidden="true">
              V
            </div>
            <div>
              <div className="wa-header-title">Vedantix</div>
              <div className="wa-header-subtitle">Gemiddeld binnen 1 uur</div>
            </div>
            <button
              type="button"
              className="wa-close"
              onClick={() => setOpen(false)}
              aria-label="Sluit WhatsApp venster"
            >
              ✕
            </button>
          </div>
          <div className="wa-body">
            <div className="wa-msg">
              👋 Hallo! Heb je een vraag? Stuur ons een WhatsApp-bericht — we reageren snel!
            </div>
            <a href={url} target="_blank" rel="noreferrer" className="wa-open">
              Chat openen op WhatsApp
            </a>
          </div>
        </div>
      )}

      <button
        type="button"
        className="wa-btn"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open WhatsApp chat"
        aria-expanded={open}
      >
        {!open && <div className="wa-badge">1</div>}
        <svg viewBox="0 0 24 24" width="28" height="28" fill="#fff" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </button>
    </div>
  );
}

export default function Planning() {
  const [availabilities, setAvailabilities] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    package_interest: "",
    message: "",
  });

  useEffect(() => {
    let mounted = true;

    const loadAvailabilities = async () => {
      setLoading(true);
      setLoadError("");

      try {
        const data = await Availability.filter({ is_active: true });
        if (!mounted) return;

        setAvailabilities(getAvailableFutureDates(data));
      } catch (error) {
        if (!mounted) return;
        setAvailabilities([]);
        setLoadError("Het laden van de beschikbaarheid is mislukt. Probeer het opnieuw.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadAvailabilities();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedAvailability = useMemo(
    () => availabilities.find((item) => item.date === selectedDate) || null,
    [availabilities, selectedDate]
  );

  const canContinueFromStep1 = Boolean(selectedDate);
  const canContinueFromStep2 = Boolean(selectedTime);
  const canSubmit = Boolean(form.name.trim() && form.email.trim() && selectedDate && selectedTime && !submitting);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectDate = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!canSubmit) return;

    setSubmitting(true);

    try {
      await Appointment.create({
        ...form,
        date: selectedDate,
        time: selectedTime,
        status: "pending",
      });

      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        "Het versturen van je aanvraag is mislukt. Probeer het opnieuw of neem contact op via WhatsApp."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="success-screen">
        <div className="success-card">
          <div className="success-icon">📅</div>
          <h2 className="success-title">Afspraak ingepland!</h2>
          <p className="success-text">
            We hebben jouw afspraakaanvraag ontvangen en sturen binnen 24 uur een bevestiging.
          </p>

          <div className="success-summary">
            <p className="success-summary-title">📋 Jouw afspraak:</p>
            <p>📅 {formatDate(selectedDate)}</p>
            <p>
              🕐 {selectedTime} — {incrementTime(selectedTime)} (30 min)
            </p>
            <p>👤 {form.name}</p>
          </div>

          <a href="/" className="success-home-link">
            Terug naar home
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{PAGE_STYLES}</style>
      <WhatsAppWidget />

      <div className="planning-page">
        <header className="planning-header">
          <div className="planning-header-inner">
            <a href="/" className="planning-back">
              ← Terug naar Vedantix
            </a>

            <div className="planning-badge">📅 Gratis kennismaking</div>

            <h1 className="planning-title">
              Plan een <span>persoonlijk gesprek</span>
            </h1>

            <p className="planning-subtitle">
              Heb je vragen of wil je meer weten? Plan een gratis kennismakingsgesprek van 30 minuten.
            </p>
          </div>
        </header>

        <div className="planning-progress" aria-label="Voortgang">
          <div className="planning-progress-inner">
            {["Kies datum", "Kies tijdstip", "Jouw gegevens"].map((label, index) => {
              const number = index + 1;
              const isActive = step === number;
              const isDone = step > number;

              return (
                <div
                  key={label}
                  className={`planning-progress-item ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}
                >
                  <span className="planning-progress-label">
                    {isDone ? "✓ " : `${number}. `}
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <main className="planning-main">
          {step === 1 && (
            <section>
              <h2 className="planning-section-title">📅 Kies een datum</h2>
              <p className="planning-section-subtitle">
                Selecteer een beschikbare datum voor jouw kennismakingsgesprek.
              </p>

              {loadError && <div className="error-box">{loadError}</div>}

              {loading ? (
                <div className="loading-box">
                  <div className="loading-box-icon">⏳</div>
                  <p>Beschikbaarheid laden...</p>
                </div>
              ) : availabilities.length === 0 ? (
                <div className="warning-box">
                  <div className="warning-box-icon">😔</div>
                  <h3>Momenteel geen beschikbaarheid</h3>
                  <p>
                    Er zijn op dit moment geen tijdslots beschikbaar. Neem contact op via
                    WhatsApp of e-mail.
                  </p>
                </div>
              ) : (
                <div className="date-list">
                  {availabilities.map((availability) => {
                    const isSelected = selectedDate === availability.date;

                    return (
                      <button
                        key={availability.id}
                        type="button"
                        className={`date-card ${isSelected ? "selected" : ""}`}
                        onClick={() => handleSelectDate(availability.date)}
                        aria-pressed={isSelected}
                      >
                        <div className="date-card-inner">
                          <div>
                            <p className="date-card-title">{formatDate(availability.date)}</p>
                            <p className="date-card-meta">
                              {availability.time_slots.length} tijdslots beschikbaar
                            </p>
                          </div>

                          <div className="date-card-check" aria-hidden="true">
                            {isSelected ? "✓" : ""}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="btn-row" style={{ justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn-main"
                  onClick={() => setStep(2)}
                  disabled={!canContinueFromStep1}
                >
                  Volgende stap →
                </button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section>
              <h2 className="planning-section-title">🕐 Kies een tijdstip</h2>
              <p className="selected-date-note">📅 {formatDate(selectedDate)}</p>

              <div className="time-grid">
                {selectedAvailability?.time_slots?.map((slot) => {
                  const isSelected = selectedTime === slot;

                  return (
                    <button
                      key={slot}
                      type="button"
                      className={`time-slot ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelectedTime(slot)}
                      aria-pressed={isSelected}
                    >
                      <div style={{ fontWeight: 700 }}>{slot}</div>
                      <div style={{ fontSize: ".75rem", opacity: .75 }}>30 min</div>
                    </button>
                  );
                })}
              </div>

              <div className="info-box">
                <p>
                  💡 Het gesprek duurt 30 minuten en vindt plaats via Google Meet of telefoon —
                  jij kiest.
                </p>
              </div>

              <div className="btn-row">
                <button type="button" className="btn-out" onClick={() => setStep(1)}>
                  ← Terug
                </button>
                <button
                  type="button"
                  className="btn-main"
                  onClick={() => setStep(3)}
                  disabled={!canContinueFromStep2}
                >
                  Volgende stap →
                </button>
              </div>
            </section>
          )}

          {step === 3 && (
            <section>
              <h2 className="planning-section-title">👤 Jouw gegevens</h2>

              <div className="summary-box">
                <p>
                  📅 {formatDate(selectedDate)} • 🕐 {selectedTime} ({incrementTime(selectedTime)}) —
                  30 min
                </p>
              </div>

              {submitError && <div className="error-box">{submitError}</div>}

              <form onSubmit={handleSubmit} className="form-stack">
                <div className="form-grid">
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Voornaam & achternaam"
                    required
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    aria-invalid={!form.name.trim() && submitError ? "true" : "false"}
                  />
                  <input
                    className="form-input"
                    type="tel"
                    placeholder="Telefoonnummer"
                    value={form.phone}
                    onChange={(e) => updateForm("phone", e.target.value)}
                  />
                </div>

                <input
                  className="form-input"
                  type="email"
                  placeholder="E-mailadres"
                  required
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  aria-invalid={!form.email.trim() && submitError ? "true" : "false"}
                />

                <input
                  className="form-input"
                  type="text"
                  placeholder="Bedrijfsnaam (optioneel)"
                  value={form.company}
                  onChange={(e) => updateForm("company", e.target.value)}
                />

                <select
                  className="form-input"
                  value={form.package_interest}
                  onChange={(e) => updateForm("package_interest", e.target.value)}
                >
                  <option value="">Welk pakket interesseert je? (optioneel)</option>
                  {PACKAGE_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <textarea
                  className="form-input"
                  placeholder="Heb je al vragen of wil je iets doorgeven voor het gesprek? (optioneel)"
                  value={form.message}
                  onChange={(e) => updateForm("message", e.target.value)}
                  style={{ minHeight: 100, resize: "vertical" }}
                />

                <div className="btn-row">
                  <button type="button" className="btn-out" onClick={() => setStep(2)}>
                    ← Terug
                  </button>

                  <button type="submit" className="btn-success" disabled={!canSubmit}>
                    {submitting ? "Bezig met versturen..." : "Afspraak bevestigen 📅"}
                  </button>
                </div>
              </form>
            </section>
          )}
        </main>
      </div>
    </>
  );
}