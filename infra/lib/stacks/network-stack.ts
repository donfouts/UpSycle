import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

/**
 * NetworkStack
 *
 * Per infrastructure-plan.md's "NAT Gateway trap" section: the only thing that
 * ever needs to live in a private VPC subnet for this app is RDS (it never
 * needs outbound internet access). Everything else (Amplify, Lambdas that only
 * call Cognito/SES/Stripe, etc.) stays outside the VPC entirely, where it gets
 * internet access by default at no extra cost.
 *
 * This VPC therefore has:
 *  - NO NAT Gateway (the single biggest avoidable cost at MVP scale, ~$33+/mo)
 *  - NO Elastic IP
 *  - A PRIVATE_ISOLATED subnet (currently unused — kept for any future
 *    resource, e.g. a Lambda, that should never be internet-reachable)
 *  - A PUBLIC subnet, now actually used by DataStack's RDS instance: Amplify
 *    Hosting's Next.js SSR compute has no VPC-attachment option at all, so
 *    RDS had to move here (publiclyAccessible, password-protected only) for
 *    the deployed app to be able to reach it. See DataStack's doc comment
 *    for the full rationale/tradeoff.
 *  - An S3 Gateway VPC Endpoint (free) so anything in the VPC that needs S3
 *    access (e.g., a future Lambda doing image processing against RDS) can
 *    reach it without a NAT Gateway or internet path.
 */
export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, "UpSycleVpc", {
      vpcName: "upsycle-vpc",
      // Two AZs for RDS subnet group validity (RDS requires a subnet group
      // spanning >= 2 AZs even for a single-AZ instance deployment).
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: "public",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: "rds-private-isolated",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // Free Gateway endpoint — lets anything inside the VPC reach S3 without a
    // NAT Gateway or internet route. Attached to all subnets (cheap, no
    // per-hour cost, only pay-as-you-go data already priced into S3).
    this.vpc.addGatewayEndpoint("S3GatewayEndpoint", {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [
        { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
        { subnetType: ec2.SubnetType.PUBLIC },
      ],
    });

    new cdk.CfnOutput(this, "VpcId", { value: this.vpc.vpcId });
  }
}
