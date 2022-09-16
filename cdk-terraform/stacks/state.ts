import { TerraformStack, TerraformOutput } from "cdktf";
import { Construct } from "constructs";
import { AwsProvider } from "@cdktf/provider-aws";
import * as s3Lib from "../lib/s3Bucket";

export interface StateProps {
  readonly bucketName: string,
  readonly encrypt?: boolean
}

export class State extends TerraformStack {
  constructor(scope: Construct, name: string, props: StateProps) {
    super(scope, name);

    new AwsProvider(this, 'aws', {});

    const stateBucket = s3Lib.createBucket(this, props.bucketName, true, false);

    new TerraformOutput(this, "stateBucket",  {
      value: stateBucket.id
    });
  }
}