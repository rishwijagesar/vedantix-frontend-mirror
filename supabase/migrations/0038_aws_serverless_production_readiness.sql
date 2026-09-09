-- Align commerce readiness with the AWS Lambda serverless production architecture.

alter table public.commerce_production_activation
  add column if not exists staging_base_url text not null default 'https://dhnczzdgsgc436kkidetyxg45u0zxukp.lambda-url.eu-west-1.on.aws',
  add column if not exists staging_marker_ok boolean not null default false,
  add column if not exists expected_platform text not null default 'aws-lambda';

update public.commerce_production_activation
set expected_release_marker = 'VEDANTIX_AWS_SERVERLESS_COMMERCE_READY',
    expected_platform = 'aws-lambda',
    staging_base_url = 'https://dhnczzdgsgc436kkidetyxg45u0zxukp.lambda-url.eu-west-1.on.aws',
    staging_marker_ok = false,
    preview_marker_ok = false,
    updated_at = now()
where id = true;
