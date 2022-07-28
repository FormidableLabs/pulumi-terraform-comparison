import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as AdmZip from 'adm-zip';
import * as md5File from 'md5-file';

export function createLambdaCode(prefix: string, lambdaZipName: string) {
  const codeBucket = new aws.s3.BucketV2(`${prefix}-code-bucket`, {});
  new aws.s3.BucketAclV2(`${prefix}-code-bucket-acl`, {
    bucket: codeBucket.id,
    acl: "private",
  });

  // Create zip file for Lambda
  const lambdaZip = new AdmZip();
  lambdaZip.addLocalFolder("../lambda");
  lambdaZip.writeZip(lambdaZipName);

  const crypto = require('crypto');
  const fs = require('fs');
  const fileBuffer = fs.readFileSync(lambdaZipName);
  const lambdaZipHash = crypto.createHash('sha256').update(fileBuffer).digest('base64');

  const lambdaCodeObject = new aws.s3.BucketObject("lambda-code", {
    key: lambdaZipName,
    bucket: codeBucket.id,
    source: new pulumi.asset.FileAsset(lambdaZipName),
    etag: md5File.sync(lambdaZipName),
  });

  return { codeBucket, lambdaCodeObject, lambdaZipHash };
}