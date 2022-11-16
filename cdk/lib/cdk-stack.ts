import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as path from "path";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";
import { CpuArchitecture, OperatingSystemFamily } from "aws-cdk-lib/aws-ecs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { RemovalPolicy } from "aws-cdk-lib";

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
    const fargateService =
      new ecs_patterns.ApplicationLoadBalancedFargateService(
        this,
        "LblApiFargateService",
        {
          cluster: cluster,
          taskImageOptions: {
            image: ecs.ContainerImage.fromAsset(
              path.resolve(__dirname, "../../server"),
              {
                platform: Platform.LINUX_ARM64,
              },
            ),
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
          runtimePlatform: {
            operatingSystemFamily: OperatingSystemFamily.LINUX,
            cpuArchitecture: CpuArchitecture.ARM64,
          },
        },
      );

    ////  End Fargate For API

    ////  Begin S3 Bucket for Client
    const clientBucket = new Bucket(this, "lbl-client", {
      bucketName: "lbl-client",
      publicReadAccess: true,
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "index.html",
      removalPolicy: RemovalPolicy.DESTROY,
    });

    new s3deploy.BucketDeployment(
      this,
      "DeployWithInvalidation",
      {
        sources: [s3deploy.Source.asset("../client/build")],
        destinationBucket: clientBucket,
      },
    );

    ////  End S3 Bucket for Client
  }
}
