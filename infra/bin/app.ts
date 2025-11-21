#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { HQMemesStack } from '../lib/hqmemes-stack'
import { CloudFrontCertificatesStack } from '../lib/stacks/cloudfront-certificates-stack'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { getConfig } from '../lib/config'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') })

const app = new cdk.App()
const config = getConfig()

// Get environment variables
const awsRegion = process.env.AWS_REGION || 'ca-central-1'
const awsAccountId = process.env.AWS_ACCOUNT_ID || process.env.CDK_DEFAULT_ACCOUNT
const projectName = process.env.PROJECT_NAME || 'hqmemes'
const environment = process.env.ENVIRONMENT || 'prod'

if (!awsAccountId) {
  throw new Error('AWS_ACCOUNT_ID must be set in .env file or CDK_DEFAULT_ACCOUNT environment variable')
}


console.log(`
 /$$   /$$  /$$$$$$          /$$      /$$ /$$$$$$$$ /$$      /$$ /$$$$$$$$
| $$  | $$ /$$__  $$        | $$$    /$$$| $$_____/| $$$    /$$$| $$_____/
| $$  | $$| $$  \ $$        | $$$$  /$$$$| $$      | $$$$  /$$$$| $$
| $$$$$$$$| $$  | $$ /$$$$$$| $$ $$/$$ $$| $$$$$   | $$ $$/$$ $$| $$$$$
| $$__  $$| $$  | $$|______/| $$  $$$| $$| $$__/   | $$  $$$| $$| $$__/
| $$  | $$| $$/$$ $$        | $$\  $ | $$| $$      | $$\  $ | $$| $$
| $$  | $$|  $$$$$$/        | $$ \/  | $$| $$$$$$$$| $$ \/  | $$| $$$$$$$$
|__/  |__/ \____ $$$        |__/     |__/|________/|__/     |__/|________/
                \__/
                `)

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

// Create the main stack
new HQMemesStack(app, `${projectName}-${environment}-stack`, {
  env: {
    account: awsAccountId,
    region: awsRegion,
  },
  description: `HQMemes ${environment} infrastructure`,
  tags: {
    Project: projectName,
    Environment: environment,
    ManagedBy: 'cdk',
  },
})

