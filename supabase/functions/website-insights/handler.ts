import { sameAnalyticsSite } from './api.ts';
import { InsightsError, analyticsReport, createGoogleClient, credentials, googleList, identifier, label, measurementUrl, pageSpeed, propertyInput, safeProperty, safeStream, streamIdentifier, uuid, websiteUrl } from './api.ts';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Cache-Control': 'no-store' };
const settingsFields = 'website_id,pagespeed_enabled,pagespeed_path,pagespeed_devices,ga_connection_id,ga_enabled,ga_property,ga_stream,ga_measurement_id,ga_property_info,ga_pending,updated_at';
const mutations = new Set(['pagespeed.save','pagespeed.run','analytics.attach','analytics.create','analytics.update','analytics.toggle','analytics.unlink','analytics.delete','analytics.run','run.note','run.delete']);
const clearGoogle = { ga_enabled: false, ga_connection_id: null, ga_property: null, ga_stream: null, ga_measurement_id: null, ga_property_info: null, ga_pending: false };
const checked = async (query: any) => { const r = await query; if (r.error) throw new InsightsError('De gegevens konden niet worden opgeslagen of opgehaald. Vernieuw het overzicht.', 500); return r.data; };
const validId = (value: unknown) => { if (typeof value !== 'string' || !uuid.test(value)) throw new InsightsError('Ongeldig item.'); return value; };
const message = (e: unknown) => e instanceof InsightsError ? e.message : 'De aanvraag is niet afgerond. Vernieuw het overzicht en probeer opnieuw.';
export function createInsightsHandler(createUser: (authorization: string) => any, createAdmin: () => any, dependencies = { createGoogleClient, pageSpeed }, fallbackKey: string | null = null) {
  return async (request: Request) => {
    const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return json({ error: 'Gebruik POST.' }, 405);
    let db: any; let lock: string | null = null; let websiteId: string | null = null; let audit: string | null = null;
    try {
      const authorization = request.headers.get('authorization') || '';
      if (!authorization.startsWith('Bearer ')) throw new InsightsError('Log in als beheerder.', 401);
      const userClient = createUser(authorization);
      const userResult = await userClient.auth.getUser();
      const user = userResult.data?.user;
      if (userResult.error || !user) throw new InsightsError('Log opnieuw in.', 401);
      const permission = await userClient.rpc('is_staff', { required_roles: ['ADMIN'] });
      if (permission.error || permission.data !== true) throw new InsightsError('Alleen beheerders hebben toegang.', 403);
      if (Number(request.headers.get('content-length')) > 24000) throw new InsightsError('Het bestand is te groot.', 413);
      const reader = request.body?.getReader(); let size = 0; let raw = '';
      const decoder = new TextDecoder();
      if (reader) { while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > 24000) { await reader.cancel(); throw new InsightsError('Het bestand is te groot.', 413); } raw += decoder.decode(value, { stream: true }); } raw += decoder.decode(); }
      let body: any; try { body = JSON.parse(raw); } catch { throw new InsightsError('Ongeldig verzoek.'); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new InsightsError('Ongeldig verzoek.');
      const action = body.action;
      db = createAdmin();
      const secret = (key: string, op = 'read', value: string | null = null) => checked(db.rpc('google_insights_secret', { p_key: key, p_action: op, p_value: value }));
      const client = async (id: string) => {
        validId(id);
        const row = await checked(db.from('google_insights_connections').select('id').eq('id', id).maybeSingle());
        if (!row) throw new InsightsError('Selecteer eerst een Google-koppeling.');
        const value = await secret('connection-' + id);
        if (!value) throw new InsightsError('Upload opnieuw de Google-sleutel bij deze koppeling.');
        return dependencies.createGoogleClient(credentials(value));
      };
      if (action === 'connections.list') {
        const connections = await checked(db.from('google_insights_connections').select('id,label,client_email,updated_at').order('label'));
        return json({ connections, pagespeed_key_configured: Boolean(await secret('pagespeed') || fallbackKey) });
      }
      if (action === 'connections.save') {
        const id = body.connection_id ? validId(body.connection_id) : crypto.randomUUID();
        const name = label(body.label);
        const old = body.connection_id ? await checked(db.from('google_insights_connections').select('id,client_email').eq('id', id).single()) : null;
        if (body.credentials) {
          const value = credentials(body.credentials);
          if (old && old.client_email !== value.client_email) throw new InsightsError('Gebruik een nieuwe koppeling voor een ander serviceaccount. Je kunt hier wel de sleutel vervangen.');
          const api = await dependencies.createGoogleClient(value);
          const accounts = await googleList(api, 'accountSummaries', 'accountSummaries');
          if (!accounts.length) throw new InsightsError('Deze sleutel werkt, maar heeft nog geen toegang tot Analytics. Voeg het serviceaccount toe als Bewerker in Google Analytics.');
          // Create metadata first; the FK prevents deleting a connection that is still in use.
          if (!old) await checked(db.from('google_insights_connections').insert({ id, label: name, client_email: value.client_email, created_by: user.id }));
          try { await secret('connection-' + id, 'save', JSON.stringify(value)); }
          catch (e) { if (!old) await db.from('google_insights_connections').delete().eq('id', id); throw e; }
        } else if (!old) throw new InsightsError('Upload het JSON-sleutelbestand.');
        await checked(db.from('google_insights_connections').update({ label: name, updated_at: new Date().toISOString() }).eq('id', id));
        return json({ ok: true });
      }
      if (action === 'connections.delete') {
        const id = validId(body.connection_id);
        const refs = await checked(db.from('website_google_insights').select('website_id').eq('ga_connection_id', id).limit(1));
        if (refs.length) throw new InsightsError('Ontkoppel eerst de websites die deze Google-koppeling gebruiken.', 409);
        await checked(db.from('google_insights_connections').delete().eq('id', id));
        await secret('connection-' + id, 'delete'); return json({ ok: true });
      }
      if (action === 'pagespeed.key') {
        if (body.remove === true) await secret('pagespeed', 'delete');
        else { if (typeof body.key !== 'string' || !/^[A-Za-z0-9_-]{20,200}$/.test(body.key)) throw new InsightsError('Vul een geldige PageSpeed API-sleutel in.'); await secret('pagespeed', 'save', body.key); }
        return json({ ok: true });
      }
      if (action === 'google.browse') {
        const api = await client(body.connection_id);
        if (body.property) {
          const property = identifier(body.property, 'properties');
          const info = safeProperty(await api('admin', property));
          const streams = (await googleList(api, property + '/dataStreams', 'dataStreams')).filter(x => x.type === 'WEB_DATA_STREAM').map(safeStream);
          return json({ property: info, streams });
        }
        const accounts = await googleList(api, 'accountSummaries', 'accountSummaries');
        return json({ accounts: accounts.map(x => ({ account: identifier(x.account, 'accounts'), displayName: String(x.displayName || ''), properties: (x.propertySummaries || []).map((p: any) => ({ name: identifier(p.property, 'properties'), displayName: String(p.displayName || '') })) })) });
      }
      websiteId = validId(body.website_id);
      const website = await checked(db.from('websites').select('id,name,production_url').eq('id', websiteId).maybeSingle());
      if (!website) throw new InsightsError('Website niet gevonden.', 404);
      if (action === 'overview') {
        const settings = await checked(db.from('website_google_insights').select(settingsFields).eq('website_id', websiteId).maybeSingle());
        const runs = await checked(db.from('website_insight_runs').select('*').eq('website_id', websiteId).order('created_at', { ascending: false }).limit(50));
        return json({ settings, runs });
      }
      if (!mutations.has(action)) throw new InsightsError('Onbekende actie.');
      lock = crypto.randomUUID();
      if (!await checked(db.rpc('google_insights_claim', { p_website_id: websiteId, p_lock_id: lock }))) { lock = null; throw new InsightsError('Er loopt al een actie voor deze website. Vernieuw straks het overzicht.', 409); }
      audit = validId(body.request_id);
      const inserted = await db.from('google_insights_audit').insert({ request_id: audit, actor_id: user.id, website_id: websiteId, action });
      if (inserted.error) { audit = null; throw new InsightsError('Dit verzoek is al verwerkt of kon niet worden geregistreerd. Vernieuw het overzicht.', 409); }
      const s = await checked(db.from('website_google_insights').select(settingsFields).eq('website_id', websiteId).single());
      const save = (changes: any) => checked(db.from('website_google_insights').update({ ...changes, updated_at: new Date().toISOString() }).eq('website_id', websiteId).eq('lock_id', lock));
      let result: any = { ok: true };
      if (action === 'pagespeed.save') {
        measurementUrl(website.production_url, body.path);
        if (typeof body.enabled !== 'boolean' || !Array.isArray(body.devices) || body.devices.length < 1 || body.devices.length > 2 || body.devices.some((x: unknown) => !['mobile', 'desktop'].includes(String(x)))) throw new InsightsError('Kies mobiel en/of desktop.');
        await save({ pagespeed_enabled: body.enabled, pagespeed_path: body.path, pagespeed_devices: [...new Set(body.devices)] });
      } else if (action === 'run.note' || action === 'run.delete') {
        const id = validId(body.run_id);
        const run = await checked(db.from('website_insight_runs').select('id,status').eq('id', id).eq('website_id', websiteId).maybeSingle());
        if (!run) throw new InsightsError('Meting niet gevonden.', 404);
        if (run.status === 'RUNNING') throw new InsightsError('Deze meting is nog bezig.');
        if (action === 'run.delete') await checked(db.from('website_insight_runs').delete().eq('id', id).eq('website_id', websiteId));
        else { if (typeof body.note !== 'string' || body.note.length > 500) throw new InsightsError('Een notitie mag maximaal 500 tekens bevatten.'); await checked(db.from('website_insight_runs').update({ note: body.note }).eq('id', id).eq('website_id', websiteId)); }
      } else if (action === 'analytics.unlink') {
        if (body.confirm !== website.name) throw new InsightsError('Typ de websitenaam ter bevestiging.');
        await save(clearGoogle);
      } else if (action === 'analytics.toggle') {
        if (typeof body.enabled !== 'boolean' || (body.enabled && (!s.ga_measurement_id || s.ga_pending))) throw new InsightsError('Rond eerst de Analytics-koppeling af.');
        await save({ ga_enabled: body.enabled });
      } else if (action === 'analytics.attach' || action === 'analytics.create') {
        if (s.ga_property && !s.ga_pending) throw new InsightsError('Ontkoppel eerst de huidige meetomgeving.', 409);
        const connectionId = validId(body.connection_id); const api = await client(connectionId);
        let property: any; let stream: any;
        if (action === 'analytics.create') {
          if (s.ga_pending) throw new InsightsError('Een eerdere aanmaak is nog niet bevestigd. Vernieuw de Google-lijst en koppel de aangemaakte meetomgeving, of ontkoppel eerst na controle.', 409);
          const input = propertyInput(body); const parent = identifier(body.account, 'accounts');
          websiteUrl(website.production_url);
          await save({ ga_pending: true, ga_connection_id: connectionId });
          property = safeProperty(await api('admin', 'properties', 'POST', { ...input, parent }));
          await save({ ga_property: property.name, ga_property_info: property });
          stream = safeStream(await api('admin', property.name + '/dataStreams', 'POST', { displayName: label(body.stream_name || website.name), type: 'WEB_DATA_STREAM', webStreamData: { defaultUri: website.production_url } }));
        } else {
          const name = identifier(body.property, 'properties');
          property = safeProperty(await api('admin', name));
          if (property.trashed) throw new InsightsError('Deze meetomgeving staat in de prullenbak bij Google.');
          if (body.create_stream === true) {
            // A pending property can be recovered without creating a second property.
            if (s.ga_pending && s.ga_property && s.ga_property !== name) throw new InsightsError('Koppel eerst de eerder aangemaakte meetomgeving, of ontkoppel na controle.');
            const existing = await googleList(api, name + '/dataStreams', 'dataStreams');
            const matching = existing.filter(x => x.type === 'WEB_DATA_STREAM' && x.webStreamData?.defaultUri && sameAnalyticsSite(x.webStreamData.defaultUri, website.production_url));
            if (matching.length) throw new InsightsError('Er bestaat al een webgegevensstream voor deze website. Selecteer die uit de lijst.');
            await save({ ga_pending: true, ga_connection_id: connectionId, ga_property: name, ga_property_info: property });
            stream = safeStream(await api('admin', name + '/dataStreams', 'POST', { displayName: label(body.stream_name || website.name), type: 'WEB_DATA_STREAM', webStreamData: { defaultUri: websiteUrl(website.production_url).href } }));
          } else stream = safeStream(await api('admin', streamIdentifier(body.stream, name)));
        }
        if (stream.type !== 'WEB_DATA_STREAM' || !/^G-[A-Z0-9]+$/.test(stream.measurementId)) throw new InsightsError('Google gaf geen geldige webmeetcode terug. Controleer de meetomgeving.', 502);
        streamIdentifier(stream.name, property.name);
        if (!sameAnalyticsSite(stream.defaultUri, website.production_url)) throw new InsightsError('De URL van deze webgegevensstream komt niet overeen met de productie-URL van de website. Pas die eerst aan bij Google.');
        // Explicitly managed page views: prevent automatic form, search, and history events.
        await api('admin-alpha', stream.name + '/enhancedMeasurementSettings?updateMask=stream_enabled', 'PATCH', { streamEnabled: false });
        await save({ ga_enabled: true, ga_connection_id: connectionId, ga_property: property.name, ga_stream: stream.name, ga_measurement_id: stream.measurementId, ga_property_info: { ...property, stream }, ga_pending: false });
      } else if (action === 'analytics.update' || action === 'analytics.delete') {
        const property = identifier(s.ga_property, 'properties'); const api = await client(s.ga_connection_id);
        if (action === 'analytics.delete') {
          if (body.confirm !== property) throw new InsightsError('Typ het Google-propertynummer ter bevestiging.');
          const linked = await checked(db.from('website_google_insights').select('website_id').eq('ga_property', property).neq('website_id', websiteId).limit(1));
          if (linked.length) throw new InsightsError('Deze meetomgeving wordt ook door een andere website in Vedantix gebruikt. Ontkoppel deze website of beheer de gedeelde meetomgeving bij Google.', 409);
          await api('admin', property, 'DELETE'); await save(clearGoogle);
        } else {
          const input = propertyInput(body);
          const info = safeProperty(await api('admin', property + '?updateMask=display_name,time_zone,currency_code', 'PATCH', { name: property, ...input }));
          await save({ ga_property_info: { ...info, stream: s.ga_property_info?.stream } });
          const name = streamIdentifier(s.ga_stream, property);
          const stream = safeStream(await api('admin', name + '?updateMask=display_name,web_stream_data.default_uri', 'PATCH', { name, displayName: label(body.stream_name), webStreamData: { defaultUri: websiteUrl(website.production_url).href } }));
          await save({ ga_property_info: { ...info, stream } });
        }
      } else if (action === 'pagespeed.run' || action === 'analytics.run') {
        const isSpeed = action === 'pagespeed.run';
        if (isSpeed ? !s.pagespeed_enabled : !s.ga_enabled || s.ga_pending) throw new InsightsError('Activeer eerst ' + (isSpeed ? 'PageSpeed' : 'Analytics') + ' voor deze website.');
        const target = isSpeed ? measurementUrl(website.production_url, s.pagespeed_path) : websiteUrl(website.production_url).href;
        const runId = crypto.randomUUID();
        // A crashed/expired worker must not leave the history displaying "running" forever.
        await checked(db.from('website_insight_runs').update({ status: 'FAILED', error: 'De vorige meting is afgebroken. Start een nieuwe meting.', finished_at: new Date().toISOString() }).eq('website_id', websiteId).eq('status', 'RUNNING'));
        await checked(db.from('website_insight_runs').insert({ id: runId, website_id: websiteId, kind: isSpeed ? 'pagespeed' : 'analytics', status: 'RUNNING', target_url: target, created_by: user.id }));
        try {
          let report: any; let status = 'COMPLETED'; let error: string | null = null;
          if (isSpeed) {
            const key = await secret('pagespeed') || fallbackKey;
            const values = await Promise.allSettled(s.pagespeed_devices.map((device: string) => dependencies.pageSpeed(target, device, key)));
            const measurements = values.flatMap(x => x.status === 'fulfilled' ? [x.value] : []);
            const errors = values.flatMap((x, i) => x.status === 'rejected' ? [{ device: s.pagespeed_devices[i], message: message(x.reason) }] : []);
            report = { measurements, errors }; status = !measurements.length ? 'FAILED' : errors.length ? 'PARTIAL' : 'COMPLETED'; error = errors.map(x => x.message).join(' ') || null;
          } else report = await analyticsReport(await client(s.ga_connection_id), identifier(s.ga_property, 'properties'), target, Number(body.days || 28));
          await checked(db.from('website_insight_runs').update({ status, result: report, error, finished_at: new Date().toISOString() }).eq('id', runId));
          result = { ok: true, run_id: runId, status };
        } catch (e) { await db.from('website_insight_runs').update({ status: 'FAILED', error: message(e), finished_at: new Date().toISOString() }).eq('id', runId); throw e; }
      }
      await checked(db.from('google_insights_audit').update({ status: 'succeeded', finished_at: new Date().toISOString() }).eq('request_id', audit));
      return json(result);
    } catch (e) {
      if (db && audit) await db.from('google_insights_audit').update({ status: 'unconfirmed', finished_at: new Date().toISOString() }).eq('request_id', audit);
      return json({ error: message(e) }, e instanceof InsightsError ? e.status : 500);
    } finally {
      if (db && lock && websiteId) await db.from('website_google_insights').update({ lock_id: null, lock_until: null }).eq('website_id', websiteId).eq('lock_id', lock);
    }
  };
}

