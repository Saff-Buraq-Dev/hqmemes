import * as cdk from 'aws-cdk-lib'
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2'
import * as apigwIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'

export interface ApiGatewayStackProps {
  projectName: string
  environment: string
  lambdaFunction: lambda.Function
  cognitoUserPoolId: string
  cognitoClientId: string
  apiDomain: string
  hostedZoneId: string
  frontendDomain: string
  awsRegion: string
}

export class ApiGatewayStack extends Construct {
  public readonly httpApi: apigw.HttpApi
  public readonly apiDomain: apigw.DomainName
  public readonly apiMapping: apigw.ApiMapping

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id)

    // Get hosted zone
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: props.hostedZoneId,
      zoneName: props.apiDomain.split('.').slice(-2).join('.'), // Extract root domain
    })

    // ACM Certificate for API (must be in same region as API Gateway - ca-central-1)
    const certificate = new acm.Certificate(this, 'ApiCertificate', {
      domainName: props.apiDomain,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    })

    // HTTP API
    this.httpApi = new apigw.HttpApi(this, 'HttpApi', {
      apiName: `${props.projectName}-${props.environment}-api`,
      corsPreflight: {
        allowOrigins: [
          `https://${props.frontendDomain}`,
          `https://${props.apiDomain}`,
          'http://localhost:5173',
          'http://localhost:5174',
        ],
        allowMethods: [apigw.CorsHttpMethod.GET, apigw.CorsHttpMethod.POST, apigw.CorsHttpMethod.PUT, apigw.CorsHttpMethod.DELETE, apigw.CorsHttpMethod.OPTIONS],
        allowHeaders: ['*'],
        maxAge: cdk.Duration.seconds(300),
      },
    })

    // JWT Authorizer
    const authorizer = new apigw.HttpAuthorizer(this, 'CognitoAuthorizer', {
      httpApi: this.httpApi,
      type: apigw.HttpAuthorizerType.JWT,
      identitySource: ['$request.header.Authorization'],
      jwtAudience: [props.cognitoClientId],
      jwtIssuer: `https://cognito-idp.${props.awsRegion}.amazonaws.com/${props.cognitoUserPoolId}`,
    })

    // Lambda Integration
    const lambdaIntegration = new apigwIntegrations.HttpLambdaIntegration('LambdaIntegration', props.lambdaFunction)

    // OPTIONS routes (CORS preflight - no auth required)
    this.httpApi.addRoutes({
      path: '/auth/{proxy+}',
      methods: [apigw.HttpMethod.OPTIONS],
      integration: lambdaIntegration,
    })

    this.httpApi.addRoutes({
      path: '/memes/{proxy+}',
      methods: [apigw.HttpMethod.OPTIONS],
      integration: lambdaIntegration,
    })

    this.httpApi.addRoutes({
      path: '/categories/{proxy+}',
      methods: [apigw.HttpMethod.OPTIONS],
      integration: lambdaIntegration,
    })

    this.httpApi.addRoutes({
      path: '/upload/{proxy+}',
      methods: [apigw.HttpMethod.OPTIONS],
      integration: lambdaIntegration,
    })

    // Public routes (no auth required)
    this.httpApi.addRoutes({
      path: '/auth/signup',
      methods: [apigw.HttpMethod.POST],
      integration: lambdaIntegration,
    })

    // Protected routes (require JWT)
    this.httpApi.addRoutes({
      path: '/auth/{proxy+}',
      methods: [apigw.HttpMethod.ANY],
      integration: lambdaIntegration,
      authorizer: apigw.HttpAuthorizer.fromHttpAuthorizerAttributes(this, 'ImportAuthorizer', {
        authorizerId: authorizer.authorizerId,
        authorizerType: apigw.HttpAuthorizerType.JWT,
      }),
    })

    this.httpApi.addRoutes({
      path: '/memes/{proxy+}',
      methods: [apigw.HttpMethod.ANY],
      integration: lambdaIntegration,
      authorizer: apigw.HttpAuthorizer.fromHttpAuthorizerAttributes(this, 'ImportAuthorizer2', {
        authorizerId: authorizer.authorizerId,
        authorizerType: apigw.HttpAuthorizerType.JWT,
      }),
    })

    this.httpApi.addRoutes({
      path: '/categories/{proxy+}',
      methods: [apigw.HttpMethod.ANY],
      integration: lambdaIntegration,
      authorizer: apigw.HttpAuthorizer.fromHttpAuthorizerAttributes(this, 'ImportAuthorizer3', {
        authorizerId: authorizer.authorizerId,
        authorizerType: apigw.HttpAuthorizerType.JWT,
      }),
    })

    this.httpApi.addRoutes({
      path: '/upload/{proxy+}',
      methods: [apigw.HttpMethod.ANY],
      integration: lambdaIntegration,
      authorizer: apigw.HttpAuthorizer.fromHttpAuthorizerAttributes(this, 'ImportAuthorizer4', {
        authorizerId: authorizer.authorizerId,
        authorizerType: apigw.HttpAuthorizerType.JWT,
      }),
    })

    // Default route (proxy all - no auth for health check)
    this.httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigw.HttpMethod.ANY],
      integration: lambdaIntegration,
    })

    // CloudWatch Log Group
    new logs.LogGroup(this, 'ApiLogGroup', {
      logGroupName: `/aws/apigateway/${props.projectName}-${props.environment}`,
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    // Custom Domain
    this.apiDomain = new apigw.DomainName(this, 'ApiDomain', {
      domainName: props.apiDomain,
      certificate,
    })

    // API Mapping
    this.apiMapping = new apigw.ApiMapping(this, 'ApiMapping', {
      api: this.httpApi,
      domainName: this.apiDomain,
    })

    // Route53 Record
    new route53.ARecord(this, 'ApiARecord', {
      zone: hostedZone,
      recordName: props.apiDomain,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.ApiGatewayv2DomainProperties(
          this.apiDomain.regionalDomainName,
          this.apiDomain.regionalHostedZoneId
        )
      ),
    })

    // Grant Lambda permission to be invoked by API Gateway
    // For HTTP API, construct the execution ARN manually
    const executionArn = cdk.Stack.of(this).formatArn({
      service: 'execute-api',
      resource: this.httpApi.apiId,
      resourceName: '*/*',
    })
    
    props.lambdaFunction.addPermission('AllowAPIGatewayInvoke', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: executionArn,
    })
  }
}

