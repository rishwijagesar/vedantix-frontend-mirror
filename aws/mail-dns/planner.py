"""Conservative Migadu DNS planner. No network or writes in this module."""
import hashlib
import json
import re
import shlex


class DnsError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


def fqdn(name, domain):
    name = name.lower().rstrip(".")
    if name == "@":
        return domain + "."
    if name == domain or name.endswith("." + domain):
        return name + "."
    return name + "." + domain + "."


def txt(value):
    # Route 53 TXT values may contain several quoted character strings.
    if not re.fullmatch(r'(?:"(?:[^"\\]|\\.)*"\s*)+', value):
        raise DnsError("Een bestaand TXT-record heeft een onbekende indeling. Controleer dit handmatig.", 409)
    return "".join(shlex.split(value))


def quote(value):
    if not isinstance(value, str) or not 0 < len(value.encode()) <= 255 or not value.isascii() or any(ord(c) < 32 for c in value):
        raise DnsError("Migadu gaf een onbruikbare TXT-waarde terug.", 502)
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


def expected_records(domain, records):
    """Validate complete provider output and restrict all writable names/values."""
    if not isinstance(records, list) or len(records) != 8:
        raise DnsError("Migadu gaf geen complete set DNS-records terug.", 502)
    result = {}
    for r in records:
        name = fqdn(r["name"], domain)
        kind, value = r["type"], r["value"]
        key = (name, kind)
        if name == domain + "." and kind == "MX":
            if (r.get("priority"), value.lower().rstrip(".")) not in [(10, "aspmx1.migadu.com"), (20, "aspmx2.migadu.com")]:
                raise DnsError("Onbekende Migadu mailserver.", 502)
            value = str(r["priority"]) + " " + value.lower().rstrip(".") + "."
        elif name == domain + "." and kind == "TXT":
            if value != "v=spf1 include:spf.migadu.com -all" and not re.fullmatch(r"(?:hosted-email-verify=)?[A-Za-z0-9_-]{4,200}", value):
                raise DnsError("Onbekend Migadu verificatie- of SPF-record.", 502)
            value = quote(value)
        elif name == "_dmarc." + domain + "." and kind == "TXT":
            if not re.fullmatch(r"v=DMARC1;\s*p=(none|quarantine|reject);?\s*", value):
                raise DnsError("Onbekend Migadu DMARC-beleid.", 502)
            value = quote(value)
        elif kind == "CNAME" and name in [f"key{i}._domainkey.{domain}." for i in (1, 2, 3)]:
            selector = name.split(".")[0]
            if value.lower().rstrip(".") != f"{selector}.{domain}._domainkey.migadu.com":
                raise DnsError("Onbekende Migadu DKIM-server.", 502)
            value = value.lower().rstrip(".") + "."
        else:
            raise DnsError("Migadu vraagt om een record buiten de toegestane mailinstellingen.", 502)
        result.setdefault(key, []).append(value)
    if len(result) != 6 or len(set(result.get((domain + ".", "MX"), []))) != 2 or len(set(result.get((domain + ".", "TXT"), []))) != 2:
        raise DnsError("Migadu gaf dubbele of onvolledige DNS-records terug.", 502)
    if quote("v=spf1 include:spf.migadu.com -all") not in result[(domain + ".", "TXT")]:
        raise DnsError("Het SPF-record ontbreekt.", 502)
    return result


