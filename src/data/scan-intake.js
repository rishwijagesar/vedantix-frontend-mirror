/** Vragen van de begeleide intake voor de gratis bedrijfsscan (chatknop en /bedrijfsscan). */
export const INTAKE_STEPS = [
  { key: "branche", label: "Branche", question: "In welke branche werk je?", multi: false, options: ["Bouw en renovatie", "Installatietechniek", "Zorgpraktijk", "Horeca", "Kapper of salon", "Iets anders"] },
  { key: "team", label: "Teamgrootte", question: "Met hoeveel mensen werk je?", multi: false, options: ["Alleen ik", "2 tot 5", "6 tot 20", "Meer dan 20"] },
  { key: "tijd", label: "Tijdvreters", question: "Waar verlies je nu de meeste tijd? Kies er gerust meer.", multi: true, options: ["Aanvragen en offertes", "Planning", "Facturen en betalingen", "Uren registreren", "Klantcontact", "Iets anders"] },
  { key: "tools", label: "Huidige tools", question: "En waar werk je nu mee?", multi: true, options: ["Excel", "Mail", "WhatsApp", "Boekhoudpakket", "Papier", "Ander pakket"] },
  { key: "start", label: "Gewenste start", question: "Wanneer zou je willen starten?", multi: false, options: ["Zo snel mogelijk", "Binnen 3 maanden", "Ik oriënteer me nog"] },
];

export const INTAKE_WELCOME = "Hoi! In 1 minuut weten we wat je bedrijf nodig heeft. Daarna plannen we je gratis bedrijfsscan.";

/** Zet de antwoorden om naar het berichtveld van een contactaanvraag. */
export function intakeMessage(answers, note = "") {
  const lines = INTAKE_STEPS.map((step) => {
    const value = answers[step.key];
    return `${step.label}: ${Array.isArray(value) ? value.join(", ") : value || "-"}`;
  });
  if (note.trim()) lines.push(`Toelichting: ${note.trim()}`);
  return ["Intake gratis bedrijfsscan (chat)", "", ...lines].join("\n");
}
