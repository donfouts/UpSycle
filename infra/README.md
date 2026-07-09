# UpSycle Infrastructure (AWS CDK)

Self-contained AWS CDK v2 (TypeScript) app that provisions all AWS infrastructure
for the UpSycle marketplace. This directory has its own `package.json`,
`tsconfig.json`, and `cdk.json` — it is independent of the Next.js app's
`package.json` at the repo root.

Full design rationale lives in
[`../../Claude_output/infrastructure-plan.md`](../../Claude_output/infrastructure-plan.md)
(serverless-first design, NAT Gateway avoidance strategy, cost model) and
[`../../Claude_output/tech-stack-recommendation.md`](../../Claude_output/tech-stack-recommendation.md).
Read those first — this README assumes familiarity with them.

**Status: deployed and live.** All stacks below (except `DnsStack`) are
running in the target AWS account (`us-west-2`). Any `cdk deploy` from here
on modifies a real, billed, live environment — treat changes accordingly.

## Stacks

All resources in every stack are tagged `project: UpSycle` (applied once via
`cdk.Tags.of(app).add('project', 'UpSycle')` in `bin/infra.ts`, so it
propagates to every stack and every child construct automatically) so AWS Cost
Explorer can filter and invoice by this tag. A few CloudFormation resource
types have no AWS-level tagging support at all (e.g. `AWS::Cognito::UserPoolClient`,
`AWS::EC2::Route`, `AWS::S3::BucketPolicy`, CDK's internal
`Custom::VpcRestrictDefaultSG` helper Lambda) — those are AWS/CDK-framework
limitations, not gaps in this tagging setup; every taggable resource type is tagged.

