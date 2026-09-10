# Vedantix AWS serverless runtime

Vedantix production is deployed as a container image to AWS Lambda and served through CloudFront.

## Production request path

```text
Internet
  -> Route 53
  -> CloudFront
  -> SigV4 Origin Access Control
  -> vedantix-web-production-private (Lambda Function URL, AWS_IAM)
```

The production Lambda Function URL is not publicly invokable. CloudFront signs origin requests with SigV4. Direct requests to the production Function URL must return `403`.

## Staging request path

`vedantix-web-staging` also uses a Lambda Function URL with `AWS_IAM`. GitHub Actions obtains short-lived AWS credentials through OIDC and signs staging smoke-test requests with SigV4. The staging URL is therefore not publicly browsable.

## Deployment flow

```text
main CI
  -> immutable Docker image
  -> ECR
  -> staging Lambda
  -> signed staging smoke tests
  -> same immutable image to private production Lambda
  -> CloudFront / vedantix.nl smoke tests
  -> production-latest tag
```

A release is not promoted to production if CI or staging smoke tests fail.

## Rollback

The previous S3 origin remains available in the Vedantix CloudFront distribution as a rollback origin. CloudFront configuration snapshots are stored in the private Vedantix backup bucket before material origin changes.

## Expected security baseline

- Production Function URL auth: `AWS_IAM`
- Staging Function URL auth: `AWS_IAM`
- Direct production Function URL: `403`
- Direct staging Function URL: `403`
- Public application URL: `https://vedantix.nl`
- GitHub deployment authentication: OIDC, no long-lived AWS access key
- Production and staging receive the same immutable image SHA during promotion
