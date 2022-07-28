import * as aws from "@pulumi/aws";

export function createLambda(
  lambdaName: string,
  lambdaRole: aws.iam.Role,
  codeBucket: aws.s3.BucketV2,
  lambdaCodeObject: aws.s3.BucketObject,
  lambdaZipHash: string,
  lambdaRoleAttachment: aws.iam.RolePolicyAttachment,
  cloudWatch: aws.cloudwatch.LogGroup
  ) {

  return new aws.lambda.Function(`${lambdaName}`, {
    name: lambdaName,
    role: lambdaRole.arn,
    handler: "index.handler",
    runtime: "nodejs16.x",

    s3Bucket: codeBucket.id,
    s3Key: lambdaCodeObject.key,
    sourceCodeHash: lambdaZipHash,
  }, {
    dependsOn: [
      lambdaRoleAttachment,
      cloudWatch,
    ],
  });
}