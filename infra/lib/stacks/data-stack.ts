import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";

export interface DataStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
}

/**
 * DataStack
 *
 * RDS PostgreSQL db.t4g.micro, single-AZ, 20GB gp3.
 *
 * IMPORTANT — publicly accessible by design, not an oversight: this was
 * originally required because AWS Amplify Hosting (the compute layer before
 * the move to App Runner, see apprunner-stack.ts) had no VPC attachment
 * option at all. App Runner *does* support VPC connectivity via a VPC
 * Connector, so a fully private RDS instance is possible now — left public
 * for the moment since it's already deployed, seeded, and confirmed
 * working; revisit and tighten to a VPC Connector + private subnet as a
 * follow-up hardening pass. Access is protected solely by the strong
 * auto-generated Secrets Manager password in the meantime.
 *
 * Credentials are generated and stored in Secrets Manager by
 * `rds.DatabaseInstance` automatically (via `credentials: rds.Credentials.fromGeneratedSecret(...)`)
 * — never hardcoded here. AppRunnerStack wires individual fields from this
 * secret (host/port/username/password/dbname) directly into the container's
 * environment via App Runner's native `runtimeEnvironmentSecrets`, and
 * lib/prisma.ts composes the full `DATABASE_URL` connection string from
 * them at startup.
 *
 * Matches infrastructure-plan.md: ~$15/mo (compute + storage/backup).
 */
export class DataStack extends cdk.Stack {
  public readonly dbInstance: rds.DatabaseInstance;
  public readonly dbSecret: cdk.aws_secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    const dbSecurityGroup = new ec2.SecurityGroup(this, "DbSecurityGroup", {
      vpc: props.vpc,
      description: "UpSycle RDS Postgres - publicly reachable, password-protected only (see DataStack doc comment)",
      allowAllOutbound: false,
    });
    dbSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(5432),
      "Postgres from anywhere - Amplify SSR compute has no VPC attachment/static IP to scope this to; auth is via the strong generated password only"
    );

    this.dbInstance = new rds.DatabaseInstance(this, "UpSycleDatabase", {
      instanceIdentifier: "upsycle-db",
      engine: rds.DatabaseInstanceEngine.postgres({
        // 16.4 was deprecated/removed from RDS in this region by the time of
        // deploy; 16.13 is the newest 16.x minor this CDK version's enum
        // supports and is currently available (checked via
        // `aws rds describe-db-engine-versions --engine postgres`).
        version: rds.PostgresEngineVersion.VER_16_13,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
      vpc: props.vpc,
      // PUBLIC (not PRIVATE_ISOLATED) so publiclyAccessible below actually
      // gets a route to the internet gateway.
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroups: [dbSecurityGroup],
      credentials: rds.Credentials.fromGeneratedSecret("upsycle_admin", {
        secretName: "upsycle/rds/postgres-admin",
      }),
      databaseName: "upsycle",
      allocatedStorage: 20,
      storageType: rds.StorageType.GP3,
      multiAz: false, // single-AZ per infra plan; revisit once uptime SLA matters commercially
      publiclyAccessible: true,
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: true,
      deletionProtection: false, // MVP — flip to true once real customer data lives here
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
      storageEncrypted: true,
    });
    this.dbSecret = this.dbInstance.secret!;

    new cdk.CfnOutput(this, "DbEndpoint", { value: this.dbInstance.dbInstanceEndpointAddress });
    new cdk.CfnOutput(this, "DbSecretArn", { value: this.dbSecret.secretArn });
  }
}
