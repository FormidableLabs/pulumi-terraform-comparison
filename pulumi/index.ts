import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as AdmZip from 'adm-zip';
import * as md5File from 'md5-file';
import { BucketObject } from "@pulumi/aws/s3";

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

const apiGateway = new aws.apigatewayv2.Api(`${prefix}-api-gateway`, {
  protocolType: "HTTP",
});

const lambdaPermission = new aws.lambda.Permission(`${prefix}-lambda-permission`, {
  statementId: "AllowExecutionFromAPIGateway",
  action: "lambda:InvokeFunction",
  principal: "apigateway.amazonaws.com",
  function: lambdaFunction,
  sourceArn: pulumi.interpolate`${apiGateway.executionArn}/*/*`,
}, {dependsOn: [apiGateway, lambdaFunction]});

const apiIntegration = new aws.apigatewayv2.Integration(`${prefix}-api-integration`, {
  apiId: apiGateway.id,
  integrationUri: lambdaFunction.invokeArn,
  integrationType: "AWS_PROXY",
  integrationMethod: "POST",
});

const apiRoute = new aws.apigatewayv2.Route(`${prefix}-api-route`, {
  apiId: apiGateway.id,
  routeKey: "GET /hello",
  target: pulumi.interpolate`integrations/${apiIntegration.id}`,
});

const gatewayStage = new aws.apigatewayv2.Stage(`${prefix}-api-stage`, {
  apiId: apiGateway.id,
  name: `${prefix}-api-stage`,
  autoDeploy: true,
  accessLogSettings: {
    destinationArn: cloudWatch.arn,
    format: JSON.stringify({
      requestId               : "$context.requestId",
      sourceIp                : "$context.identity.sourceIp",
      requestTime             : "$context.requestTime",
      protocol                : "$context.protocol",
      httpMethod              : "$context.httpMethod",
      resourcePath            : "$context.resourcePath",
      routeKey                : "$context.routeKey",
      status                  : "$context.status",
      responseLength          : "$context.responseLength",
      integrationErrorMessage : "$context.integrationErrorMessage",
    })
  }
}, {dependsOn: [apiRoute]});

const cloudFront = new aws.cloudfront.Distribution(`${prefix}-cloudfront`, {
  enabled: true,
  priceClass: "PriceClass_All",

  origins: [{
    domainName: pulumi.interpolate`${apiGateway.id}.execute-api.${aws.getRegionOutput().name}.amazonaws.com`,
    originPath: pulumi.interpolate`/${gatewayStage.name}`,
    originId: "api",
    customOriginConfig: {
      httpPort: 80,
      httpsPort: 443,
      originProtocolPolicy: "https-only",
      originSslProtocols: ["TLSv1", "TLSv1.1"],
    },
  }],

  defaultCacheBehavior: {
    allowedMethods: [
      "DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT",
    ],
    cachedMethods: [
      "GET", "HEAD",
    ],
    compress: true,
    targetOriginId: "api",
    viewerProtocolPolicy: "https-only",
    forwardedValues: {
      queryString: true,
      headers: ["Accept", "Referer", "Authorization", "Content-Type"],
      cookies: {
        forward: "all",
      },
    },
  },
  viewerCertificate: {
    cloudfrontDefaultCertificate: true,
  },

  restrictions: {
    geoRestriction: {
      restrictionType: "none",
    }
  },

});

export const gatewayEndpointUrl = pulumi.interpolate`${gatewayStage.invokeUrl}/hello`;
export const cloudFrontUrl = pulumi.interpolate`https://${cloudFront.domainName}/hello`