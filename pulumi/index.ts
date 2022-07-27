import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as AdmZip from 'adm-zip';

const config = new pulumi.Config();
const projectName = config.require("project_name");
const uniqueId = config.require("unique_identifier");
const prefix = `${projectName}-${uniqueId}`
const lambdaName = `${prefix}-lambda`

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

// Create zip file for Lambda
const lambdaZip = new AdmZip();
lambdaZip.addLocalFolder("../lambda");
lambdaZip.writeZip("lambda.zip");

const lambdaFunction = new aws.lambda.Function(`${lambdaName}`, {
  code: new pulumi.asset.FileArchive("lambda.zip"),
  name: lambdaName,
  role: lambdaRole.arn,
  handler: "index.handler",
  runtime: "nodejs16.x",
}, {
  dependsOn: [
    lambdaRoleAttachment,
    cloudWatch,
  ],
});

const apiGateway = new aws.apigatewayv2.Api("${prefix}-api-gateway", {
  protocolType: "HTTP",
});