"""Vedantix admin-only DNS API. AWS role credentials; no stored AWS or Migadu keys."""
import base64
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
import uuid

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError
from planner import DnsError, make_plan

route53 = boto3.client("route53", config=Config(connect_timeout=2, read_timeout=4, retries={"total_max_attempts": 1}))
SUPABASE = "https://zxnexwqvoznmirajhgxj.supabase.co"
PUBLIC_KEY = "sb_publishable_QlxkbMaJ9IEBAPr9y0d1HQ_xh8Z6oEu"
ORIGINS = {"https://vedantix.nl", "https://www.vedantix.nl"}
ZONES = json.loads(os.environ.get("DOMAIN_ZONES", "{}"))


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


opener = urllib.request.build_opener(NoRedirect)


def request_json(url, token=None, body=None, timeout=5):
    headers = {"Accept": "application/json"}
    if token:
        # Authenticated calls only go to the fixed project, never a caller URL.
        if not url.startswith(SUPABASE + "/"):
            raise DnsError("Ongeldig verzoek.")
        headers.update({"Authorization": "Bearer " + token, "apikey": PUBLIC_KEY})
    if body is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None, headers=headers)
    try:
        with opener.open(req, timeout=timeout) as response:
            raw = response.read(262145)
            if len(raw) > 262144:
                raise DnsError("Het antwoord is te groot. Controleer de koppeling.", 502)
            return json.loads(raw)
    except urllib.error.HTTPError as e:
        if e.code in (401, 403):
            raise DnsError("Geen toegang. Log opnieuw in als Vedantix-beheerder en controleer de Migadu-koppeling.", e.code) from None
        if url == SUPABASE + "/functions/v1/migadu-admin" and e.code in (400, 404, 409, 422):
            raise DnsError("Koppel eerst je Migadu-account en voeg dit domein toe aan Migadu.", 409) from None
        raise DnsError("De koppeling antwoordt niet goed. Probeer later opnieuw.", 502) from None
    except (OSError, ValueError):
        raise DnsError("De controle kon niet worden afgerond. Probeer later opnieuw.", 502) from None


def authorize(token):
    try:
        user = request_json(SUPABASE + "/auth/v1/user", token)
    except DnsError as e:
        if e.status in (401, 403):
            raise DnsError("Log opnieuw in als Vedantix-beheerder.", 401) from None
        raise
    if not isinstance(user, dict) or not user.get("id"):
        raise DnsError("Log opnieuw in.", 401)
    if request_json(SUPABASE + "/rest/v1/rpc/is_staff", token, {"required_roles": ["ADMIN"]}) is not True:
        raise DnsError("Alleen een beheerder kan de DNS-instellingen beheren.", 403)
    return user["id"]


def domain_for(domain_id, token):
    try:
        domain_id = str(uuid.UUID(domain_id))
    except (ValueError, TypeError, AttributeError):
        raise DnsError("Kies een geldig domein.") from None
    rows = request_json(SUPABASE + "/rest/v1/domains?select=id,domain_name&id=eq." + domain_id, token)
    if not isinstance(rows, list) or len(rows) != 1:
        raise DnsError("Dit domein is niet beschikbaar.", 404)
    domain = rows[0]["domain_name"].lower().rstrip(".")
    if not re.fullmatch(r"[a-z0-9.-]+\.[a-z]{2,63}", domain) or domain not in ZONES:
        raise DnsError("Automatische DNS-inrichting is voor dit domein nog niet gekoppeld. Je kunt de Migadu-records handmatig instellen.", 409)
    return domain_id, domain, ZONES[domain]


def fresh_plan(domain_id, domain, zone, token):
    hosted = route53.get_hosted_zone(Id=zone)
    if hosted["HostedZone"]["Name"].lower().rstrip(".") != domain or hosted["HostedZone"]["Config"].get("PrivateZone", True):
        raise DnsError("De gekoppelde DNS-zone komt niet overeen met dit domein.", 409)
    ns = request_json("https://dns.google/resolve?" + urllib.parse.urlencode({"name": domain, "type": "NS"}))
    actual = {a["data"].lower().rstrip(".") for a in ns.get("Answer", []) if a.get("type") == 2 and a.get("name", "").lower().rstrip(".") == domain}
    wanted = {n.lower().rstrip(".") for n in hosted["DelegationSet"]["NameServers"]}
    delegation_ok = ns.get("Status") == 0 and bool(actual) and actual == wanted
    provider = request_json(SUPABASE + "/functions/v1/migadu-admin", token, {"action": "records", "domain_id": domain_id}, timeout=22)
    if provider.get("ok") is not True:
        raise DnsError("Migadu heeft de DNS-records nog niet bevestigd.", 502)
    records, args = [], {"HostedZoneId": zone}
    while True:
        page = route53.list_resource_record_sets(**args)
        records.extend(page["ResourceRecordSets"])
        if len(records) > 5000:
            raise DnsError("Deze DNS-zone vereist handmatige controle.", 409)
        if not page.get("IsTruncated"):
            break
        args = {"HostedZoneId": zone, "StartRecordName": page["NextRecordName"], "StartRecordType": page["NextRecordType"]}
        if page.get("NextRecordIdentifier"):
            args["StartRecordIdentifier"] = page["NextRecordIdentifier"]
    return make_plan(domain_id, domain, zone, records, provider["records"], delegation_ok)


