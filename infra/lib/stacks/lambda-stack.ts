import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as logs from 'aws-cdk-lib/aws-logs'
import { Construct } from 'constructs'
import * as path from 'path'
import { PythonFunction } from '@aws-cdk/aws-lambda-python-alpha'

export interface LambdaStackProps {
  projectName: string
  environment: string
  cognitoUserPoolId: string
  cognitoClientId: string
  usersTableName: string
  memesTableName: string
  likesTableName: string
  categoriesTableName: string
  uploadJobsTableName: string
  memesBucketName: string
  frontendBucketName: string
  frontendDomain: string
  usersTableArn: string
  memesTableArn: string
  likesTableArn: string
  categoriesTableArn: string
  uploadJobsTableArn: string
  memesBucketArn: string
  awsRegion: string
}

export class LambdaStack extends Construct {
  public readonly lambdaFunction: lambda.Function

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id)

    // IAM Role for Lambda
    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      roleName: `${props.projectName}-${props.environment}-lambda-role`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    })

    // Custom policy for DynamoDB and S3
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:Query',
          'dynamodb:Scan',
        ],
        resources: [
          props.usersTableArn,
          props.memesTableArn,
          props.likesTableArn,
          props.categoriesTableArn,
          props.uploadJobsTableArn,
          `${props.memesTableArn}/index/*`,
          `${props.likesTableArn}/index/*`,
          `${props.uploadJobsTableArn}/index/*`,
        ],
      })
    )

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:PutObjectAcl',
        ],
        resources: [`${props.memesBucketArn}/*`],
      })
    )

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:ListBucket'],
        resources: [props.memesBucketArn],
      })
    )

    const backendPath = path.join(__dirname, '../../../backend')

    this.lambdaFunction = new PythonFunction(this, 'ApiFunction', {
      functionName: `${props.projectName}-${props.environment}-api`,
      runtime: lambda.Runtime.PYTHON_3_13,
      entry: backendPath,
      index: 'src/main.py',
      handler: 'handler',
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      architecture: lambda.Architecture.X86_64,
      environment: {
        ENVIRONMENT: props.environment,
        USERS_TABLE: props.usersTableName,
        MEMES_TABLE: props.memesTableName,
        LIKES_TABLE: props.likesTableName,
        CATEGORIES_TABLE: props.categoriesTableName,
        UPLOAD_JOBS_TABLE: props.uploadJobsTableName,
        MEMES_BUCKET: props.memesBucketName,
        FRONTEND_BUCKET: props.frontendBucketName,
        COGNITO_USER_POOL_ID: props.cognitoUserPoolId,
        COGNITO_CLIENT_ID: props.cognitoClientId,
        COGNITO_REGION: props.awsRegion,
        CORS_ORIGINS: `https://${props.frontendDomain},http://localhost:5173,http://localhost:5174`,
      },
      logRetention: logs.RetentionDays.TWO_WEEKS,
      bundling: {
        assetExcludes: [
          '.venv',
          'env',
          'venv',
          '__pycache__',
          '*.pyc',
          '*.pyo',
          '*.py[cod]',
          '*$py.class',
          '.pytest_cache',
          'dist',
          'build',
          'cdk.out',
          '.git',
          '.env',
          '*.egg-info',
          'lambda.zip',
        ],
        environment: {
          PIP_DISABLE_PIP_VERSION_CHECK: '1',
        },
      },
    })

    // CloudWatch Log Group
    new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/${this.lambdaFunction.functionName}`,
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })
  }
}

