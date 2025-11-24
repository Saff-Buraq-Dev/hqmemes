import * as cdk from 'aws-cdk-lib'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as route53 from 'aws-cdk-lib/aws-route53'
import { Construct } from 'constructs'

/**
 * Separate stack for CloudFront certificates in us-east-1
 * CloudFront requires ACM certificates to be in us-east-1
 * This stack must be deployed to us-east-1 region
 */
export interface CloudFrontCertificatesStackProps extends cdk.StackProps {
  frontendDomain: string
  assetsDomain: string
  hostedZoneId: string
}

export class CloudFrontCertificatesStack extends cdk.Stack {
  public readonly frontendCertificate: acm.Certificate
  public readonly assetsCertificate: acm.Certificate

  constructor(scope: Construct, id: string, props: CloudFrontCertificatesStackProps) {
    super(scope, id, {
      ...props,
      env: {
        account: props.env?.account || process.env.CDK_DEFAULT_ACCOUNT || '',
        region: 'us-east-1', // CloudFront requires us-east-1
      },
    })

    // Get hosted zone
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: props.hostedZoneId,
      zoneName: props.frontendDomain.split('.').slice(-2).join('.'), // Extract root domain
    })

    // Certificate for Frontend (must be in us-east-1 for CloudFront)
    this.frontendCertificate = new acm.Certificate(this, 'FrontendCertificate', {
      domainName: props.frontendDomain,
      subjectAlternativeNames: [props.assetsDomain], // Include assets domain in the same cert
      validation: acm.CertificateValidation.fromDns(hostedZone),
    })

    // Certificate for Assets (must be in us-east-1 for CloudFront)
    this.assetsCertificate = new acm.Certificate(this, 'AssetsCertificate', {
      domainName: props.assetsDomain,
      subjectAlternativeNames: [props.frontendDomain], // Include frontend domain in the same cert
      validation: acm.CertificateValidation.fromDns(hostedZone),
    })

    // Outputs for certificate ARNs
    new cdk.CfnOutput(this, 'FrontendCertificateArn', {
      value: this.frontendCertificate.certificateArn,
      exportName: `${this.stackName}-frontend-cert-arn`,
      description: 'ARN of the CloudFront certificate for frontend domain (us-east-1)',
    })

    new cdk.CfnOutput(this, 'AssetsCertificateArn', {
      value: this.assetsCertificate.certificateArn,
      exportName: `${this.stackName}-assets-cert-arn`,
      description: 'ARN of the CloudFront certificate for assets domain (us-east-1)',
    })
  }
}

