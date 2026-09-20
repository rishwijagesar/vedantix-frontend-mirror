import copy
import importlib
import json
import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from planner import DnsError, make_plan, txt

DOMAIN = "example.nl"
DOMAIN_ID = "00000000-0000-4000-8000-000000000001"
PROVIDER = [
    {"name": "@", "type": "TXT", "value": "hosted-email-verify=test123"},
    {"name": "@", "type": "TXT", "value": "v=spf1 include:spf.migadu.com -all"},
    {"name": "@", "type": "MX", "priority": 10, "value": "aspmx1.migadu.com"},
    {"name": "@", "type": "MX", "priority": 20, "value": "aspmx2.migadu.com"},
    {"name": "_dmarc", "type": "TXT", "value": "v=DMARC1; p=quarantine;"},
] + [{"name": f"key{i}._domainkey", "type": "CNAME", "value": f"key{i}.{DOMAIN}._domainkey.migadu.com."} for i in (1,2,3)]


def rr(name="example.nl.", kind="TXT", *values):
    return {"Name": name, "Type": kind, "TTL": 600, "ResourceRecords": [{"Value": v} for v in values]}


def plan(existing=None, provider=None, delegation_ok=True):
    return make_plan(DOMAIN_ID, DOMAIN, "ZTEST", existing or [], PROVIDER if provider is None else provider, delegation_ok)


class PlannerTests(unittest.TestCase):
    def test_empty_zone_only_six_mail_record_sets(self):
        p = plan()
        self.assertEqual(p["change_count"], 6)
        self.assertEqual(p["blockers"], [])
        self.assertEqual({c["ResourceRecordSet"]["Type"] for c in p["changes"]}, {"TXT", "MX", "CNAME"})

    def test_existing_website_and_verification_preserved(self):
        old = rr(DOMAIN+".", "TXT", '"google-site-verification=hello"', '"long-" "verification"')
        site = rr(DOMAIN+".", "A", "192.0.2.1")
        p = plan([old, site])
        new = next(c["ResourceRecordSet"] for c in p["changes"] if c["Action"] == "CREATE" and c["ResourceRecordSet"]["Name"] == DOMAIN+"." and c["ResourceRecordSet"]["Type"] == "TXT")
        self.assertEqual(new["TTL"], 600)
        self.assertTrue(all(v in new["ResourceRecords"] for v in old["ResourceRecords"]))
        self.assertFalse(any(c["ResourceRecordSet"]["Type"] == "A" for c in p["changes"]))
        self.assertIn({"Action":"DELETE", "ResourceRecordSet":old}, p["changes"])
        self.assertNotIn("UPSERT", str(p["changes"]))

    def test_repeated_setup_is_noop_and_mx_dots_equivalent(self):
        applied = [c["ResourceRecordSet"] for c in plan()["changes"]]
        for r in applied:
            if r["Type"] in ("MX", "CNAME"):
                for value in r["ResourceRecords"]:
                    value["Value"] = value["Value"].rstrip(".")
        p = plan(applied)
        self.assertEqual(p["changes"], [])
        self.assertEqual(p["blockers"], [])

    def test_other_mail_provider_blocks(self):
        self.assertTrue(plan([rr(DOMAIN+".", "MX", "0 other.example.")])["blockers"])

    def test_other_spf_and_duplicate_spf_block(self):
        for values in [('"v=spf1 include:other.example -all"',), ('"v=spf1 include:spf.migadu.com -all"','"v=spf1 -all"')]:
            with self.subTest(values=values):
                self.assertTrue(plan([rr(DOMAIN+".", "TXT", *values)])["blockers"])

    def test_existing_strict_dmarc_preserved(self):
        r = rr("_dmarc."+DOMAIN+".", "TXT", '"v=DMARC1; p=reject; rua=mailto:reports@example.nl;"')
        p = plan([r])
        self.assertFalse(p["blockers"])
        self.assertFalse(any(c["ResourceRecordSet"]["Name"] == r["Name"] for c in p["changes"]))

    def test_invalid_or_duplicate_dmarc_blocks(self):
        for values in [('"v=DMARC1; p=typo;"',), ('"v=DMARC1; p=reject;"','"v=DMARC1; p=none;"')]:
            self.assertTrue(plan([rr("_dmarc."+DOMAIN+".", "TXT", *values)])["blockers"])

    def test_conflicting_dkim_and_delegated_parent_block(self):
        for r in [rr("key1._domainkey."+DOMAIN+".", "TXT", '"other-key"'), rr("_domainkey."+DOMAIN+".","NS","ns.other.example.")]:
            self.assertTrue(plan([r])["blockers"])

    def test_weighted_record_blocks(self):
        r = rr(DOMAIN+".","MX","10 aspmx1.migadu.com.")
        r.update(SetIdentifier="other", Weight=1)
        self.assertTrue(plan([r])["blockers"])

    def test_incomplete_duplicate_and_foreign_records_rejected(self):
        for records in [PROVIDER[:-1], PROVIDER+[PROVIDER[0]], [dict(r, name="evil.example.") if i==0 else r for i,r in enumerate(PROVIDER)], [dict(r,value="key1.evil.com.") if i==5 else r for i,r in enumerate(PROVIDER)]]:
            with self.assertRaises(DnsError): plan(provider=records)

    def test_wrong_nameservers_block(self):
        self.assertTrue(plan(delegation_ok=False)["blockers"])

    def test_fingerprint_changes_with_zone_changes(self):
        self.assertNotEqual(plan()["fingerprint"], plan([rr(DOMAIN+".","A","192.0.2.1")])["fingerprint"])

    def test_split_txt_and_malformed_txt(self):
        self.assertEqual(txt('"abc" "def"'), "abcdef")
        with self.assertRaises(DnsError): txt("unquoted")


