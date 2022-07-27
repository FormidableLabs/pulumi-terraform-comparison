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

  //aliases = ["${var.domain_name}"]

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]

    forwarded_values {
      query_string = true
			headers = ["Accept", "Referer", "Authorization", "Content-Type"]
			cookies {
				forward = "all"
			}
    }
		compress = true

/*
		lambda_function_association  {
			event_type = "origin-response"
			lambda_arn = "arn:aws:lambda:us-east-1:${var.account_name}:function:http-header-injector:1"
		}
    */

		target_origin_id = "api"

		viewer_protocol_policy = "https-only"
  }

  price_class = "PriceClass_All"

  viewer_certificate {
    cloudfront_default_certificate = true
    /*
		acm_certificate_arn      = "${var.ssl_cert_arn}"
		minimum_protocol_version = "TLSv1.1_2016"
		ssl_support_method       = "sni-only"
    */
  }

	restrictions {
		geo_restriction {
			restriction_type = "none"
		}
	}
}