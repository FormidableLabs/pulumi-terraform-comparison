import { AssetType, TerraformAsset, TerraformStack } from "cdktf";
import { Construct } from "constructs";
import { AwsProvider, s3, cloudwatch, iam, lambdafunction } from "@cdktf/provider-aws";
import * as s3Lib from "../lib/s3Bucket";
import path = require("path");

export interface LambdaProps {
  readonly projectName: string,
}

const lambdaAssumePolicy = {
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}

const lambdaCloudWatchPolicy = {
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*",
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}

const lambdaExecutionPolicyArn = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'

export class LambdaStack extends TerraformStack {

  public logGroup: cloudwatch.CloudwatchLogGroup;
  public functionInvokeArn: string;
  public functionName: string;

  constructor(scope: Construct, name: string, props: LambdaProps) {
    super(scope, name);
    new AwsProvider(this, 'aws', {});

    const lambdaName = `${props.projectName}-lambda`

    const codeBucket = s3Lib.createBucket(
      this,
      props.projectName + "-code",
      true,
      true
    );

    const lambdaZip = new TerraformAsset(this, "lambdaZip", {
      path: path.resolve("../lambda"),
      type: AssetType.ARCHIVE
    });

    const lambdaZipUpload = new s3.S3Object(this, "lambdaZipUpload", {
      bucket: codeBucket.bucket,
      key: "lambda.zip",
      source: lambdaZip.path,
      sourceHash: lambdaZip.assetHash
    });

    this.logGroup = new cloudwatch.CloudwatchLogGroup(this, "lambdaCloudWatchGroup", {
      name: `/aws/lambda/${lambdaName}`,
      retentionInDays: 7
    });

    const lambdaRole = new iam.IamRole(this, "lambdaRole", {
      name: `${props.projectName}-lambda`,
      assumeRolePolicy: JSON.stringify(lambdaAssumePolicy)
    });

    const lambdaLoggingPolicy = new iam.IamPolicy(this, "lambdaLoggingPolicy", {
      name: `${props.projectName}-lambda-logging`,
      path: "/",
      description: "Policy to allow the IAM role for Lambda to write to CloudWatch Logs",
      policy: JSON.stringify(lambdaCloudWatchPolicy)
    });

    const loggingPolicyAttachment = new iam.IamRolePolicyAttachment(this, "loggingPolicyAttachment", {
      policyArn: lambdaLoggingPolicy.arn,
      role: lambdaRole.name
    });

    new iam.IamRolePolicyAttachment(this, "executionPolicyAttachment", {
      policyArn: lambdaExecutionPolicyArn,
      role: lambdaRole.name
    });

    const lambdaFunction = new lambdafunction.LambdaFunction(this, "lambdaFunction", {
      functionName: lambdaName,
      role: lambdaRole.arn,
      s3Bucket: codeBucket.bucket,
      s3Key: lambdaZipUpload.key,
      s3ObjectVersion: lambdaZipUpload.versionId,
      // TODO Make it dynamic
      handler: "index.handler",
      // TODO Make this dynamic as well
      runtime: "nodejs16.x",
      dependsOn: [
        this.logGroup,
        loggingPolicyAttachment,
      ],
    });

    this.functionInvokeArn = lambdaFunction.invokeArn;
    this.functionName = lambdaFunction.functionName;
  }
}