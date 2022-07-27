output "api_gateway_url" {
  description = "The Base URL for the API Gateway"
  value = aws_apigatewayv2_api.api_gateway.api_endpoint
}