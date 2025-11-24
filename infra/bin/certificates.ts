#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { CloudFrontCertificatesStack } from '../lib/stacks/cloudfront-certificates-stack'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') })

const app = new cdk.App()

// Get environment variables
const awsRegion = 'us-east-1' // CloudFront certificates must be in us-east-1
const awsAccountId = process.env.AWS_ACCOUNT_ID || process.env.CDK_DEFAULT_ACCOUNT
const projectName = process.env.PROJECT_NAME || 'hqmemes'
const environment = process.env.ENVIRONMENT || 'prod'

if (!awsAccountId) {
  throw new Error('AWS_ACCOUNT_ID must be set in .env file or CDK_DEFAULT_ACCOUNT environment variable')
}

const frontendDomain = process.env.FRONTEND_DOMAIN
const assetsDomain = process.env.ASSETS_DOMAIN
const hostedZoneId = process.env.HOSTED_ZONE_ID

if (!frontendDomain || !assetsDomain || !hostedZoneId) {
  throw new Error('FRONTEND_DOMAIN, ASSETS_DOMAIN, and HOSTED_ZONE_ID must be set')
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

console.log(`🔐 Deploying CloudFront Certificates to us-east-1...`)

// Create certificates stack in us-east-1 (required for CloudFront)
new CloudFrontCertificatesStack(app, `${projectName}-${environment}-certificates-stack`, {
  env: {
    account: awsAccountId,
    region: awsRegion,
  },
  frontendDomain,
  assetsDomain,
  hostedZoneId,
  description: `${projectName} ${environment} CloudFront certificates (us-east-1)`,
  tags: {
    Project: projectName,
    Environment: environment,
    ManagedBy: 'cdk',
    Stack: 'certificates',
  },
})

app.synth()
