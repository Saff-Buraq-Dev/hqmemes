#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { CloudFrontCertificatesStack } from '../lib/stacks/cloudfront-certificates-stack'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import { getConfig } from '../lib/config'

// Load environment variables
// The runtime path may differ between ts-node (infra/bin) and compiled JS (infra/lib/bin).
// Try multiple candidate locations and pick the first existing .env file.
const candidateEnvPaths = [
  path.join(__dirname, '../.env'),     // ts-node: infra/bin/../.env => infra/.env
  path.join(__dirname, '../../.env'),  // compiled: infra/lib/bin/../../.env => infra/.env
  path.join(process.cwd(), 'infra/.env'), // explicit fallback
]

let loadedEnv: string | undefined
for (const p of candidateEnvPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p })
    loadedEnv = p
    console.log(`Loaded environment from ${p}`)
    break
  }
}

if (!loadedEnv) {
  console.warn('No infra/.env file found in expected locations; continuing without loading .env')
}

const app = new cdk.App()
const config = getConfig()
const awsAccountId = config.awsAccountId || process.env.CDK_DEFAULT_ACCOUNT

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

