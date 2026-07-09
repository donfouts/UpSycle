import * as cdk from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";

export interface DnsStackProps extends cdk.StackProps {
  domainName: string;
  targetDomain: string;
}

/**
 * DnsStack
 *
 * Creates the Route 53 hosted zone for UpSycleMarket.com and a CNAME record
 * pointing `www` at the app's default domain (App Runner's service URL —
 * previously Amplify Hosting's default domain, before the move to App
 * Runner, see apprunner-stack.ts).
 *
 * IMPORTANT — this only creates a CDK-managed hosted zone; it does NOT
 * transfer the domain or update the registrar's nameservers. That cutover
 * (pointing UpSycleMarket.com's real registrar at this hosted zone's NS
 * records) is tracked separately in issue #22 and is a deliberate manual
 * step, since it affects a live domain and should not happen without a human
 * confirming timing (DNS propagation, avoiding downtime).
 *
 * Cost per infra plan: ~$1.50/mo (hosted zone + query volume).
 */
export class DnsStack extends cdk.Stack {
  public readonly hostedZone: route53.HostedZone;

  constructor(scope: Construct, id: string, props: DnsStackProps) {
    super(scope, id, props);

    this.hostedZone = new route53.HostedZone(this, "UpSycleHostedZone", {
      zoneName: props.domainName,
      comment: "UpSycle marketplace — managed by CDK. See issue #22 for registrar nameserver cutover.",
    });

    // The apex record is left for a human to wire once a custom domain
    // association is added (which requires the hosted zone to already be
    // authoritative for the domain — chicken/egg with the issue #22
    // cutover).
    new route53.CnameRecord(this, "WwwRecord", {
      zone: this.hostedZone,
      recordName: "www",
      domainName: props.targetDomain,
      ttl: cdk.Duration.minutes(5),
    });

    new cdk.CfnOutput(this, "HostedZoneId", { value: this.hostedZone.hostedZoneId });
    new cdk.CfnOutput(this, "NameServers", {
      value: cdk.Fn.join(", ", this.hostedZone.hostedZoneNameServers ?? []),
    });
  }
}
