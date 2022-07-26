import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as AdmZip from 'adm-zip';

const config = new pulumi.Config();
const projectName = config.require("project_name");
const uniqueId = config.require("unique_identifier");
const prefix = `${projectName}-${uniqueId}`

const cloudWatch = new aws.cloudwatch.LogGroup(`${prefix}-logs`, {
  retentionInDays: config.getNumber("logRetention") || 14
});

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

// Create zip file for Lambda
const lambdaZip = new AdmZip();
lambdaZip.addLocalFolder("../lambda");
lambdaZip.writeZip("lambda.zip");

const lambdaFunction = new aws.lambda.Function(`${prefix}-lambda`, {
  code: new pulumi.asset.FileArchive("lambda.zip"),
  role: lambdaRole.arn,
  handler: "index.handler",
  runtime: "nodejs16.x",
}, {
  dependsOn: [
    lambdaRoleAttachment,
    cloudWatch,
  ],
});