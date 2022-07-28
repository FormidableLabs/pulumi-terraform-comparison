import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export function createApiGateway(prefix: string, lambdaFunction: aws.lambda.Function, cloudWatch:aws.cloudwatch.LogGroup) {
  const apiGateway = new aws.apigatewayv2.Api(`${prefix}-api-gateway`, {
    protocolType: "HTTP",
  });

  new aws.lambda.Permission(`${prefix}-lambda-permission`, {
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

  return {apiGateway, gatewayStage};
}