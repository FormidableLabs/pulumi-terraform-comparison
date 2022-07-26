import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as AdmZip from 'adm-zip';

const config = new pulumi.Config();
const projectName = config.require("project_name");
const uniqueId = config.require("unique_identifier");
const prefix = `${projectName}-${uniqueId}`

const lambdaRole = new aws.iam.Role(`lambdaRole`, {
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

// Create zip file for Lambda
const lambdaZip = new AdmZip();
lambdaZip.addLocalFolder("../lambda");
lambdaZip.writeZip("lambda.zip");

const lambdaFunction = new aws.lambda.Function(`${prefix}-lambda`, {
  code: new pulumi.asset.FileArchive("lambda.zip"),
  role: lambdaRole.arn,
  handler: "index.handler",
  runtime: "nodejs16.x",
});