def audit(event, **fields):
    # No request body, session, API key, password or provider exception in logs.
    print(json.dumps({"event": event, **fields}, sort_keys=True))


def handler(event, context):
    headers = {str(k).lower():v for k,v in (event.get("headers") or {}).items()}
    origin = headers.get("origin", "")
    response_headers = {"Content-Type": "application/json", "Cache-Control": "no-store", "Vary": "Origin"}
    if origin in ORIGINS:
        response_headers.update({"Access-Control-Allow-Origin": origin, "Access-Control-Allow-Headers": "authorization,content-type", "Access-Control-Allow-Methods": "POST,OPTIONS"})
    def respond(status, data):
        return {"statusCode": status, "headers": response_headers, "body": json.dumps(data)}
    actor = None
    action = None
    try:
        if origin and origin not in ORIGINS:
            raise DnsError("Deze herkomst is niet toegestaan.", 403)
        method = event.get("requestContext", {}).get("http", {}).get("method")
        if method == "OPTIONS":
            return respond(204, {})
        if method != "POST":
            raise DnsError("Gebruik POST.", 405)
        authorization = headers.get("authorization", "")
        if not re.fullmatch(r"Bearer [A-Za-z0-9_.-]{20,8192}", authorization):
            raise DnsError("Log in als Vedantix-beheerder.", 401)
        token = authorization[7:]
        actor = authorize(token)
        raw = event.get("body") or ""
        if len(raw) > 12000:
            raise DnsError("Het verzoek is te groot.", 413)
        try:
            body = json.loads(base64.b64decode(raw, validate=True) if event.get("isBase64Encoded") else raw)
        except (ValueError, TypeError):
            raise DnsError("Ongeldig verzoek.") from None
        if not isinstance(body, dict) or set(body) - {"action", "domain_id", "fingerprint", "confirm_domain", "change_id"}:
            raise DnsError("Onbekende instellingen in het verzoek.")
        action = body.get("action")
        if action not in ("preview", "apply", "status"):
            raise DnsError("Onbekende actie.")
        domain_id, domain, zone = domain_for(body.get("domain_id"), token)
        if action == "status":
            change_id = body.get("change_id", "")
            if not isinstance(change_id, str) or not re.fullmatch(r"(?:/change/)?C[A-Z0-9]{1,64}", change_id):
                raise DnsError("Ongeldige DNS-wijziging.")
            info = route53.get_change(Id=change_id)["ChangeInfo"]
            if not info.get("Comment", "").startswith("vedantix:" + domain_id + ":"):
                raise DnsError("Deze wijziging hoort niet bij dit domein.", 403)
            return respond(200, {"ok": True, "status": info["Status"]})
        plan = fresh_plan(domain_id, domain, zone, token)
        changes = plan.pop("changes")
        if action == "preview":
            return respond(200, {"ok": True, **plan})
        if body.get("confirm_domain") != domain or body.get("fingerprint") != plan["fingerprint"]:
            raise DnsError("De instellingen zijn gewijzigd. Bekijk eerst een nieuw voorstel en bevestig opnieuw.", 409)
        if plan["blockers"]:
            raise DnsError("Los eerst de gemelde DNS-conflicten op.", 409)
        if not changes:
            return respond(200, {"ok": True, "status": "UNCHANGED"})
        if context.get_remaining_time_in_millis() < 5000:
            raise DnsError("De controle duurde te lang. Er is nog niets aangepast; probeer opnieuw.", 503)
        request_id = context.aws_request_id
        audit("dns_apply_started", actor=actor, domain_id=domain_id, fingerprint=plan["fingerprint"], request_id=request_id, records=plan["records"])
        try:
            result = route53.change_resource_record_sets(HostedZoneId=zone, ChangeBatch={"Comment": "vedantix:" + domain_id + ":" + request_id, "Changes": changes})
        except (BotoCoreError, ClientError):
            audit("dns_apply_unconfirmed", actor=actor, domain_id=domain_id, request_id=request_id)
            raise DnsError("Geen bevestiging van AWS ontvangen. Vernieuw eerst het DNS-voorstel om te controleren of de wijziging is verwerkt.", 502) from None
        info = result["ChangeInfo"]
        audit("dns_apply_accepted", actor=actor, domain_id=domain_id, request_id=request_id, change_id=info["Id"])
        return respond(200, {"ok": True, "change_id": info["Id"], "status": info["Status"]})
    except DnsError as e:
        return respond(e.status, {"ok": False, "error": str(e)})
    except Exception:
        audit("dns_request_failed", actor=actor, action=action, request_id=getattr(context, "aws_request_id", "unknown"))
        return respond(502, {"ok": False, "error": "De DNS-controle is niet afgerond. Vernieuw het overzicht voordat je opnieuw probeert."})
