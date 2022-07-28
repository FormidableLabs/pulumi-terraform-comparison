import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as AdmZip from 'adm-zip';
import * as md5File from 'md5-file';
import * as apiGatewayImport from "./api-gateway";
import * as cloudFrontImport from "./cloudfront";

const config = new pulumi.Config();
const projectName = config.require("project_name");
const uniqueId = config.require("unique_identifier");
const prefix = `${projectName}-${uniqueId}`;
const lambdaName = `${prefix}-lambda`;
const lambdaZipName = "lambda.zip";

const lambdaLoggingPolicy = new aws.iam.Policy(`${prefix}-lambda-logging`, {
  path: "/",
  description: "Policy to allow the IAM role for Lambda to write to CloudWatch Logs",
  policy: `{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Action": [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        "Resource": "arn:aws:logs:*:*:*",
        "Effect": "Allow",
        "Sid": ""
      }
    ]
  }`,
});

const lambdaRole = new aws.iam.Role(`${prefix}-lambda`, {
  name: `${prefix}-lambda`,
  assumeRolePolicy: `{
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
  }`
});

const lambdaRoleAttachment = new aws.iam.RolePolicyAttachment(`${prefix}-logs`, {
  role: lambdaRole.name,
  policyArn: lambdaLoggingPolicy.arn,
});

const cloudWatch = new aws.cloudwatch.LogGroup(`/aws/lambda/${lambdaName}`, {
  name: `/aws/lambda/${lambdaName}`,
  retentionInDays: config.getNumber("logRetention") || 14
});

const codeBucket = new aws.s3.BucketV2(`${prefix}-code-bucket`, {});
new aws.s3.BucketAclV2(`${prefix}-code-bucket-acl`, {
  bucket: codeBucket.id,
  acl: "private",
});

// Create zip file for Lambda
const lambdaZip = new AdmZip();
lambdaZip.addLocalFolder("../lambda");
lambdaZip.writeZip(lambdaZipName);

const crypto = require('crypto');
const fs = require('fs');
const fileBuffer = fs.readFileSync(lambdaZipName);
const lambdaZipHash = crypto.createHash('sha256').update(fileBuffer).digest('base64');

const lambdaCodeObject = new aws.s3.BucketObject("lambda-code", {
  key: lambdaZipName,
  bucket: codeBucket.id,
  source: new pulumi.asset.FileAsset(lambdaZipName),
  etag: md5File.sync(lambdaZipName),
});

const lambdaFunction = new aws.lambda.Function(`${lambdaName}`, {
  name: lambdaName,
  role: lambdaRole.arn,
  handler: "index.handler",
  runtime: "nodejs16.x",

  s3Bucket: codeBucket.id,
  s3Key: lambdaCodeObject.key,
  sourceCodeHash: lambdaZipHash,
}, {
  dependsOn: [
    lambdaRoleAttachment,
    cloudWatch,
  ],
});

const { apiGateway, gatewayStage } = apiGatewayImport.createApiGateway(prefix, lambdaFunction, cloudWatch);
const cloudFront = cloudFrontImport.createCloudWatch(prefix, apiGateway, gatewayStage);

export const gatewayEndpointUrl = pulumi.interpolate`${gatewayStage.invokeUrl}/hello`;
export const cloudFrontUrl = pulumi.interpolate`https://${cloudFront.domainName}/hello`