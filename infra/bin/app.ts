#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { HQMemesStack } from '../lib/hqmemes-stack'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') })

const app = new cdk.App()

// Get environment variables
const awsRegion = process.env.AWS_REGION || 'ca-central-1'
const awsAccountId = process.env.AWS_ACCOUNT_ID || process.env.CDK_DEFAULT_ACCOUNT
const projectName = process.env.PROJECT_NAME || 'hqmemes'
const environment = process.env.ENVIRONMENT || 'prod'

if (!awsAccountId) {
  throw new Error('AWS_ACCOUNT_ID must be set in .env file or CDK_DEFAULT_ACCOUNT environment variable')
}

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

