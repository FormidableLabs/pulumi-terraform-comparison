locals {
  prefix = "${var.project_name}-${var.unique_identifier}"
}

data "archive_file" "zip_lambda_code" {
  type = "zip"
  source_file = "${path.module}/../lambda/index.js"
  output_path = "${path.module}/lambda.zip"
}

resource "aws_iam_role" "lambda_role" {
  name = "${local.prefix}-lambda"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_lambda_function" "lambda_function" {
  filename = "${path.module}/lambda.zip"
  function_name = "${local.prefix}-lambda"
  handler = "index.handler"
  runtime = "nodejs16.x"
  role = aws_iam_role.lambda_role
}