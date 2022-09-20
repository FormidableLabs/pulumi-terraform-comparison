import { App, S3Backend } from "cdktf";
import { State } from "./stacks/state";
import { LambdaStack } from "./stacks/lambda";
import { ApiGatewayStack } from "./stacks/api-gateway";

// TODO Make this dynamic
const projectName = "cdk-terraform";
const stateBucketName = projectName + "-state-bucket";

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
  region: "us-east-1",
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
  region: "us-east-1",
});

app.synth();