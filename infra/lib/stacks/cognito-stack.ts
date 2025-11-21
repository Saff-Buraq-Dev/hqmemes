import * as cdk from 'aws-cdk-lib'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import { Construct } from 'constructs'

export interface CognitoStackProps {
  projectName: string
  environment: string
  frontendDomain: string
}

export class CognitoStack extends Construct {
  public readonly userPool: cognito.UserPool
  public readonly userPoolClient: cognito.UserPoolClient

  constructor(scope: Construct, id: string, props: CognitoStackProps) {
    super(scope, id)

    // Cognito User Pool with correct configuration from the start
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `${props.projectName}-${props.environment}-user-pool`,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: false,
        requireUppercase: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow deletion for clean restart
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        preferredUsername: {
          required: false,
          mutable: true,
        },
      },
      // Enable public sign-up (allow users to create their own accounts)
      selfSignUpEnabled: true,
      signInCaseSensitive: false,
    })

    // Cognito User Pool Client
    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: `${props.projectName}-${props.environment}-client`,
      authFlows: {
        userSrp: true,
        userPassword: true,
      },
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      generateSecret: false, // Not needed for SPA
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [
          `https://${props.frontendDomain}`,
          'http://localhost:5173',
          'http://localhost:5174',
        ],
        logoutUrls: [
          `https://${props.frontendDomain}`,
          'http://localhost:5173',
          'http://localhost:5174',
        ],
      },
      // Read/write attributes - preferred_username is a standard attribute
      readAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({
          email: true,
          preferredUsername: true,
        }),
      writeAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({
          email: true,
          preferredUsername: true,
        }),
    })

    // Cognito User Pool Domain (for hosted UI - optional but good to have)
    const userPoolDomain = new cognito.UserPoolDomain(this, 'UserPoolDomain', {
      userPool: this.userPool,
      cognitoDomain: {
        domainPrefix: `${props.projectName}-${props.environment}`,
      },
    })
  }
}

