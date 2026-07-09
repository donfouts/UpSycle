#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { NetworkStack } from "../lib/stacks/network-stack";
import { DataStack } from "../lib/stacks/data-stack";
import { AuthStack } from "../lib/stacks/auth-stack";
import { StorageStack } from "../lib/stacks/storage-stack";
import { EmailStack } from "../lib/stacks/email-stack";
import { AppRunnerStack } from "../lib/stacks/apprunner-stack";
import { DnsStack } from "../lib/stacks/dns-stack";

const app = new cdk.App();

// Every resource in every stack in this app MUST carry this tag so AWS Cost
// Explorer can filter/invoice on it. Applying it at the App level (rather than
// per-stack) guarantees it propagates to every stack and every child construct,
// including ones added later.
cdk.Tags.of(app).add("project", "UpSycle");

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
};

const domainName = app.node.tryGetContext("domainName") ?? "UpSycleMarket.com";

const networkStack = new NetworkStack(app, "UpSycle-NetworkStack", {
  env,
  description: "UpSycle: VPC (RDS-only private subnet, no NAT Gateway) + S3 Gateway VPC Endpoint",
});

const dataStack = new DataStack(app, "UpSycle-DataStack", {
  env,
  description: "UpSycle: RDS PostgreSQL (db.t4g.micro, single-AZ) in NetworkStack's private subnet",
  vpc: networkStack.vpc,
});
dataStack.addDependency(networkStack);

const authStack = new AuthStack(app, "UpSycle-AuthStack", {
  env,
  description: "UpSycle: Cognito User Pool (buyer/seller/admin roles) + App Client",
});

const storageStack = new StorageStack(app, "UpSycle-StorageStack", {
  env,
  description: "UpSycle: S3 buckets (product photos, seller vetting photos) + CloudFront",
});

const emailStack = new EmailStack(app, "UpSycle-EmailStack", {
  env,
  description: "UpSycle: SES identity for transactional email (OTP recovery, referral invites)",
  domainName,
});

const appRunnerStack = new AppRunnerStack(app, "UpSycle-AppRunnerStack", {
  env,
  description: "UpSycle: App Runner service running the Next.js app as a Docker container (replaces Amplify Hosting)",
  dbSecret: dataStack.dbSecret,
  userPoolId: authStack.userPool.userPoolId,
  userPoolClientId: authStack.userPoolClient.userPoolClientId,
  userPoolArn: authStack.userPool.userPoolArn,
  productPhotosBucket: storageStack.productPhotosBucket,
  sellerVettingPhotosBucket: storageStack.sellerVettingPhotosBucket,
});
appRunnerStack.addDependency(dataStack);
appRunnerStack.addDependency(authStack);
appRunnerStack.addDependency(storageStack);

const dnsStack = new DnsStack(app, "UpSycle-DnsStack", {
  env,
  description: "UpSycle: Route 53 hosted zone for UpSycleMarket.com + record to the App Runner service",
  domainName,
  targetDomain: appRunnerStack.serviceUrl,
});
dnsStack.addDependency(appRunnerStack);
