import * as cdk from 'aws-cdk-lib'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'

export interface S3StackProps {
  projectName: string
  environment: string
}

export class S3Stack extends Construct {
  public readonly frontendBucket: s3.Bucket
  public readonly memesBucket: s3.Bucket

  constructor(scope: Construct, id: string, props: S3StackProps) {
    super(scope, id)

    // Frontend Bucket
    this.frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `${props.projectName}-${props.environment}-frontend`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    // Memes/Assets Bucket
    this.memesBucket = new s3.Bucket(this, 'MemesBucket', {
      bucketName: `${props.projectName}-${props.environment}-assets`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: false,
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ['*'],
          exposedHeaders: ['ETag'],
          maxAge: 3000,
        },
      ]
    })
  }
}

