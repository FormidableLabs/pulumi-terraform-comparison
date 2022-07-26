import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

const config = new pulumi.Config();
const projectName = config.require("project_name");
const uniqueId = config.require("unique_identifier");
const prefix = `${projectName}-${uniqueId}`

// Create an AWS resource (S3 Bucket)
const bucket = new aws.s3.Bucket("pulumi-created-bucket");

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

/*
const testLambda = new aws.lambda.Function("testLambda", {
    code: new pulumi.asset.FileArchive("lambda_function_payload.zip"),
    role: lambdaRole.arn,
    handler: "index.test",
    runtime: "nodejs12.x",
    environment: {
        variables: {
            foo: "bar",
        },
    },
});
*/

// Export the name of the bucket
export const bucketName = bucket.id;
