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


## Follow-up: unstable script execution (10 September 2026)

Report `1d8dbmxydm` measured 70 mobile / 82 desktop, with mobile TBT 1,942 ms despite a fast 1.76 s LCP. Do not treat the previous 97/100 run as a stable guarantee.

- Replace the Jotform browser runtime with native review cards and a keyboard-accessible dialog. The verified review text, author, photo, rating and Google feedback URL are retained. `/api/public-reviews` reads the same fixed public Jotform feed as data, validates links/ratings and caches it for an hour. A verified snapshot stays visible if the provider fails. No provider script is evaluated on our server. Existing Jotform review sync was configured as manual; updates to that feed are picked up by the cache.
- Run Meta Pixel in Partytown 0.14.4. Initial PageView remains in the worker bootstrap (also executed by its ordinary-script fallback); subsequent public route views are forwarded. Admin/customer portal exclusions stay in place. The same-origin script proxy only permits the fixed Meta host and library/config paths and never forwards user cookies. Config responses are not cached.
- Serve versioned Partytown assets through the existing private S3/CloudFront asset path. The deployment still verifies exact file bytes, including the legitimate worker sandbox HTML.
- Split homepage hydration with Suspense boundaries while retaining all server-rendered content; move footer CSS out of inline HTML and namespace hero animations. Fix the router compatibility wrapper adding a second question mark to query strings (which would duplicate the initial tracked page).
- CI checks provider parsing, URL validation, caching, offline fallback and proxy restrictions. Final live browser and repeated PageSpeed results are recorded in the pull request.
