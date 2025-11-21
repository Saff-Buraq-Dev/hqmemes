#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { CloudFrontCertificatesStack } from '../lib/stacks/cloudfront-certificates-stack'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { getConfig } from '../lib/config'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') })

const app = new cdk.App()
const config = getConfig()
const awsAccountId = config.awsAccountId || process.env.CDK_DEFAULT_ACCOUNT

if (!awsAccountId) {
  throw new Error('AWS_ACCOUNT_ID must be set in .env file or CDK_DEFAULT_ACCOUNT environment variable')
}

// Create certificates stack in us-east-1 (required for CloudFront)
new CloudFrontCertificatesStack(app, `${config.projectName}-${config.environment}-certificates-stack`, {
  env: {
    account: awsAccountId,
    region: 'us-east-1', // CloudFront requires us-east-1
  },
  frontendDomain: config.frontendDomain,
  assetsDomain: config.assetsDomain,
  hostedZoneId: config.hostedZoneId,
  description: `HQMemes ${config.environment} CloudFront certificates (us-east-1)`,
  tags: {
    Project: config.projectName,
    Environment: config.environment,
    ManagedBy: 'cdk',
  },
})

