# Batched production deployment

Vedantix uses pull-request CI and manual production releases to reduce GitHub Actions usage.

## Development flow

1. Create a branch and pull request.
2. CI validates the pull request.
3. Merge approved changes into `main`.
4. Merging to `main` does **not** automatically run CI or deploy production.
5. Additional validated changes may be merged and accumulated on `main`.

## Production release

When the accumulated changes are ready to release, run the GitHub Actions workflow **Batch deploy production** manually.

The workflow always checks out the latest `main`, creates one immutable Docker image, publishes assets, promotes the same image through staging to production, runs smoke tests, verifies all production assets, and marks the image as `production-latest` only after successful validation.

A production deployment is intentionally not cancelled once started. This avoids leaving assets, staging, and production in a partially promoted state.

## CI usage controls

- CI runs for pull requests and can also be started manually.
- A newer CI run for the same pull request cancels the older run.
- Pushes to `main` no longer trigger another duplicate CI run.
- Production no longer deploys automatically after every merge.
