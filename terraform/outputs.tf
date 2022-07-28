output "api_gateway_url" {
  description = "The Base URL for the API Gateway"
  value = "${aws_apigatewayv2_stage.gateway_stage.invoke_url}/hello"
}

output "cloudfront_url" {
  description = "The base URL for the CloudFront distro"
  value = "https://${aws_cloudfront_distribution.api_gateway.domain_name}/hello"
}