| Stack | Purpose |
|---|---|
| `UpSycle-NetworkStack` | VPC with a `PUBLIC` subnet (RDS lives here, see DataStack) and an unused `PRIVATE_ISOLATED` subnet kept for any future resource that should never be internet-reachable. No NAT Gateway, no Elastic IP. Free S3 Gateway VPC Endpoint. |
| `UpSycle-DataStack` | RDS PostgreSQL `db.t4g.micro`, single-AZ, 20GB gp3, storage-encrypted, publicly accessible (see the stack's doc comment for why). Credentials are auto-generated into Secrets Manager (`upsycle/rds/postgres-admin`) — never hardcoded. |
| `UpSycle-AuthStack` | Cognito User Pool (Essentials tier) with `buyer` / `seller` / `admin` groups (a user can belong to more than one, satisfying Requirement.MD's multi-role rule) and a public (no-secret) User Pool Client for the Next.js app, configured for Authorization Code + PKCE. |
| `UpSycle-StorageStack` | Two S3 buckets — product photos (public via CloudFront + Origin Access Control, bucket itself stays private) and seller vetting sample photos (private, admin-review only, never fronted by CloudFront) — plus the CloudFront distribution. |
| `UpSycle-EmailStack` | SES domain identity for `UpSycleMarket.com` with Easy DKIM, for OTP account-recovery email and seller-referral invites. |
| `UpSycle-AppRunnerStack` | AWS App Runner service running the Next.js app as a Docker container (built from `../Dockerfile` via `DockerImageAsset`, pushed to an auto-managed ECR repo during `cdk deploy`). Replaces the original Amplify Hosting design — see "Why App Runner, not Amplify" below. |
| `UpSycle-DnsStack` | Route 53 hosted zone for `UpSycleMarket.com` plus a `www` CNAME to the App Runner service's default domain. **Not yet deployed** — no need until the domain cutover (issue #22) is actually happening. |

Dependency order (enforced via `addDependency` in `bin/infra.ts`):
`NetworkStack → DataStack`, `DataStack/AuthStack/StorageStack → AppRunnerStack → DnsStack`.
`EmailStack` is independent.

## Why App Runner, not Amplify Hosting

The original design (see git history on the now-deleted `hosting-stack.ts`)
used AWS Amplify Hosting's "Web Compute" platform for Next.js SSR. After
extensive troubleshooting, it turned out Amplify's Web Compute runtime never
reliably delivered environment variables — or IAM role credentials — to the
actual running Next.js process, across every configuration tried:
app-level env vars, branch-level env vars, an IAM service role for SSM
access, a console-based edit + explicit redeploy, an IAM "compute role"
granted Secrets Manager access (failed with `CredentialsProviderError` — that
runtime doesn't expose IAM credentials via the standard AWS SDK chain at
all), and even a full fresh recreation of the Amplify app. Every DB-touching
route 500'd with "Environment variable not found: DATABASE_URL" the entire
time, despite build-time env vars being reliably present.

App Runner uses the same well-established credential/env-var delivery
mechanism as ECS/Fargate task roles. Confirmed working locally via
`docker run` against the real RDS instance before writing `apprunner-stack.ts`.

## How to `cdk synth` / `cdk deploy`

```bash
cd infra
npm install
npx cdk synth              # synth every stack
npx cdk synth UpSycle-DataStack   # synth a single stack
npx cdk list                # list all stack ids
npx cdk diff                # read-only: compare synthesized templates against deployed stacks (safe)
npx cdk deploy <stack-id> --require-approval never   # real deploy — see the status note above
```

`UpSycle-AppRunnerStack` requires Docker running locally (`DockerImageAsset`
builds and pushes the image as part of synth/deploy).

Optional context overrides (defaults shown), e.g. `npx cdk synth -c domainName=example.com`:

| Context key | Default |
|---|---|
| `domainName` | `UpSycleMarket.com` |

## Manual prerequisites / follow-ups

1. **CI/CD** — there's no GitHub-triggered auto-deploy yet (unlike Amplify's
   native GitHub integration). `AppRunnerStack.autoDeploymentsEnabled` is
   `false`; deploying a code change means running `cdk deploy
   UpSycle-AppRunnerStack` again, which rebuilds the Docker image and updates
   the service. A GitHub Actions workflow that runs `cdk deploy` on push to
   `main` is the natural next step (tracked alongside issue #25's CI check).
2. **Domain registrar nameserver cutover** — `DnsStack` isn't deployed yet.
   When it is, it will only create a CDK-managed Route 53 hosted zone for
   `UpSycleMarket.com`; it does not touch the actual domain registrar.
   Pointing the registrar's nameservers at the hosted zone's NS records is
   tracked separately in **issue #22** and is a deliberate manual step — it
   affects a live domain and should happen at a chosen time to avoid
   propagation-window downtime.
3. **SES production access** — new SES accounts start in the sandbox (can
   only send to verified addresses). Requesting production sending access is
   a manual step via the AWS Support Center, done once `EmailStack`'s domain
   identity is verified (which itself requires #2 above, since verification
   is via DNS records in the now-authoritative Route 53 zone).
4. **Cognito Hosted UI domain prefix** (`upsycle-auth`) must be globally
   unique within the target AWS region — if deployment fails on that
   resource, change `domainPrefix` in `auth-stack.ts` and redeploy.
5. **RDS is publicly accessible** — see `DataStack`'s doc comment. App
   Runner supports VPC Connectors (unlike Amplify), so moving RDS to a
   private subnet + VPC Connector is a viable hardening follow-up, just not
   done yet since the public+password-protected setup is already deployed,
   seeded, and confirmed working.

## Estimated monthly cost

Roughly **$25–50/mo** at MVP-scale traffic (roughly 500 MAU, 50 active
sellers, low thousands of page views/day) — higher than the original
Amplify-based ~$20-40/mo estimate in `infrastructure-plan.md`, since App
Runner has no true scale-to-zero (unlike Amplify's serverless compute
model): RDS (~$15) and App Runner at its smallest size (0.25 vCPU / 0.5 GB,
~$12-15/mo always-on) are the two dominant line items; S3, CloudFront,
Cognito, and SES are all expected to stay in their AWS free tiers at this
traffic level; Route 53 (once `DnsStack` deploys) adds ~$1.50/mo.

## What was deliberately deferred

- No Lambda + API Gateway stack yet for the "heavier/async work" tier
  (image processing on upload, Stripe webhook handling) mentioned in the infra
  plan — no such Lambda functions exist in the app yet to deploy; add a
  `ComputeStack` when that code exists.
- No Interface VPC Endpoints (e.g. for SES) — per the infra plan, only add
  one if a future Lambda genuinely needs both RDS and a public AWS API from
  inside the VPC; none of the current stacks need this.
- No custom domain association (`UpSycleMarket.com` → the App Runner
  service) — blocked on the manual registrar cutover (#22) described above.
- No GitHub Actions CI/CD for App Runner deploys yet (see prerequisite #1
  above).
