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

> ## ⚠️ DO NOT `cdk deploy` WITHOUT A HUMAN CONFIRMING AWS BILLING IMPLICATIONS FIRST
>
> This code has been synthesized (`cdk synth`) and reviewed, but **never deployed**.
> `cdk deploy` creates real, billed AWS resources (RDS, Amplify, CloudFront, Route 53,
> etc.). Do not run `cdk deploy`, `cdk bootstrap` against a production account, or
> any AWS action beyond read-only calls (`cdk synth`, `cdk diff`, `aws sts
> get-caller-identity`) without explicit sign-off from a human who understands
> the cost implications (see the cost table below and in `infrastructure-plan.md`).

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
| `UpSycle-NetworkStack` | VPC with only a `PRIVATE_ISOLATED` subnet for RDS (no NAT Gateway, no Elastic IP) plus a free S3 Gateway VPC Endpoint. A `PUBLIC` subnet exists only because CDK's VPC construct requires at least one internet-gateway-routed subnet to synth; nothing is deployed into it. |
| `UpSycle-DataStack` | RDS PostgreSQL `db.t4g.micro`, single-AZ, 20GB gp3, storage-encrypted, in NetworkStack's private subnet. Credentials are auto-generated into Secrets Manager (`upsycle/rds/postgres-admin`) — never hardcoded. |
| `UpSycle-AuthStack` | Cognito User Pool (Essentials tier) with `buyer` / `seller` / `admin` groups (a user can belong to more than one, satisfying Requirement.MD's multi-role rule) and a public (no-secret) User Pool Client for the Next.js app, configured for Authorization Code + PKCE. |
| `UpSycle-StorageStack` | Two S3 buckets — product photos (public via CloudFront + Origin Access Control, bucket itself stays private) and seller vetting sample photos (private, admin-review only, never fronted by CloudFront) — plus the CloudFront distribution. |
| `UpSycle-EmailStack` | SES domain identity for `UpSycleMarket.com` with Easy DKIM, for OTP account-recovery email and seller-referral invites. |
| `UpSycle-HostingStack` | Amplify Hosting app wired directly to GitHub (`donfouts/UpSycle`, `main` branch, monorepo root `Web/UpSycle`). Amplify's native GitHub integration is the CI/CD wiring for issue #3 — no separate GitHub Actions workflow needed. |
| `UpSycle-DnsStack` | Route 53 hosted zone for `UpSycleMarket.com` plus a `www` CNAME to the Amplify app's default domain. |

Dependency order (enforced via `addDependency` in `bin/infra.ts`):
`NetworkStack → DataStack`, `HostingStack → DnsStack`. The rest are independent
of each other.

## How to `cdk synth`

```bash
cd infra
npm install
npx cdk synth              # synth every stack
npx cdk synth UpSycle-DataStack   # synth a single stack
npx cdk list                # list all stack ids
npx cdk diff                # read-only: compare synthesized templates against deployed stacks (safe)
```

`cdk synth` (and `cdk diff`) make at most a read-only AWS API call (to look up
availability zones for the target account/region) if AWS credentials are
present in the environment — this does not create or modify any billed
resource. `cdk.context.json` (the cache of that lookup) is gitignored since
it's environment/account-specific.

Optional context overrides (defaults shown), e.g. `npx cdk synth -c domainName=example.com`:

| Context key | Default |
|---|---|
| `domainName` | `UpSycleMarket.com` |
| `githubOwner` | `donfouts` |
| `githubRepo` | `UpSycle` |
| `githubBranch` | `main` |

## Manual prerequisites (things this CDK code deliberately does NOT do)

1. **GitHub access token for Amplify** — `HostingStack` reads a GitHub
   **classic** personal access token (scopes: `repo`, `admin:repo_hook`) from a
   Secrets Manager secret named `upsycle/amplify/github-aws-classic`,
   referenced via a CloudFormation dynamic reference
   (`secretsmanager.Secret.fromSecretNameV2` + `.secretValue.unsafeUnwrap()`)
   so the token value never appears in code or in the synthesized template.
   **A human must create this secret manually** (AWS Console or
   `aws secretsmanager create-secret`) in the target account before
   `HostingStack` can be deployed. Must be a *classic* token — a fine-grained
   token fails at deploy time with "Resource not accessible by personal
   access token" since it doesn't grant `admin:repo_hook`-equivalent webhook
   access.
2. **Domain registrar nameserver cutover** — `DnsStack` only creates a
   CDK-managed Route 53 hosted zone for `UpSycleMarket.com`; it does not touch
   the actual domain registrar. Pointing the registrar's nameservers at this
   hosted zone's NS records (`HostedZoneId` / `NameServers` stack outputs) is
   tracked separately in **issue #22** and is a deliberate manual step — it
   affects a live domain and should happen at a chosen time to avoid
   propagation-window downtime.
3. **SES production access** — new SES accounts start in the sandbox (can
   only send to verified addresses). Requesting production sending access is
   a manual step via the AWS Support Center, done once `EmailStack`'s domain
   identity is verified (which itself requires #2 above, since verification
   is via DNS records in the now-authoritative Route 53 zone).
4. **Wiring RDS/Cognito/S3 config into the running app** — `DataStack`'s
   Secrets Manager secret ARN, `AuthStack`'s User Pool/Client IDs, and
   `StorageStack`'s bucket names/CloudFront domain are exposed as CDK stack
   outputs, but wiring them into the Next.js app's runtime environment
   variables (Amplify Console → App settings → Environment variables, or a
   follow-up CDK custom resource) is a manual/follow-up step, not done here.
5. **Cognito Hosted UI domain prefix** (`upsycle-auth`) must be globally
   unique within the target AWS region — if deployment fails on that
   resource, change `domainPrefix` in `auth-stack.ts` and redeploy.

## Estimated monthly cost

Matches `infrastructure-plan.md`'s **~$20–40/mo** estimate for MVP-scale
traffic (roughly 500 MAU, 50 active sellers, low thousands of page views/day):
RDS (~$15) dominates; Amplify, Lambda, S3, CloudFront, Cognito, and SES are
all expected to stay in their AWS free tiers at this traffic level; Route 53
adds ~$1.50/mo. See the full cost table and risk list (NAT Gateway, RDS
Multi-AZ, CloudFront/S3 egress at scale, Cognito MAU overage) in
`infrastructure-plan.md`.

## What was deliberately deferred

- No Lambda + API Gateway stack yet for the "heavier/async work" tier
  (image processing on upload, Stripe webhook handling) mentioned in the infra
  plan — no such Lambda functions exist in the app yet to deploy; add a
  `ComputeStack` when that code exists.
- No CloudFront distribution in front of Amplify itself — Amplify Hosting
  already includes CloudFront under the hood for its own hosting/CDN, so a
  second explicit distribution isn't needed for the app itself (only the
  product-photos S3 bucket gets its own explicit `Distribution` in
  `StorageStack`).
- No Interface VPC Endpoints (e.g. for SES) — per the infra plan, only add
  one if a future Lambda genuinely needs both RDS and a public AWS API from
  inside the VPC; none of the current stacks need this.
- No custom Amplify domain association (`UpSycleMarket.com` → the Amplify
  app) — blocked on the manual registrar cutover (#22) described above;
  `DnsStack` only wires the Amplify default `*.amplifyapp.com` domain via a
  `www` CNAME for now.
- Not verified against a real AWS account: `cdk deploy`, actual resource
  creation, actual monthly billing, actual Amplify GitHub App authorization
  flow, actual SES domain verification/DKIM DNS propagation, actual Cognito
  Hosted UI domain-prefix availability. All of this requires real AWS
  credentials/deployment, which this task was explicitly scoped to avoid.
