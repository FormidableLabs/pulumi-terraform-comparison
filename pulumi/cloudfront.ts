import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export function createCloudWatch(prefix: string, apiGateway: aws.apigatewayv2.Api, gatewayStage: aws.apigatewayv2.Stage) {
  return new aws.cloudfront.Distribution(`${prefix}-cloudfront`, {
    enabled: true,
    priceClass: "PriceClass_All",

    origins: [{
      domainName: pulumi.interpolate`${apiGateway.id}.execute-api.${aws.getRegionOutput().name}.amazonaws.com`,
      originPath: pulumi.interpolate`/${gatewayStage.name}`,
      originId: "api",
      customOriginConfig: {
        httpPort: 80,
        httpsPort: 443,
        originProtocolPolicy: "https-only",
        originSslProtocols: ["TLSv1", "TLSv1.1"],
      },
    }],

    defaultCacheBehavior: {
      allowedMethods: [
        "DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT",
      ],
      cachedMethods: [
        "GET", "HEAD",
      ],
      compress: true,
      targetOriginId: "api",
      viewerProtocolPolicy: "https-only",
      forwardedValues: {
        queryString: true,
        headers: ["Accept", "Referer", "Authorization", "Content-Type"],
        cookies: {
          forward: "all",
        },
      },
    },
    viewerCertificate: {
      cloudfrontDefaultCertificate: true,
    },

    restrictions: {
      geoRestriction: {
        restrictionType: "none",
      }
    },

  });
}