def make_plan(domain_id, domain, zone_id, existing, provider_records, delegation_ok=True):
    desired = expected_records(domain, provider_records)
    changes, display, blockers = [], [], []
    if not delegation_ok:
        blockers.append("De publieke nameservers wijzen niet naar deze Route 53-zone. Controleer eerst de domeinkoppeling.")
    by_key = {}
    for r in existing:
        by_key.setdefault((r["Name"].lower().rstrip(".") + ".", r["Type"]), []).append(r)
    for (name, kind), values in sorted(desired.items()):
        same = by_key.get((name, kind), [])
        old = same[0] if len(same) == 1 else None
        bad = len(same) > 1 or (old is not None and set(old) != {"Name", "Type", "TTL", "ResourceRecords"})
        # A CNAME excludes other data at its name; delegated ancestors need manual work.
        bad = bad or any(k[0] == name and (k[1] == "CNAME" or kind == "CNAME") and k[1] != kind for k in by_key)
        bad = bad or any(k[1] in ("NS", "DNAME", "CNAME") and k[0] != domain + "." and name.endswith("." + k[0]) for k in by_key)
        before = [r["Value"] for r in old.get("ResourceRecords", [])] if old else []
        after = sorted(values)
        note = ""
        if bad:
            note = "Conflicterend record of bijzondere DNS-routering; handmatige controle nodig."
        elif old:
            if kind == "MX":
                normalize = lambda vs: sorted(" ".join(v.lower().rstrip(".").split()) for v in vs)
                if normalize(before) == normalize(values):
                    after = before
                else:
                    note = "Er zijn bestaande mailservers ingesteld. Een overstap moet eerst handmatig worden voorbereid."
            elif kind == "CNAME":
                if [v.lower().rstrip(".") for v in before] == [v.lower().rstrip(".") for v in values]:
                    after = before
                else:
                    note = "Deze DKIM-naam is al in gebruik."
            elif name == domain + ".":
                decoded = [txt(v) for v in before]
                spf = [v for v in decoded if v.lower().startswith("v=spf1")]
                expected_spf = "v=spf1 include:spf.migadu.com -all"
                if spf and spf != [expected_spf]:
                    note = "Er staat al een ander SPF-record. Laat de verzenddiensten eerst samenvoegen in één SPF-record."
                wanted_verification = [txt(v) for v in values if not txt(v).startswith("v=spf1")][0]
                if any(v.startswith("hosted-email-verify=") and v != wanted_verification for v in decoded):
                    note = "De bestaande Migadu domeinverificatie verschilt. Controleer het Migadu-account."
                after = before + [v for v in values if txt(v) not in decoded]
            else:
                dmarc = [txt(v) for v in before if txt(v).lower().startswith("v=dmarc1")]
                if len(dmarc) == 1 and re.match(r"^v=DMARC1;", dmarc[0]) and len(re.findall(r"(?:^|;)\s*p=(?:none|quarantine|reject)\s*(?:;|$)", dmarc[0])) == 1:
                    after = before  # Preserve existing policy, reporting destinations and unrelated TXT.
                else:
                    note = "Er staat al een afwijkend of ongeldig DMARC-record. Controleer dit eerst."
        if note:
            blockers.append(name + " " + kind + ": " + note)
            state = "blocked"
        elif before == after:
            state = "unchanged"
        else:
            state = "update" if old else "create"
            # Exact DELETE + CREATE is transactional. A concurrent edit makes it fail,
            # rather than being overwritten by a blind UPSERT.
            if old:
                changes.append({"Action": "DELETE", "ResourceRecordSet": old})
            changes.append({"Action": "CREATE", "ResourceRecordSet": {"Name": name, "Type": kind, "TTL": old["TTL"] if old else 300, "ResourceRecords": [{"Value": v} for v in after]}})
        display.append({"name": name, "type": kind, "before": before, "after": after, "state": state, "note": note})
    # Include the entire zone snapshot: even concurrent changes to a delegated
    # ancestor invalidate approval. Canonical ordering makes fresh reads stable.
    snapshot = sorted((dict(r, ResourceRecords=sorted(r["ResourceRecords"], key=lambda x:x["Value"])) if "ResourceRecords" in r else r for r in existing), key=lambda r:json.dumps(r, sort_keys=True))
    payload = {"domain_id": domain_id, "domain": domain, "zone_id": zone_id, "existing": snapshot, "records": display, "blockers": blockers}
    fingerprint = hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    return {"domain": domain, "fingerprint": fingerprint, "records": display, "blockers": blockers, "change_count": sum(r["state"] in ("create", "update") for r in display), "changes": changes}
