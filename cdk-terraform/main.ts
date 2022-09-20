import { App, S3Backend } from "cdktf";
import { State } from "./stacks/state";
import { LambdaStack } from "./stacks/lambda";
import { ApiGatewayStack } from "./stacks/api-gateway";
import { CloudFrontStack } from "./stacks/cloud-front";

// TODO Make this dynamic
const projectName = "cdk-terraform";
const stateBucketName = projectName + "-state-bucket";
const region = "us-east-1"

// App/Stack that does not have state in S3 bucket
const app = new App();

new State(app, "cdk-terraform-state", {
  bucketName: stateBucketName,
  encrypt: true
});

const lambdaStack = new LambdaStack(app, "lambda", {
  projectName: projectName,
});
new S3Backend(lambdaStack, {
  bucket: stateBucketName,
  key: "terraform.tfstate",
  encrypt: true,
  region: region,
});

const apiGatewayStack = new ApiGatewayStack(app, "api-gateway", {
  projectName: projectName,
  lambdaLogGroupArn: lambdaStack.logGroup.arn,
  lambdaInvokeArn: lambdaStack.functionInvokeArn,
  lambdaFunctionName: lambdaStack.functionName,
});
new S3Backend(apiGatewayStack, {
  bucket: stateBucketName,
  key: "apigateway.tfstate",
  encrypt: true,
  region: region,
});

const cloudFrontStack = new CloudFrontStack(app, "cloud-front", {
  projectName: projectName,
  apiGatewayId: apiGatewayStack.gatewayId,
  apiGatewayStageName: apiGatewayStack.stageName,
  region: region,
});
new S3Backend(cloudFrontStack, {
  bucket: stateBucketName,
  key: "cloudFront.tfstate",
  encrypt: true,
  region: region,
});

app.synth();