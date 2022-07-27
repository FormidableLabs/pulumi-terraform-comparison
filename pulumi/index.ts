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
  target: pulumi.interpolate`integrations/${apiIntegration.id}"`,
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


export const endpointUrl = pulumi.interpolate`${gatewayStage.invokeUrl}`;