import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont, type RGB } from 'npm:pdf-lib@1.17.1';

export type ReportInput = {
  website: { name: string; production_url?: string };
  customer?: { company_name?: string } | null;
  company?: { trade_name?: string; email?: string; phone?: string; website?: string } | null;
  run: { id: string; kind: string; status: string; created_at: string; target_url: string; result: any; note?: string; error?: string | null };
  includeNote?: boolean;
};
const W = 595.28, H = 841.89, M = 46, CW = W - M * 2, BOTTOM = 762;
const NAVY = rgb(.059, .09, .165), INK = rgb(.15, .20, .29), MUTED = rgb(.37, .43, .53);
const BLUE = rgb(.145, .388, .922), PALE = rgb(.945, .961, .984), BORDER = rgb(.85, .88, .92);
const GREEN = rgb(.035, .43, .29), AMBER = rgb(.62, .35, .035), RED = rgb(.73, .16, .16), WHITE = rgb(1, 1, 1);
export const deviceName = (value: string) => value === 'mobile' ? 'Mobiel' : 'Desktop';
export const validScore = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
export const scoreLabel = (value: unknown) => !validScore(value) ? 'Niet beschikbaar' : value >= 90 ? 'Goed' : value >= 50 ? 'Verbetering mogelijk' : 'Aandacht nodig';
const scoreColor = (value: unknown) => !validScore(value) ? MUTED : value >= 90 ? GREEN : value >= 50 ? AMBER : RED;
const safe = (value: unknown) => String(value ?? '').replace(/[\u00a0\u202f]/g, ' ').replace(/[–—−]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/…/g, '...').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7e\xa0-\xff\n€]/g, '');
const date = (value: string) => Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat('nl-NL', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Amsterdam' }).format(new Date(value)) : 'Tijdstip niet beschikbaar';
export function reportMeasurements(input: ReportInput): any[] {
  const rows = input.run.result?.measurements;
  if (input.run.kind !== 'pagespeed' || !['COMPLETED', 'PARTIAL'].includes(input.run.status) || !Array.isArray(rows) || !rows.length || rows.length > 2) throw new Error('Geen afgeronde PageSpeed-meting beschikbaar.');
  const devices = new Set<string>();
  for (const m of rows) {
    if (!m || !['mobile', 'desktop'].includes(m.device) || devices.has(m.device) || !validScore(m.scores?.performance)) throw new Error('De opgeslagen meetgegevens zijn onvolledig.');
    devices.add(m.device);
  }
  return [...rows].sort((a, b) => (a.device === 'mobile' ? 0 : 1) - (b.device === 'mobile' ? 0 : 1));
}
export function reportFilename(input: ReportInput) {
  let hostname = 'website';
  try { hostname = new URL(input.run.target_url).hostname; } catch { /* Safe fallback. */ }
  const day = Number.isFinite(Date.parse(input.run.created_at)) ? new Date(input.run.created_at).toISOString().slice(0, 10) : 'zonder-datum';
  return `Vedantix-prestatierapport-${hostname.replace(/[^a-z0-9.-]/gi, '').slice(0, 90)}-${day}-${input.run.id.replace(/[^a-z0-9]/gi, '').slice(0, 8)}.pdf`;
}
const metrics = [
  ['speed_index', 'Speed Index', 'Hoe snel de zichtbare inhoud wordt opgebouwd.'],
  ['lcp', 'Grootste inhoud (LCP)', 'Wanneer het grootste zichtbare inhoudselement verschijnt.'],
  ['fcp', 'Eerste inhoud (FCP)', 'Wanneer de eerste tekst of afbeelding zichtbaar wordt.'],
  ['tbt', 'Blokkeertijd (TBT)', 'Tijd waarin lange taken de browser tijdens het laden blokkeren.'],
  ['cls', 'Verschuivingen (CLS)', 'Hoeveel de zichtbare inhoud onverwacht verschuift; zonder eenheid.'],
] as const;
const categories = [['performance', 'Prestaties'], ['accessibility', 'Toegankelijkheid'], ['best_practices', 'Goede praktijken'], ['seo', 'Technische SEO']] as const;
export const checkLabels: Record<string, string> = { passed: 'Geslaagd', failed: 'Aandacht nodig', error: 'Niet gemeten', not_applicable: 'Niet van toepassing', manual: 'Handmatig controleren', informative: 'Informatie' };

export async function renderWebsiteReport(input: ReportInput): Promise<Uint8Array> {
  const measurements = reportMeasurements(input);
  const pdf = await PDFDocument.create();
  const normal = await pdf.embedFont(StandardFonts.Helvetica), bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const reportId = `VR-${input.run.created_at.slice(0, 10).replace(/-/g, '')}-${input.run.id.slice(0, 8).toUpperCase()}`;
  pdf.setTitle(safe(`Websiteprestaties | ${input.website.name}`)); pdf.setAuthor('Vedantix'); pdf.setSubject('Google PageSpeed Insights - opgeslagen testmeting'); pdf.setCreator('Vedantix Control Center'); pdf.setLanguage('nl-NL');
  let page: PDFPage, y = 0;
  const rect = (x: number, top: number, width: number, height: number, color: RGB, border?: RGB) => page.drawRectangle({ x, y: H - top - height, width, height, color, ...(border ? { borderColor: border, borderWidth: .6 } : {}) });
  const text = (value: unknown, x: number, top: number, size = 10, font: PDFFont = normal, color = INK) => page.drawText(safe(value), { x, y: H - top - size, size, font, color });
  const lines = (value: unknown, width: number, size = 10, font = normal): string[] => {
    const out: string[] = [];
    for (const paragraph of safe(value).split('\n')) {
      let line = '';
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        if (font.widthOfTextAtSize(line ? line + ' ' + word : word, size) <= width) { line += (line ? ' ' : '') + word; continue; }
        if (line) { out.push(line); line = ''; }
        for (const char of word) {
          if (font.widthOfTextAtSize(line + char, size) > width) { out.push(line); line = ''; }
          line += char;
        }
      }
      out.push(line);
    }
    return out;
  };
  const at = (value: unknown, x: number, top: number, width: number, size = 10, font = normal, color = INK, leading = size * 1.5) => {
    const wrapped = lines(value, width, size, font); wrapped.forEach((line, i) => text(line, x, top + i * leading, size, font, color)); return wrapped.length * leading;
  };
  const newPage = (section: string, title: string) => {
    page = pdf.addPage([W, H]); rect(0, 0, W, 79, NAVY);
    // The same Vedantix V mark and navy/blue palette used by the website and invoices.
    const vx = M, vy = 24, scale = .82;
    page.drawLine({ start: { x: vx + 6 * scale, y: H - vy - 3 * scale }, end: { x: vx + 16 * scale, y: H - vy - 24 * scale }, color: WHITE, thickness: 2.4 });
    page.drawLine({ start: { x: vx + 26 * scale, y: H - vy - 3 * scale }, end: { x: vx + 16 * scale, y: H - vy - 24 * scale }, color: WHITE, thickness: 2.4 });
    page.drawLine({ start: { x: vx + 9 * scale, y: H - vy - 13 * scale }, end: { x: vx + 23 * scale, y: H - vy - 13 * scale }, color: rgb(.37, .65, 1), thickness: 1.8 });
    text('Vedantix', M + 34, 22, 20, bold, WHITE); text('Websites & online groei', M + 35, 48, 8, normal, rgb(.72, .79, .9));
    text('PRESTATIERAPPORT', W - M - 119, 26, 9, bold, WHITE); text(reportId, W - M - 119, 46, 7.5, normal, rgb(.72, .79, .9));
    text(section.toUpperCase(), M, 103, 8, bold, BLUE);
    y = 121 + at(title, M, 121, CW, 26, bold, NAVY, 31) + 15;
  };
  const ensure = (height: number, section = 'Meetresultaten', title = 'Vervolg') => { if (y + height > BOTTOM) newPage(section, title); };
  const paragraph = (value: unknown, size = 10, color = INK) => {
    for (const line of lines(value, CW, size)) { ensure(size * 1.5); text(line, M, y, size, normal, color); y += size * 1.5; }
    y += 9;
  };
  const heading = (value: string) => { ensure(65); text(value, M, y, 13, bold, NAVY); y += 25; };
  const callout = (title: string, body: string, color = BLUE) => {
    const h = 44 + lines(body, CW - 30, 10).length * 15; ensure(h + 12);
    rect(M, y, CW, h, PALE); rect(M, y, 3, h, color); text(title, M + 15, y + 12, 11, bold, color); at(body, M + 15, y + 33, CW - 30, 10); y += h + 14;
  };
  const metricValue = (m: any, key: string) => typeof m.metrics?.[key]?.display === 'string' && m.metrics[key].display ? m.metrics[key].display.slice(0, 80) : 'Niet beschikbaar';

  newPage('Website in beeld', 'Resultaten die inzicht geven.');
  y += at(input.customer?.company_name || input.website.name, M, y, CW, 16, bold, NAVY, 21) + 9;
  paragraph(input.run.target_url, 10, BLUE);
  paragraph(`Gemeten op ${date(input.run.created_at)} (Nederland).\nBron: Google PageSpeed Insights / Lighthouse.`, 9, MUTED);
  paragraph('Een overzicht van de snelheid en technische kwaliteit van de gemeten pagina. De resultaten hieronder komen uit een opgeslagen Google-test en zijn per apparaat weergegeven.');
  const gap = 15, cardWidth = (CW - gap) / 2, top = y + 5;
  for (const [i, device] of ['mobile', 'desktop'].entries()) {
    const m = measurements.find(m => m.device === device), x = M + i * (cardWidth + gap), score = m?.scores?.performance;
    rect(x, top, cardWidth, 218, PALE, BORDER); text(deviceName(device).toUpperCase(), x + 17, top + 16, 9, bold, MUTED);
    text(m ? String(score) : '-', x + 17, top + 37, 48, bold, scoreColor(score)); text(m ? '/ 100' : 'Geen resultaat', x + (m ? 112 : 55), top + 69, 10, normal, MUTED);
    text(m ? scoreLabel(score) : 'Niet opgenomen in deze meting', x + 17, top + 98, 11, bold, scoreColor(score));
    if (m) {
      text('Speed Index', x + 17, top + 129, 9, normal, MUTED); text(metricValue(m, 'speed_index'), x + 135, top + 127, 12, bold, NAVY);
      for (const [j, [key, label]] of categories.slice(1).entries()) { text(label, x + 17, top + 155 + j * 17, 9, normal, MUTED); text(validScore(m.scores?.[key]) ? `${m.scores[key]}/100` : 'n.b.', x + 169, top + 155 + j * 17, 9, bold); }
    } else at('Er wordt voor dit apparaat geen score afgeleid uit andere metingen.', x + 17, top + 130, cardWidth - 34, 10, normal, MUTED);
  }
  y = top + 233;
  paragraph('Score-indeling: 90-100 goed  |  50-89 verbetering mogelijk  |  0-49 aandacht nodig.', 8, MUTED);
  if (input.run.status === 'PARTIAL' || input.run.result?.errors?.length) {
    callout('Gedeeltelijke meting', 'Niet alle aangevraagde apparaten konden worden gemeten. Alleen de beschikbare resultaten staan in dit rapport. Een ontbrekende score is geen nul.', AMBER);
  } else {
    callout('De belangrijkste conclusie', measurements.map(m => `${deviceName(m.device)}: ${scoreLabel(m.scores.performance).toLowerCase()} (${m.scores.performance}/100 voor prestaties).`).join(' ') + ' Bekijk de detailpagina’s voor de afzonderlijke meetwaarden en verbeterpunten.');
  }
  paragraph('Dit rapport betreft de genoemde pagina en het genoemde meetmoment. Het is geen beoordeling van alle pagina’s of garantie voor iedere bezoeker.', 9, MUTED);
  if (input.includeNote && input.run.note?.trim()) { heading('Toelichting van Vedantix'); paragraph(input.run.note.slice(0, 500)); }

  for (const m of measurements) {
    newPage('Google PageSpeed Insights', `${deviceName(m.device)} in detail`);
    paragraph(`Meetmoment: ${date(m.measured_at || input.run.created_at)} (Nederland)${m.lighthouse_version ? ` | Lighthouse ${String(m.lighthouse_version).slice(0, 30)}` : ''}`, 9, MUTED);
    if (m.url && m.url !== input.run.target_url) paragraph(`Uiteindelijke URL na doorsturen: ${String(m.url).slice(0, 2000)}`, 9, MUTED);
    const scoresTop = y, sw = (CW - 24) / 4;
    for (const [i, [key, label]] of categories.entries()) {
      const x = M + i * (sw + 8), score = m.scores?.[key]; rect(x, scoresTop, sw, 85, PALE); text(label, x + 9, scoresTop + 10, 8, bold, MUTED);
      text(validScore(score) ? String(score) : '-', x + 9, scoresTop + 29, 28, bold, scoreColor(score)); text('/ 100', x + 68, scoresTop + 47, 8, normal, MUTED);
      text(validScore(score) ? scoreLabel(score) : 'Niet beschikbaar', x + 9, scoresTop + 67, 7.3, normal, scoreColor(score));
    }
    y += 99; heading('Hoe snel wordt de pagina bruikbaar?');
    for (const [key, label, description] of metrics) {
      const h = 15 + lines(description, CW - 146, 9).length * 13; ensure(h + 15);
      text(label, M + 10, y + 5, 10, bold); at(metricValue(m, key), M + CW - 119, y + 5, 109, 12, bold, NAVY);
      at(description, M + 10, y + 21, CW - 146, 9, normal, MUTED, 13);
      y += h + 6; page.drawLine({ start: { x: M, y: H - y }, end: { x: W - M, y: H - y }, thickness: .5, color: BORDER }); y += 7;
    }
    y += 9; heading('Verbeterpunten uit de Google-test');
    const opportunities = Array.isArray(m.opportunities) ? m.opportunities.slice(0, 8) : [];
    if (!opportunities.length) paragraph('Google gaf voor deze meting geen verbeterpunten door in het opgeslagen overzicht. Dit is geen volledige garantie dat er niets te verbeteren is.', 10, MUTED);
    for (const [i, op] of opportunities.entries()) {
      const title = String(op.title || 'Verbeterpunt').slice(0, 800), detail = String(op.display || 'Geen afzonderlijke besparing opgegeven.').slice(0, 800);
      const h = lines(title, CW - 34, 10, bold).length * 14 + lines(detail, CW - 34, 9).length * 13 + 8;
      ensure(h, `${deviceName(m.device)} - verbeterpunten`, 'Aanbevelingen'); text(String(i + 1).padStart(2, '0'), M, y + 1, 10, bold, BLUE);
      y += at(title, M + 28, y, CW - 34, 10, bold, INK, 14); y += at(detail, M + 28, y + 2, CW - 34, 9, normal, MUTED, 13) + 8;
    }
    paragraph('Eventuele besparingen zijn schattingen uit de test en mogen niet bij elkaar worden opgeteld.', 8, MUTED);
    for (const warning of (Array.isArray(m.warnings) ? m.warnings : []).slice(0, 10)) callout('Opmerking bij de meting', String(warning).slice(0, 1000), AMBER);
  }

  const agenticMeasurements = measurements.filter(m => Array.isArray(m.agentic?.checks) && m.agentic.checks.length);
  if (agenticMeasurements.length) {
    newPage('Experimentele Google-controles', 'Agentisch browsen');
    paragraph('Deze technische controles onderzoeken of software-agenten de pagina kunnen begrijpen en bedienen. Ze bewijzen niet dat een AI-assistent een complete klanttaak succesvol uitvoert.');
    for (const m of agenticMeasurements) {
      const checks = m.agentic.checks, passed = checks.filter((c: any) => c.status === 'passed').length, evaluated = checks.filter((c: any) => ['passed', 'failed'].includes(c.status)).length;
      heading(`${deviceName(m.device)}: ${passed} van ${evaluated} beoordeelde controles geslaagd`);
      paragraph('Informatie, handmatige controles, niet-toepasselijke controles en meetfouten tellen niet mee in deze verhouding. Dit is geen score op 100.', 9, MUTED);
      for (const check of checks.slice(0, 150)) {
        const label = checkLabels[check.status] || 'Niet gemeten', title = String(check.title || check.id).slice(0, 800), detail = String(check.display || '').slice(0, 500);
        const titleLines = lines(title, CW - 145, 9, bold), h = Math.max(24, titleLines.length * 13 + (detail ? lines(detail, CW - 145, 8).length * 12 : 0) + 12);
        ensure(h + 8, 'Agentisch browsen', `${deviceName(m.device)} - vervolg`); at(title, M, y, CW - 145, 9, bold, INK, 13);
        if (detail) at(detail, M, y + titleLines.length * 13 + 2, CW - 145, 8, normal, MUTED, 12);
        text(label, W - M - 132, y, 8, normal, check.status === 'passed' ? GREEN : check.status === 'failed' ? AMBER : MUTED);
        y += h; page.drawLine({ start: { x: M, y: H - y }, end: { x: W - M, y: H - y }, thickness: .5, color: BORDER }); y += 8;
      }
      if (checks.length > 150) paragraph('De eerste 150 controles zijn opgenomen. Bekijk de volledige lijst in Vedantix.', 9, MUTED);
    }
  }

  newPage('Betekenis & meetmethode', 'Meer dan alleen snelheid');
  const missingAgentic = measurements.filter(m => !Array.isArray(m.agentic?.checks) || !m.agentic.checks.length).map(m => deviceName(m.device));
  callout('Agentisch browsen', missingAgentic.length ? `Geen agentische controles opgeslagen voor: ${missingAgentic.join(', ')}. Deze zijn niet af te leiden uit de snelheidsscore. Een nieuwe meting vraagt de experimentele categorie bij Google op; beschikbaarheid hangt af van Google.` : 'De gemeten technische controles staan apart in dit rapport. Geslaagde controles geven geen garantie dat een agent elke taak op de website kan uitvoeren.');
  heading('Vindbaarheid in antwoorden van zoekmachines en AI');
  const topics = [
    ['AEO - Answer Engine Optimization', 'Inhoud duidelijk en bruikbaar maken voor directe antwoorden. Denk aan concrete vragen, heldere antwoorden en begrijpelijke structuur.'],
    ['GEO - Generative Engine Optimization', 'Inhoud vindbaar en bruikbaar maken als bron voor generatieve AI-antwoorden. Werkelijke bronvermeldingen vragen een aparte meting met vastgelegde zoekvragen.'],
    ['AIO - AI Optimization / AI Overviews', 'Een term die op verschillende manieren wordt gebruikt. Hier bedoelen we zichtbaarheid in AI-zoekervaringen, waaronder Google AI Overviews.'],
  ];
  for (const [title, body] of topics) { ensure(75); text(title, M, y, 10, bold, NAVY); y += 19; paragraph(body, 10, MUTED); }
  paragraph('Deze onderwerpen zijn in dit rapport niet gemeten. Google heeft hiervoor geen aparte PageSpeed-score. Een hoge technische SEO-score bewijst geen hoge positie of vermelding in een AI-antwoord. Voor Google AI-functies blijven de gebruikelijke SEO-principes gelden; er is geen speciaal AI-schema vereist.', 10);
  heading('Zo moet u deze resultaten lezen');
  paragraph('Dit zijn gesimuleerde labmetingen van een pagina op een bepaald moment. Apparaat, verbinding, serverbelasting en externe scripts kunnen de uitkomst veranderen. Voor conclusies over echte bezoekers zijn veldgegevens nodig. Dit rapport bevat geen volledige Core Web Vitals-beoordeling: TBT is niet hetzelfde als INP.', 9, MUTED);
  paragraph('Toegankelijkheid en technische SEO zijn automatische deelcontroles. Ze vervangen geen handmatige toegankelijkheidsaudit, beveiligingsonderzoek of onderzoek naar zoekposities. Opnieuw downloaden gebruikt dezelfde opgeslagen meetwaarden; een nieuwe test maakt een nieuw resultaat.', 9, MUTED);
  heading('Bronnen & herleidbaarheid');
  paragraph('Google PageSpeed Insights: developers.google.com/speed/docs/insights/v5/get-started\nAgentisch browsen: developer.chrome.com/docs/lighthouse/agentic-browsing/scoring\nGoogle AI-functies: developers.google.com/search/docs/appearance/ai-features', 8, MUTED);
  paragraph(`Rapportreferentie: ${reportId}\nMeting: ${input.run.id}`, 8, MUTED);

  const pages = pdf.getPages();
  for (const [i, p] of pages.entries()) {
    page = p; page.drawLine({ start: { x: M, y: 58 }, end: { x: W - M, y: 58 }, thickness: .6, color: BORDER });
    const contact = [input.company?.email || 'info@vedantix.nl', input.company?.website || 'vedantix.nl'].map(safe).join('  |  ');
    text('VEDANTIX  /  Websites & online groei', M, H - 47, 8, bold, NAVY);
    at(contact.slice(0, 180), M, H - 33, CW - 70, 7, normal, MUTED, 9);
    text(`${i + 1} / ${pages.length}`, W - M - 31, H - 44, 9, normal, MUTED);
  }
  return pdf.save();
}
