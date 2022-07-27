output "api_gateway_url" {
  description = "The Base URL for the API Gateway"
  value = aws_apigatewayv2_stage.gateway_stage.invoke_url
}