import { TerraformStack } from "cdktf";
import { Construct } from "constructs";
import { AwsProvider } from "@cdktf/provider-aws";
import * as s3Lib from "../lib/s3Bucket";

export interface LambdaProps {
  readonly projectName: string,
}

export class LambdaStack extends TerraformStack {
  constructor(scope: Construct, name: string, props: LambdaProps) {
    super(scope, name);

    new AwsProvider(this, 'aws', {});

    s3Lib.createBucket(this, props.projectName + "-code", true);
  }
}