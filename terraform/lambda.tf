locals {
  prefix = "${var.project_name}-${var.unique_identifier}"
  lambda_name = "${local.prefix}-lambda"
}

data "archive_file" "zip_lambda_code" {
  type = "zip"
  source_file = "${var.working_dir}/../lambda/index.js"
  output_path = "${var.working_dir}/lambda.zip"
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

resource "aws_iam_policy" "lambda_logging" {
  name = "${local.prefix}-lambda-logging"
  path = "/"
  description = "Policy to allow the IAM role for Lambda to write to CloudWatch Logs"
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*",
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "lambda_logging" {
  role = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_logging.arn
}

resource "aws_cloudwatch_log_group" "lambda_log_group" {
  name = "/aws/lambda/${local.lambda_name}"
  retention_in_days = 14
}

resource "aws_lambda_function" "lambda_function" {
  filename = "${var.working_dir}/lambda.zip"
  function_name = "${local.lambda_name}"
  handler = "index.handler"
  runtime = "nodejs16.x"
  role = aws_iam_role.lambda_role.arn

  depends_on = [
    aws_cloudwatch_log_group.lambda_log_group,
    aws_iam_role_policy_attachment.lambda_logging
  ]
}