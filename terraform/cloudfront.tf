resource "aws_cloudfront_distribution" "api_gateway" {
  origin {
    domain_name = "${aws_apigatewayv2_api.api_gateway.id}.execute-api.${var.region}.amazonaws.com"
    origin_path = "/${aws_apigatewayv2_stage.gateway_stage.name}"
    origin_id   = "api"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1","TLSv1.1"]
    }
  }

  enabled             = true

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    compress = true
    target_origin_id = "api"
    viewer_protocol_policy = "https-only"

    forwarded_values {
      query_string = true
      headers = ["Accept", "Referer", "Authorization", "Content-Type"]
      cookies {
        forward = "all"
      }
    }
  }

  price_class = "PriceClass_All"

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}