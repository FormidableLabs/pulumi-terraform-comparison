import { TerraformStack, TerraformOutput } from "cdktf";
import { Construct } from "constructs";
import { AwsProvider, cloudfront } from "@cdktf/provider-aws";

export interface CloudFrontProps {
  readonly projectName: string,
  readonly apiGatewayId: string,
  readonly apiGatewayStageName: string,
  readonly region: string,
}

export class CloudFrontStack extends TerraformStack {

  constructor(scope: Construct, name: string, props: CloudFrontProps) {
    super(scope, name);
    new AwsProvider(this, 'aws', {});

    const distro = new cloudfront.CloudfrontDistribution (this, "cloudFrontDistro", {
      comment: props.projectName,
      origin: [{
        domainName: `${props.apiGatewayId}.execute-api.${props.region}.amazonaws.com`,
        originPath: `/${props.apiGatewayStageName}`,
        originId: "api",
        customOriginConfig: {
          httpPort: 80,
          httpsPort: 443,
          originProtocolPolicy: "https-only",
          originSslProtocols: ["TLSv1", "TLSv1.1"],
        },
      }],
      enabled: true,
      defaultCacheBehavior: {
        allowedMethods: ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
        cachedMethods: ["GET", "HEAD", "OPTIONS"],
        compress: true,
        targetOriginId: "api",
        viewerProtocolPolicy: "https-only",
        forwardedValues: {
          queryString: true,
          headers: ["Accept", "Referer", "Authorization", "Content-Type"],
          cookies: {
            forward: "all",
          }
        }
      },
      priceClass: "PriceClass_All",
      viewerCertificate: {
        cloudfrontDefaultCertificate: true,
      },
      restrictions: {
        geoRestriction: {
          restrictionType: "none",
        },
      }
    });

    new TerraformOutput(this, "cloudFrontDomain",  {
      value: distro.domainName
    });

    new TerraformOutput(this, "cloudFrontUrl", {
      value: `https://${distro.domainName}/hello`
    });
  }
}