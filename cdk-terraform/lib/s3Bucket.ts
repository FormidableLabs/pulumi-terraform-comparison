import { TerraformStack } from "cdktf";
import { s3, kms } from "@cdktf/provider-aws";

export function createBucket(
  stack: TerraformStack,
  bucketName: string,
  encrypt: boolean,
  versioning: boolean
) {

  const bucket = new s3.S3Bucket(stack, bucketName, {
    bucket: bucketName,
    forceDestroy: true,
  });

  if (encrypt) {
    // TODO Make the KMS key configurable
    const keyAlias = new kms.DataAwsKmsAlias(stack, 's3-default-key', {
      name: 'alias/aws/s3'
    });

    new s3.S3BucketServerSideEncryptionConfigurationA(stack, 'encryption-by-default', {
      bucket: bucket.bucket,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "aws:kms",
            kmsMasterKeyId: keyAlias.targetKeyId,
          }
        },
      ],
    });
  }

  if (versioning) {
    new s3.S3BucketVersioningA(stack, 'bucket-versioning', {
      bucket: bucket.bucket,
      versioningConfiguration: {
        status: "Enabled"
      },
    });
  }

  new s3.S3BucketPublicAccessBlock(stack, 'statelock-public-access-block', {
    bucket: bucket.bucket,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true
  });

  return bucket;
}