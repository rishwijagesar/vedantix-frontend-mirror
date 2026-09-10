# Vedantix performance, 10 September 2026

Baseline: https://pagespeed.web.dev/analysis/https-vedantix-nl/68ry1t54se

| Category | Mobile | Desktop |
| --- | ---: | ---: |
| Performance | 99 | 99 |
| Accessibility | 100 | 96 |
| Best practices | 96 | 96 |
| SEO | 100 | 100 |
| Agentic browsing | 3/3 | 3/3 |

The high mobile performance score coincided with failed JavaScript requests and
must not be treated as a fully working performance baseline. Google recorded
HTTP 429 responses for first-party JavaScript/CSS. CloudWatch recorded 16 Lambda
throttles in the 11:43 UTC minute. The eu-west-1 account concurrency limit is 10.
CloudFront was sending `/assets/*` to Lambda, even though the existing private S3
origin and its CloudFront read policy were already configured.

## Changes

- Publish old and new hashed assets from the exact Docker images into the existing
  `vedantix.nl-bucket/assets/` prefix before promoting the application. Never
  delete old assets: existing browser tabs and rollbacks still reference them.
- Set CloudFront distribution `E1RSCG0YTHVC5G`'s existing `/assets/*` behavior to
  `s3-origin`, using its existing OAC and cache policy. Remove the Lambda-only
  origin request policy from this behavior. The default application behavior
  continues to use the private Lambda origin with caching disabled.
- Attach `static-assets-deploy-policy.json` as the separate
  `vedantix-static-assets` inline policy on `vedantix-frontend-github-deploy`.
  It grants upload/read/list only for the asset prefix, with no deletion,
  bucket-policy, user/account or application permission changes.
- Group the used Lucide icons into one browser chunk to reduce small requests;
  route components and admin modules remain lazy.
- Load the existing Jotform reviews when they enter the viewport. Keep its
  content and behavior, and improve contrast using its stable CSS hooks.
- Verify all production asset response codes and SHA-256 bytes after deployment.
- Let the browser defer layout/painting of offscreen homepage content sections.
- Preserve React/TanStack-owned head nodes during client navigation. The legacy
  SEO effect removed route metadata outside React and caused `removeChild` errors.
  It now only adds missing metadata and cleans up the nodes it created. A React 19
  navigation regression check confirms route metadata survives, canonical links
  update, and unmounting removes owned metadata without errors.

After the asset cutover, the first measurement (`27xkiux169`, 14:04 CEST) was
96 mobile / 98 desktop performance, with 100 accessibility, 100 best practices,
100 SEO and 3/3 agentic on both. No failed first-party asset requests. Remaining
long tasks include Facebook Pixel and the review widget; the earlier 99 baseline
included missing application scripts and is not a valid performance comparison.

## Cutover and rollback

First deploy/upload both image asset sets. Verify successful uploads and live
asset checks before changing the CloudFront origin. Preserve the distribution
ETag and use a conditional update. After CloudFront reports Deployed, rerun the
asset check and browser checks. Do not alter the default Lambda behavior,
OACs, bucket public-access blocking, authentication or commerce configuration.

To roll back the origin, change only `/assets/*` back to `lambda-origin` and
restore origin request policy `b689b0a8-53d0-40ab-baf2-68738e2966ac`. To roll back
application code, deploy the previous immutable image. Retained hashed assets
support either release. Scores are individual lab measurements and may vary;
report all final categories and any observed errors rather than promising 100.
