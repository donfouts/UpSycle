import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { Construct } from "constructs";

/**
 * StorageStack
 *
 * Two S3 buckets (per prisma/schema.prisma's ProductPhoto / SellerSamplePhoto
 * models):
 *  - product photos: public-read via CloudFront only (buyer-facing listing images)
 *  - seller vetting sample photos: private, admin-review only (never public —
 *    these back the seller approval workflow, not the storefront)
 *
 * A single CloudFront distribution fronts the product-photos bucket (using
 * Origin Access Control so the bucket itself stays private and is only
 * reachable through CloudFront) for cheap, cached delivery — first 10M
 * requests/mo free per infra plan.
 */
export class StorageStack extends cdk.Stack {
  public readonly productPhotosBucket: s3.Bucket;
  public readonly sellerVettingPhotosBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.productPhotosBucket = new s3.Bucket(this, "ProductPhotosBucket", {
      bucketName: undefined, // let CDK generate a unique name
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: false,
      lifecycleRules: [
        { abortIncompleteMultipartUploadAfter: cdk.Duration.days(7) },
      ],
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ["https://UpSycleMarket.com", "http://localhost:3000"],
          allowedHeaders: ["*"],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.sellerVettingPhotosBucket = new s3.Bucket(this, "SellerVettingPhotosBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: false,
      // Never fronted by CloudFront / never made public — admin review only.
      lifecycleRules: [
        { abortIncompleteMultipartUploadAfter: cdk.Duration.days(7) },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.distribution = new cloudfront.Distribution(this, "ProductPhotosDistribution", {
      comment: "UpSycle product photos CDN",
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.productPhotosBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // cheapest — NA/EU edge locations only, fine for MVP
    });

    new cdk.CfnOutput(this, "ProductPhotosBucketName", { value: this.productPhotosBucket.bucketName });
    new cdk.CfnOutput(this, "SellerVettingPhotosBucketName", { value: this.sellerVettingPhotosBucket.bucketName });
    new cdk.CfnOutput(this, "CloudFrontDomainName", { value: this.distribution.distributionDomainName });
  }
}
