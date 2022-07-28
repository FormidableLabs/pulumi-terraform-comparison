import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

import * as apiGatewayImport from "./api-gateway";
import * as cloudFrontImport from "./cloudfront";
import * as lambdaCode from "./lambdaCode";
import * as lambdaPermissions from "./lambdaPermissions";
import * as lambdaImport from "./lambda";

const config = new pulumi.Config();
const projectName = config.require("project_name");
const uniqueId = config.require("unique_identifier");
const prefix = `${projectName}-${uniqueId}`;
const lambdaName = `${prefix}-lambda`;

const { lambdaRole } = lambdaPermissions.createLambdaPermissions(prefix);

const cloudWatch = new aws.cloudwatch.LogGroup(`/aws/lambda/${lambdaName}`, {
  name: `/aws/lambda/${lambdaName}`,
  retentionInDays: config.getNumber("logRetention") || 14
});

const {codeBucket, lambdaCodeObject, lambdaZipHash} = lambdaCode.createLambdaCode(prefix);
const lambdaFunction = lambdaImport.createLambda(
  lambdaName,
  lambdaRole,
  codeBucket,
  lambdaCodeObject,
  lambdaZipHash,
  cloudWatch);

const { apiGateway, gatewayStage } = apiGatewayImport.createApiGateway(prefix, lambdaFunction, cloudWatch);
const cloudFront = cloudFrontImport.createCloudWatch(prefix, apiGateway, gatewayStage);

export const gatewayEndpointUrl = pulumi.interpolate`${gatewayStage.invokeUrl}/hello`;
export const cloudFrontUrl = pulumi.interpolate`https://${cloudFront.domainName}/hello`