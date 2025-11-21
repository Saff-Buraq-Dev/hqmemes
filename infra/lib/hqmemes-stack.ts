import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { CognitoStack } from './stacks/cognito-stack'
import { DynamoDBStack } from './stacks/dynamodb-stack'
import { S3Stack } from './stacks/s3-stack'
import { LambdaStack } from './stacks/lambda-stack'
import { ApiGatewayStack } from './stacks/api-gateway-stack'
import { CloudFrontStack } from './stacks/cloudfront-stack'
import { getConfig } from './config'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'

export class HQMemesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const config = getConfig()

    // 1. Cognito (ca-central-1)
    const cognitoStack = new CognitoStack(this, 'CognitoStack', {
      projectName: config.projectName,
      environment: config.environment,
      frontendDomain: config.frontendDomain,
    })

    // 2. DynamoDB (ca-central-1)
    const dynamoDBStack = new DynamoDBStack(this, 'DynamoDBStack', {
      projectName: config.projectName,
      environment: config.environment,
    })

    // 3. S3 (ca-central-1)
    const s3Stack = new S3Stack(this, 'S3Stack', {
      projectName: config.projectName,
      environment: config.environment,
    })

    // 4. Lambda (ca-central-1)
    const lambdaStack = new LambdaStack(this, 'LambdaStack', {
      projectName: config.projectName,
      environment: config.environment,
      cognitoUserPoolId: cognitoStack.userPool.userPoolId,
      cognitoClientId: cognitoStack.userPoolClient.userPoolClientId,
      usersTableName: dynamoDBStack.usersTable.tableName,
      memesTableName: dynamoDBStack.memesTable.tableName,
      likesTableName: dynamoDBStack.likesTable.tableName,
      categoriesTableName: dynamoDBStack.categoriesTable.tableName,
      uploadJobsTableName: dynamoDBStack.uploadJobsTable.tableName,
      memesBucketName: s3Stack.memesBucket.bucketName,
      frontendBucketName: s3Stack.frontendBucket.bucketName,
      frontendDomain: config.frontendDomain,
      usersTableArn: dynamoDBStack.usersTable.tableArn,
      memesTableArn: dynamoDBStack.memesTable.tableArn,
      likesTableArn: dynamoDBStack.likesTable.tableArn,
      categoriesTableArn: dynamoDBStack.categoriesTable.tableArn,
      uploadJobsTableArn: dynamoDBStack.uploadJobsTable.tableArn,
      memesBucketArn: s3Stack.memesBucket.bucketArn,
      awsRegion: config.awsRegion,
    })

    // 5. API Gateway (ca-central-1)
    const apiGatewayStack = new ApiGatewayStack(this, 'ApiGatewayStack', {
      projectName: config.projectName,
      environment: config.environment,
      lambdaFunction: lambdaStack.lambdaFunction,
      cognitoUserPoolId: cognitoStack.userPool.userPoolId,
      cognitoClientId: cognitoStack.userPoolClient.userPoolClientId,
      apiDomain: config.apiDomain,
      hostedZoneId: config.hostedZoneId,
      frontendDomain: config.frontendDomain,
      awsRegion: config.awsRegion,
    })

    // 6. CloudFront (requires us-east-1 for certificates)
    // Note: Certificates must be created in a separate stack (certificates-app.ts)
    // You can either:
    // 1. Deploy certificates stack first and use the ARNs
    // 2. Use environment variables for certificate ARNs
    const frontendCertArn = process.env.FRONTEND_CERTIFICATE_ARN
    const assetsCertArn = process.env.ASSETS_CERTIFICATE_ARN


    console.log("******************************")
    console.log("******************************")
    console.log("******************************")
    console.log(frontendCertArn);
    console.log(assetsCertArn);
    console.log("******************************")
    console.log("******************************")
    console.log("******************************")

    
    const cloudFrontStack = new CloudFrontStack(this, 'CloudFrontStack', {
      projectName: config.projectName,
      environment: config.environment,
      frontendBucket: s3Stack.frontendBucket,
      memesBucket: s3Stack.memesBucket,
      frontendDomain: config.frontendDomain,
      assetsDomain: config.assetsDomain,
      hostedZoneId: config.hostedZoneId,
      frontendCertificateArn: frontendCertArn,
      assetsCertificateArn: assetsCertArn,
    })

    // Outputs
    new cdk.CfnOutput(this, 'CognitoUserPoolId', {
      value: cognitoStack.userPool.userPoolId,
      exportName: `${config.projectName}-${config.environment}-cognito-user-pool-id`,
    })

    new cdk.CfnOutput(this, 'CognitoClientId', {
      value: cognitoStack.userPoolClient.userPoolClientId,
      exportName: `${config.projectName}-${config.environment}-cognito-client-id`,
    })

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: `https://${config.apiDomain}`,
      exportName: `${config.projectName}-${config.environment}-api-url`,
    })

    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: `https://${config.frontendDomain}`,
      exportName: `${config.projectName}-${config.environment}-frontend-url`,
    })

    new cdk.CfnOutput(this, 'AssetsUrl', {
      value: `https://${config.assetsDomain}`,
      exportName: `${config.projectName}-${config.environment}-assets-url`,
    })

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: s3Stack.frontendBucket.bucketName,
      exportName: `${config.projectName}-${config.environment}-frontend-bucket`,
    })

    new cdk.CfnOutput(this, 'MemesBucketName', {
      value: s3Stack.memesBucket.bucketName,
      exportName: `${config.projectName}-${config.environment}-memes-bucket`,
    })

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: cloudFrontStack.frontendDistribution.distributionId,
      exportName: `${config.projectName}-${config.environment}-cloudfront-distribution-id`,
    })

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambdaStack.lambdaFunction.functionName,
      exportName: `${config.projectName}-${config.environment}-lambda-function-name`,
    })
  }
}