with patch("boto3.client"):
    app = importlib.import_module("app")


class HandlerTests(unittest.TestCase):
    def setUp(self):
        self.aws = MagicMock()
        self.rpc = patch.object(app, "request_json", side_effect=self.responses).start()
        patch.object(app, "route53", self.aws).start()
        patch.object(app, "ZONES", {DOMAIN:"ZTEST"}).start()
        patch.object(app, "audit").start()
        self.addCleanup(patch.stopall)
        self.admin = True
        self.registered = True
        self.aws.get_hosted_zone.return_value = {"HostedZone":{"Name":DOMAIN+".","Config":{"PrivateZone":False}},"DelegationSet":{"NameServers":["ns1.test","ns2.test"]}}
        self.aws.list_resource_record_sets.return_value = {"ResourceRecordSets":[], "IsTruncated":False}
        self.aws.change_resource_record_sets.return_value = {"ChangeInfo":{"Id":"/change/C123","Status":"PENDING"}}
        self.context = SimpleNamespace(aws_request_id="request-1",get_remaining_time_in_millis=lambda:20000)

    def responses(self, url, token=None, body=None, **kwargs):
        if url.endswith("/user"): return {"id":"admin-test"}
        if url.endswith("/is_staff"): return self.admin
        if "/rest/v1/domains?" in url: return [{"id":DOMAIN_ID,"domain_name":DOMAIN}] if self.registered else []
        if url.startswith("https://dns.google/"): return {"Status":0,"Answer":[{"type":2,"name":DOMAIN+".","data":n} for n in ["ns1.test.","ns2.test."]]}
        if url.endswith("/migadu-admin"): return {"ok":True,"records":PROVIDER}
        raise AssertionError(url)

    def invoke(self, body=None, method="POST", auth=True, origin="https://vedantix.nl"):
        headers={"origin":origin}
        if auth: headers["authorization"]="Bearer test.jwt.token-for-tests-only"
        return app.handler({"headers":headers,"requestContext":{"http":{"method":method}},"body":json.dumps(body or {"action":"preview","domain_id":DOMAIN_ID})}, self.context)

    def apply(self, **overrides):
        body={"action":"apply","domain_id":DOMAIN_ID,"fingerprint":plan()["fingerprint"],"confirm_domain":DOMAIN}
        body.update(overrides)
        return self.invoke(body)

    def test_anonymous_foreign_origin_and_get_rejected_before_network(self):
        for kw, status in [({"auth":False},401),({"origin":"https://evil.example"},403),({"method":"GET"},405)]:
            self.assertEqual(self.invoke(**kw)["statusCode"],status)
        self.rpc.assert_not_called()
        self.aws.change_resource_record_sets.assert_not_called()

    def test_nonadmin_and_invisible_domain_rejected(self):
        self.admin=False
        self.assertEqual(self.apply()["statusCode"],403)
        self.admin=True;self.registered=False
        self.assertEqual(self.apply()["statusCode"],404)
        self.aws.change_resource_record_sets.assert_not_called()

    def test_valid_preview_does_not_write(self):
        r=self.invoke()
        self.assertEqual(r["statusCode"],200)
        self.assertNotIn("changes",json.loads(r["body"]))
        self.aws.change_resource_record_sets.assert_not_called()

    def test_stale_plan_wrong_confirmation_and_arbitrary_records_rejected(self):
        for override in [{"fingerprint":"old"},{"confirm_domain":"other.nl"},{"records":[]},{"domain_name":"other.nl"}]:
            self.assertIn(self.apply(**override)["statusCode"],(400,409))
        self.aws.change_resource_record_sets.assert_not_called()

    def test_confirmed_apply_uses_fixed_zone_and_server_records(self):
        r=self.apply()
        self.assertEqual(r["statusCode"],200)
        self.assertEqual(json.loads(r["body"])["status"],"PENDING")
        args=self.aws.change_resource_record_sets.call_args.kwargs
        self.assertEqual(args["HostedZoneId"],"ZTEST")
        self.assertEqual(len(args["ChangeBatch"]["Changes"]),6)
        self.assertTrue(args["ChangeBatch"]["Comment"].startswith("vedantix:"+DOMAIN_ID+":"))

    def test_blocked_preview_cannot_apply(self):
        old=[rr(DOMAIN+".","MX","0 other.example.")]
        self.aws.list_resource_record_sets.return_value={"ResourceRecordSets":old}
        self.assertEqual(self.apply(fingerprint=plan(old)["fingerprint"])["statusCode"],409)
        self.aws.change_resource_record_sets.assert_not_called()

    def test_api_timeout_returns_uncertain_and_no_retry(self):
        from botocore.exceptions import ReadTimeoutError
        self.aws.change_resource_record_sets.side_effect=ReadTimeoutError(endpoint_url="private-details")
        r=self.apply()
        self.assertEqual(r["statusCode"],502)
        self.assertNotIn("private-details",r["body"])
        self.aws.change_resource_record_sets.assert_called_once()

    def test_late_request_does_not_start_write(self):
        self.context.get_remaining_time_in_millis=lambda:4000
        self.assertEqual(self.apply()["statusCode"],503)
        self.aws.change_resource_record_sets.assert_not_called()

    def test_replay_after_success_invalidates_old_approval(self):
        self.aws.list_resource_record_sets.return_value={"ResourceRecordSets":[c["ResourceRecordSet"] for c in plan()["changes"]]}
        self.assertEqual(self.apply()["statusCode"],409)
        self.aws.change_resource_record_sets.assert_not_called()

    def test_change_status_bound_to_domain(self):
        self.aws.get_change.return_value={"ChangeInfo":{"Status":"INSYNC","Comment":"vedantix:another-domain:request"}}
        self.assertEqual(self.invoke({"action":"status","domain_id":DOMAIN_ID,"change_id":"/change/C123"})["statusCode"],403)
        self.aws.get_change.return_value["ChangeInfo"]["Comment"]="vedantix:"+DOMAIN_ID+":request"
        r=self.invoke({"action":"status","domain_id":DOMAIN_ID,"change_id":"/change/C123"})
        self.assertEqual(json.loads(r["body"])["status"],"INSYNC")

    def test_expired_session_rejected(self):
        self.rpc.side_effect=DnsError("expired",401)
        self.assertEqual(self.apply()["statusCode"],401)
        self.aws.change_resource_record_sets.assert_not_called()

    def test_paginated_route53_snapshot(self):
        self.aws.list_resource_record_sets.side_effect=[{"ResourceRecordSets":[],"IsTruncated":True,"NextRecordName":"www.example.nl.","NextRecordType":"A"},{"ResourceRecordSets":[rr("www.example.nl.","A","192.0.2.1")]}]
        self.assertEqual(self.invoke()["statusCode"],200)
        self.assertEqual(self.aws.list_resource_record_sets.call_count,2)


if __name__ == "__main__": unittest.main()
