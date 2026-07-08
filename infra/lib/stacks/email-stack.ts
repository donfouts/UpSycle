import * as cdk from "aws-cdk-lib";
import * as ses from "aws-cdk-lib/aws-ses";
import { Construct } from "constructs";

export interface EmailStackProps extends cdk.StackProps {
  domainName: string;
}

/**
 * EmailStack
 *
 * SES domain identity for UpSycleMarket.com, used for transactional email:
 * OTP account-recovery codes (Cognito, see AuthStack) and seller-referral
 * invites (SellerReferral model, prisma/schema.prisma). Per infra plan: 3,000
 * free emails/mo for the first 12 months, then $0.10/1,000.
 *
 * DKIM (Easy DKIM) is enabled so outgoing mail is signed/authenticated.
 * IMPORTANT manual step: this stack only creates the SES identity + its DNS
 * verification/DKIM CNAME records as CloudFormation outputs — until
 * UpSycleMarket.com's authoritative DNS is Route 53 (see DnsStack + issue #22
 * domain transfer) and those verification records are actually published,
 * the identity will sit unverified and SES will refuse to send from it.
 * Also note: new SES accounts start in the sandbox (can only send to
 * verified addresses) until production access is manually requested via the
 * AWS Support Center — that request is a manual step outside this CDK code.
 *
 * A custom MAIL FROM domain (e.g. mail.UpSycleMarket.com) was deliberately
 * left unset: setting it in the same EmailIdentity construction as
 * `dkimSigning` hits a documented SESv2/CloudFormation race
 * (PutEmailIdentityMailFromAttributes firing before the identity's creation
 * has propagated, failing with "Identity does not exist" ~2 minutes in).
 * Without it, SES falls back to sending via amazonses.com's shared MAIL FROM,
 * which works fine for DKIM-signed mail. Add it back as a follow-up once the
 * domain is actually on Route 53 and this can be verified against real DNS.
 */
export class EmailStack extends cdk.Stack {
  public readonly identity: ses.EmailIdentity;

  constructor(scope: Construct, id: string, props: EmailStackProps) {
    super(scope, id, props);

    this.identity = new ses.EmailIdentity(this, "UpSycleDomainIdentity", {
      identity: ses.Identity.domain(props.domainName),
      dkimSigning: true,
    });

    new cdk.CfnOutput(this, "SesIdentityName", { value: this.identity.emailIdentityName });
  }
}
