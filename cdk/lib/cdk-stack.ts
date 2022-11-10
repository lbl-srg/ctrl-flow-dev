import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as path from "path";

export class LblCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    ////  Start Fargate For API
    const vpc = new ec2.Vpc(this, "LblVpc", {
      maxAzs: 3,
    });

    const cluster = new ecs.Cluster(this, "LblCluster", {
      vpc: vpc,
    });

    // Create a load-balanced Fargate service and make it public
    new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      "LblApiFargateService",
      {
        cluster: cluster,
        taskImageOptions: {
          image: ecs.ContainerImage.fromAsset(
            path.resolve(__dirname, "../../server"),
          ),
          command: ["npm run start"],
          environment: {
            NODE_ENV: "production",
            MODELICA_DEPENDENCIES: "/dependencies",
            PORT: "80",
          },
        },
        memoryLimitMiB: 512,
        cpu: 256,
        desiredCount: 1,
        assignPublicIp: true,
      },
    );

    ////  End Fargate For Client
  }
}
