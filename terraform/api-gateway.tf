resource "aws_apigatewayv2_api" "api_gateway" {
  name          = "${local.prefix}_api_gateway"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "gateway_stage" {
  api_id = aws_apigatewayv2_api.api_gateway.id

  name        = "${local.prefix}_gateway_stage"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.lambda_log_group.arn

    format = jsonencode({
      requestId               = "$context.requestId"
      sourceIp                = "$context.identity.sourceIp"
      requestTime             = "$context.requestTime"
      protocol                = "$context.protocol"
      httpMethod              = "$context.httpMethod"
      resourcePath            = "$context.resourcePath"
      routeKey                = "$context.routeKey"
      status                  = "$context.status"
      responseLength          = "$context.responseLength"
      integrationErrorMessage = "$context.integrationErrorMessage"
      }
    )
  }
}

resource "aws_apigatewayv2_integration" "gateway_integration" {
  api_id = aws_apigatewayv2_api.api_gateway.id

  integration_uri    = aws_lambda_function.lambda_function.invoke_arn
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "gateway_route" {
  api_id = aws_apigatewayv2_api.api_gateway.id

  route_key = "GET /hello"
  target    = "integrations/${aws_apigatewayv2_integration.gateway_integration.id}"
}

resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_function.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.api_gateway.execution_arn}/*/*"
}