import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export interface CicdStackProps extends cdk.StackProps {
  githubOwner: string;
  githubRepo: string;
}

/**
 * CicdStack
 *
 * Lets GitHub Actions deploy UpSycle-AppRunnerStack on push to `main`,
 * without storing any long-lived AWS credentials as GitHub secrets. Uses
 * OIDC federation: GitHub's workflow-issued token is exchanged for
 * temporary credentials by assuming DeployRole below, scoped by the trust
 * policy's `sub` condition to only this repo's `main` branch (not PRs, not
 * forks, not other branches).
 *
 * DeployRole doesn't need broad permissions of its own — `cdk deploy` needs
 * to assume the CDK bootstrap roles (`cdk-hnb659fds-*`) that already exist
 * in this account from `cdk bootstrap`, the same way the CDK CLI does when
 * run locally. DeployRole is only granted `sts:AssumeRole` on those four.
 */
export class CicdStack extends cdk.Stack {
  public readonly deployRole: iam.Role;

  constructor(scope: Construct, id: string, props: CicdStackProps) {
    super(scope, id, props);

    const githubProvider = new iam.OpenIdConnectProvider(this, "GitHubOidcProvider", {
      url: "https://token.actions.githubusercontent.com",
      clientIds: ["sts.amazonaws.com"],
    });

    this.deployRole = new iam.Role(this, "GitHubActionsDeployRole", {
      roleName: "UpSycle-GitHubActionsDeployRole",
      assumedBy: new iam.OpenIdConnectPrincipal(githubProvider, {
        StringEquals: {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        },
        StringLike: {
          // Only workflow runs triggered by a push to main on this exact
          // repo can assume this role — not PRs (which use a different sub
          // format, `pull_request`), not forks, not other branches.
          "token.actions.githubusercontent.com:sub": `repo:${props.githubOwner}/${props.githubRepo}:ref:refs/heads/main`,
        },
      }),
      maxSessionDuration: cdk.Duration.hours(1),
    });

    this.deployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["sts:AssumeRole"],
        resources: [
          `arn:aws:iam::${this.account}:role/cdk-hnb659fds-deploy-role-${this.account}-${this.region}`,
          `arn:aws:iam::${this.account}:role/cdk-hnb659fds-file-publishing-role-${this.account}-${this.region}`,
          `arn:aws:iam::${this.account}:role/cdk-hnb659fds-image-publishing-role-${this.account}-${this.region}`,
          `arn:aws:iam::${this.account}:role/cdk-hnb659fds-lookup-role-${this.account}-${this.region}`,
        ],
      })
    );

    new cdk.CfnOutput(this, "DeployRoleArn", { value: this.deployRole.roleArn });
  }
}
