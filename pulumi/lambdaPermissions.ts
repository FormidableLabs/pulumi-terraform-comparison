import * as aws from "@pulumi/aws";

export function createLambdaPermissions(prefix: string) {
  const lambdaLoggingPolicy = new aws.iam.Policy(`${prefix}-lambda-logging`, {
    path: "/",
    description: "Policy to allow the IAM role for Lambda to write to CloudWatch Logs",
    policy: `{
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
    }`,
  });

  const lambdaRole = new aws.iam.Role(`${prefix}-lambda`, {
    name: `${prefix}-lambda`,
    assumeRolePolicy: `{
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
    }`
  });

  const lambdaRoleAttachment = new aws.iam.RolePolicyAttachment(`${prefix}-logs`, {
    role: lambdaRole.name,
    policyArn: lambdaLoggingPolicy.arn,
  });

  return { lambdaRole };
}