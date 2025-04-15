import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as path from "path";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";
import { CpuArchitecture, OperatingSystemFamily } from "aws-cdk-lib/aws-ecs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { RemovalPolicy } from "aws-cdk-lib";

export class LblCdkStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    stage: string,
    props?: cdk.StackProps,
  ) {
    super(scope, id, props);

    ////  Begin S3 Bucket for Client
    const bucket = new Bucket(this, `lbl-client-${stage}`, {
      bucketName: `lbl-client-${stage}`,
      publicReadAccess: true,
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "index.html",
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    ////  End S3 Bucket for Client

    ////  Start Fargate For API
    const vpc = new ec2.Vpc(this, `LblVpc-${stage}`, {
      maxAzs: 3,
    });

    const cluster = new ecs.Cluster(this, `LblCluster-${stage}`, {
      vpc: vpc,
    });

    // Create a load-balanced Fargate service and make it public
    const fargateService =
      new ecs_patterns.ApplicationLoadBalancedFargateService(
        this,
        `LblApiFargateService-${stage}`,
        {
          cluster: cluster,
          taskImageOptions: {
            image: ecs.ContainerImage.fromAsset(
              path.resolve(__dirname, "../../server"),
              {
                platform: Platform.LINUX_AMD64,
              },
            ),
            environment: {
              NODE_ENV: "production",
              MODELICA_DEPENDENCIES: "/dependencies",
              FE_ORIGIN_URL: `http://${bucket.bucketWebsiteDomainName},http://${bucket.bucketRegionalDomainName}`,
              PORT: "80",
            },
          },
          memoryLimitMiB: 1024,
          cpu: 512,
          desiredCount: 1,
          assignPublicIp: true,
          runtimePlatform: {
            operatingSystemFamily: OperatingSystemFamily.LINUX,
            cpuArchitecture: CpuArchitecture.X86_64,
          },
        },
      );

    new cdk.CfnOutput(this, `LbLALBArn`, {
      value: `${fargateService.loadBalancer.loadBalancerArn}`,
      description: "The id of lbl ALB",
      exportName: `LbLALBName-${stage}`,
    });
    new cdk.CfnOutput(this, `LbLApiUrl`, {
      value: `http://${fargateService.loadBalancer.loadBalancerDnsName}`,
      description: "The url of the lbl fargate service",
      exportName: `LbLApiUrl-${stage}`,
    });

    ////  End Fargate For API
  }
}
