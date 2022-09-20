import { TerraformStack } from "cdktf";
import { AwsProvider, apigatewayv2, lambdafunction } from "@cdktf/provider-aws";
import { Construct } from "constructs";

export interface ApiGatewayProps {
  readonly projectName: string,
  readonly lambdaLogGroupArn: string,
  readonly lambdaInvokeArn: string,
  readonly lambdaFunctionName: string,
}

export class ApiGatewayStack extends TerraformStack {

  constructor(scope: Construct, name: string, props: ApiGatewayProps) {
    super(scope, name);
    new AwsProvider(this, 'aws', {});
    console.log(props);

    const api = new apigatewayv2.Apigatewayv2Api (this, "apiGateway", {
      name: `${props.projectName}-api-gateway`,
      protocolType: "HTTP"
    });

    new apigatewayv2.Apigatewayv2Stage (this, "apiGatewayStage", {
      apiId: api.id,
      name: `${props.projectName}-gateway-stage`,
      autoDeploy: true,
      accessLogSettings: {
        destinationArn: props.lambdaLogGroupArn,
        format: JSON.stringify({
          requestId: "$context.requestId",
          sourceIp: "$context.identity.sourceIp",
          requestTime: "$context.requestTime",
          protocol: "$context.protocol",
          httpMethod: "$context.httpMethod",
          resourcePath: "$context.resourcePath",
          routeKey: "$context.routeKey",
          status: "$context.status",
          responseLength: "$context.responseLength",
          integrationErrorMessage: "$context.integrationErrorMessage",
        }),
      },
    });

    const gatewayIntegration = new apigatewayv2.Apigatewayv2Integration (this, "gatewayIntegration", {
      apiId: api.id,
      integrationUri: props.lambdaInvokeArn,
      integrationType: "AWS_PROXY",
      integrationMethod: "POST",
    });

    new apigatewayv2.Apigatewayv2Route (this, "gatewayRoute", {
      apiId: api.id,
      // TODO Make dynamic
      routeKey: "GET /hello",
      target: `integrations/${gatewayIntegration.id}`,
    });

    new lambdafunction.LambdaPermission (this, "lambdaApiGatewayPermission", {
      statementId: "AllowExecutionFromApiGateway",
      action: "lambda:InvokeFunction",
      functionName: props.lambdaFunctionName,
      principal: "apigateway.amazonaws.com",
      sourceArn: `${api.executionArn}/*/*`,
    });
  }

}