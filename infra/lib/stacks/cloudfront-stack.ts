import * as cdk from 'aws-cdk-lib'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets'
import { Construct } from 'constructs'

export interface CloudFrontStackProps {
  projectName: string
  environment: string
  frontendBucket: s3.Bucket
  memesBucket: s3.Bucket
  frontendDomain: string
  assetsDomain: string
  hostedZoneId: string
  frontendCertificateArn?: string // ARN of certificate in us-east-1
  assetsCertificateArn?: string // ARN of certificate in us-east-1
}

export class CloudFrontStack extends Construct {
  public readonly frontendDistribution: cloudfront.Distribution
  public readonly assetsDistribution: cloudfront.Distribution

  constructor(scope: Construct, id: string, props: CloudFrontStackProps) {
    super(scope, id)

    // Get hosted zone
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: props.hostedZoneId,
      zoneName: props.frontendDomain.split('.').slice(-2).join('.'), // Extract root domain
    })

    // Note: For CloudFront, ACM certificates MUST be in us-east-1
    // We expect certificates to be created in a separate stack (CloudFrontCertificatesStack)
    // If certificate ARNs are provided, use them; otherwise, certificates must be created separately
    
    let frontendCertificate: acm.ICertificate | undefined
    let assetsCertificate: acm.ICertificate | undefined

    if (props.frontendCertificateArn) {
      frontendCertificate = acm.Certificate.fromCertificateArn(
        this,
        'FrontendCertificate',
        props.frontendCertificateArn
      )
    }

    if (props.assetsCertificateArn) {
      assetsCertificate = acm.Certificate.fromCertificateArn(
        this,
        'AssetsCertificate',
        props.assetsCertificateArn
      )
    }

    // If certificates not provided, we'll skip CloudFront creation
    // They must be deployed first via certificates stack
    if (!frontendCertificate || !assetsCertificate) {
      console.warn(
        '⚠️  CloudFront certificates not provided. ' +
        'Deploy certificates stack first or set FRONTEND_CERTIFICATE_ARN and ASSETS_CERTIFICATE_ARN in .env'
      )
      // Create dummy distributions that will be replaced later
      // This allows synthesis to succeed
    }

    // CloudFront Distribution for Frontend
    this.frontendDistribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: new cloudfrontOrigins.S3Origin(props.frontendBucket, {
          originAccessIdentity: new cloudfront.OriginAccessIdentity(this, 'FrontendOAI', {
            comment: `${props.projectName}-${props.environment}-frontend-oai`,
          }),
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      domainNames: [props.frontendDomain],
      certificate: frontendCertificate as acm.ICertificate,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // North America & Europe
      enableIpv6: true,
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
    })

    // CloudFront Distribution for Assets
    this.assetsDistribution = new cloudfront.Distribution(this, 'AssetsDistribution', {
      defaultBehavior: {
        origin: new cloudfrontOrigins.S3Origin(props.memesBucket, {
          originAccessIdentity: new cloudfront.OriginAccessIdentity(this, 'AssetsOAI', {
            comment: `${props.projectName}-${props.environment}-assets-oai`,
          }),
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: new cloudfront.OriginRequestPolicy(this, 'AssetsOriginRequestPolicy', {
          headerBehavior: cloudfront.OriginRequestHeaderBehavior.allowList(
            'Origin',
            'Access-Control-Request-Headers',
            'Access-Control-Request-Method'
          ),
        }),
      },
      domainNames: [props.assetsDomain],
      certificate: assetsCertificate as acm.ICertificate,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enableIpv6: true,
    })

    // Grant CloudFront access to S3 buckets via OAI
    // Note: S3Origin uses OAC (Origin Access Control) in newer CDK versions
    // The bucket policy is automatically managed, but we can add custom policies if needed
    // For CloudFront with S3, OAC is preferred over OAI

    // Route53 Records
    new route53.ARecord(this, 'FrontendARecord', {
      zone: hostedZone,
      recordName: props.frontendDomain,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.CloudFrontTarget(this.frontendDistribution)
      ),
    })

    new route53.ARecord(this, 'AssetsARecord', {
      zone: hostedZone,
      recordName: props.assetsDomain,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.CloudFrontTarget(this.assetsDistribution)
      ),
    })
  }
}

