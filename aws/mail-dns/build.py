"""Build a reproducible bootstrap CloudFormation template and CI Lambda package.

Usage: python aws/mail-dns/build.py OUTPUT_DIRECTORY
The SDK action baseline was generated with IAM Policy Autopilot (see README).
Scopes below only restrict that baseline to the configured zones and mail records.
"""
import json
from pathlib import Path
import sys
import zipfile

ROOT = Path(__file__).resolve().parent
ZONES = {
    "vedantix.nl": "Z02126103UDFQM8TTD66S",
    "naturehealing.nl": "Z0092658QCU4XZUDNHDJ",
    "jitan-sports.nl": "Z06635492I04W923ZI56B",
}
ACCOUNT = "381492205513"
REGION = "eu-west-1"
FUNCTION = "vedantix-mail-dns"


def policy():
    baseline = json.loads((ROOT / "autopilot-baseline.json").read_text())
    actions = {a for p in baseline["Policies"] for s in p["Policy"]["Statement"] for a in s["Action"]}
    expected = {"route53:ChangeResourceRecordSets", "route53:GetChange", "route53:GetHostedZone", "route53:ListResourceRecordSets"}
    if actions != expected:
        raise ValueError("Review changed IAM Autopilot actions before deploying")
    statements = [
        {"Effect": "Allow", "Action": sorted(actions - {"route53:ChangeResourceRecordSets", "route53:GetChange"}), "Resource": ["arn:aws:route53:::hostedzone/"+z for z in ZONES.values()]},
        {"Effect": "Allow", "Action": "route53:GetChange", "Resource": "arn:aws:route53:::change/*"},
        {"Effect": "Allow", "Action": ["logs:CreateLogStream", "logs:PutLogEvents"], "Resource": f"arn:aws:logs:{REGION}:{ACCOUNT}:log-group:/aws/lambda/{FUNCTION}:*"},
    ]
    for domain, zone in ZONES.items():
        keys = {
            "route53:ChangeResourceRecordSetsNormalizedRecordNames": [domain, "_dmarc."+domain]+[f"key{i}._domainkey.{domain}" for i in (1,2,3)],
            "route53:ChangeResourceRecordSetsRecordTypes": ["MX", "TXT", "CNAME"],
            "route53:ChangeResourceRecordSetsActions": ["CREATE", "DELETE"],
        }
        statements.append({"Effect": "Allow", "Action": "route53:ChangeResourceRecordSets", "Resource": "arn:aws:route53:::hostedzone/"+zone, "Condition": {"ForAllValues:StringEquals": keys, "Null": {k:"false" for k in keys}}})
    return {"Version":"2012-10-17", "Statement":statements}


def source():
    return (ROOT/"planner.py").read_text()+"\n\n"+(ROOT/"app.py").read_text().replace("from planner import DnsError, make_plan\n", "")


def template():
    return {
        "AWSTemplateFormatVersion": "2010-09-09",
        "Description": "Vedantix admin DNS setup: Supabase ADMIN authorization, scoped Route 53 role, no stored AWS credentials",
        "Resources": {
            "Logs": {"Type":"AWS::Logs::LogGroup", "DeletionPolicy":"Retain", "UpdateReplacePolicy":"Retain", "Properties":{"LogGroupName":"/aws/lambda/"+FUNCTION,"RetentionInDays":365}},
            "Role": {"Type":"AWS::IAM::Role", "Properties":{"RoleName":FUNCTION+"-exec", "Description":"Only verified Vedantix admins can plan and apply approved Migadu mail records", "AssumeRolePolicyDocument":{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}, "Policies":[{"PolicyName":"scoped-mail-dns","PolicyDocument":policy()}]}},
            "Function": {"Type":"AWS::Lambda::Function", "DependsOn":"Logs", "Properties":{"FunctionName":FUNCTION,"Runtime":"python3.13","Handler":"index.handler","Timeout":29,"MemorySize":256,"Role":{"Fn::GetAtt":["Role","Arn"]},"Environment":{"Variables":{"DOMAIN_ZONES":json.dumps(ZONES)}},"Code":{"ZipFile":source()},"Tags":[{"Key":"Project","Value":"Vedantix"},{"Key":"Purpose","Value":"admin-mail-dns"}]}},
            "Api": {"Type":"AWS::ApiGatewayV2::Api","Properties":{"Name":FUNCTION,"ProtocolType":"HTTP","Description":"Authentication and current ADMIN membership checked inside the Lambda before all DNS access"}},
            "Integration": {"Type":"AWS::ApiGatewayV2::Integration","Properties":{"ApiId":{"Ref":"Api"},"IntegrationType":"AWS_PROXY","IntegrationUri":{"Fn::GetAtt":["Function","Arn"]},"PayloadFormatVersion":"2.0","TimeoutInMillis":29000}},
            "Route": {"Type":"AWS::ApiGatewayV2::Route","Properties":{"ApiId":{"Ref":"Api"},"RouteKey":"ANY /dns","Target":{"Fn::Join":["/",["integrations",{"Ref":"Integration"}]]}}},
            "Stage": {"Type":"AWS::ApiGatewayV2::Stage","Properties":{"ApiId":{"Ref":"Api"},"StageName":"$default","AutoDeploy":True,"DefaultRouteSettings":{"ThrottlingBurstLimit":20,"ThrottlingRateLimit":10}}},
            "Invoke": {"Type":"AWS::Lambda::Permission","Properties":{"FunctionName":{"Ref":"Function"},"Action":"lambda:InvokeFunction","Principal":"apigateway.amazonaws.com","SourceAccount":{"Ref":"AWS::AccountId"},"SourceArn":{"Fn::Sub":"arn:${AWS::Partition}:execute-api:${AWS::Region}:${AWS::AccountId}:${Api}/*/*/dns"}}},
        },
        "Outputs":{"Endpoint":{"Value":{"Fn::Join":["",[{"Fn::GetAtt":["Api","ApiEndpoint"]},"/dns"]]}}},
    }


if __name__ == "__main__":
    target=Path(sys.argv[1]); target.mkdir(parents=True,exist_ok=True)
    (target/"template.json").write_text(json.dumps(template(),indent=2)+"\n")
    (target/"execution-policy.json").write_text(json.dumps(policy(),indent=2)+"\n")
    with zipfile.ZipFile(target/"function.zip","w",zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("index.py",source())
    print("Built CloudFormation template, scoped policy and Lambda ZIP")
