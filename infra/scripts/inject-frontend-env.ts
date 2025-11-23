#!/usr/bin/env node
/**
 * Script to inject environment variables into the frontend build
 * This replaces static .env files with dynamic values from CDK outputs
 */
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { execSync } from 'child_process'

// Load CDK outputs (if available) and .env
const cdkOutputsPath = path.join(__dirname, '../../cdk.out')
const envPath = path.join(__dirname, '../../.env')

// Load environment variables (try infra/.env first, then root .env)
const infraEnvPath = path.join(__dirname, '../.env')
if (fs.existsSync(infraEnvPath)) {
  dotenv.config({ path: infraEnvPath })
} else {
  dotenv.config({ path: envPath })
}

// Read CDK outputs if they exist
let cdkOutputs: Record<string, any> = {}
try {
  // CDK outputs are typically in cdk.out or exported via environment variables
  // For now, we'll use environment variables set after CDK deployment
} catch (error) {
  console.warn('CDK outputs not found, using environment variables only')
}

// Get values from environment or CDK outputs
const getValue = (key: string, defaultValue: string = ''): string => {
  return process.env[key] || cdkOutputs[key] || defaultValue
}


// Attempt to fetch stack outputs via AWS CLI if certain keys are missing
const fetchCognitoOutputsFromCloudFormation = (stackName: string, region = 'ca-central-1') => {
  try {
    const cmd = `aws cloudformation describe-stacks --stack-name ${stackName} --region ${region} --query "Stacks[0].Outputs" --output json`
    const out = execSync(cmd, { encoding: 'utf-8' }).trim()
    if (!out) return {}
    const outputs = JSON.parse(out) as Array<{ OutputKey: string; OutputValue: string }>
    const map: Record<string, string> = {}
    outputs.forEach(o => { map[o.OutputKey] = o.OutputValue })
    return map
  } catch (err) {
    console.warn('Could not fetch CloudFormation outputs:', (err as Error).message)
    return {}
  }
}

// Frontend environment variables
const frontendEnv = {
  VITE_API_URL: getValue('API_URL', `https://${process.env.API_DOMAIN || 'api-hqmemems.dev.gharbidev.com'}`),
  VITE_ASSETS_URL: getValue('ASSETS_URL', `https://${process.env.ASSETS_DOMAIN || 'assets-hqmemes.dev.gharbidev.com'}`),
  VITE_AWS_REGION: process.env.AWS_REGION || 'ca-central-1',
  VITE_USER_POOL_ID: getValue('COGNITO_USER_POOL_ID', ''),
  VITE_USER_POOL_CLIENT_ID: getValue('COGNITO_CLIENT_ID', ''),
  VITE_APP_NAME: process.env.VITE_APP_NAME || 'HQMemes',
  VITE_MAX_UPLOAD_SIZE: process.env.VITE_MAX_UPLOAD_SIZE || '10485760',
  VITE_MAX_FILES_PER_UPLOAD: process.env.VITE_MAX_FILES_PER_UPLOAD || '10',
  VITE_POLLING_INTERVAL: process.env.VITE_POLLING_INTERVAL || '5000',
}

// If Cognito values are missing, try CloudFormation (useful in CI when infra already deployed)
if ((!frontendEnv.VITE_USER_POOL_ID || !frontendEnv.VITE_USER_POOL_CLIENT_ID) && (process.env.PROJECT_NAME && process.env.ENVIRONMENT)) {
  const stackName = `${process.env.PROJECT_NAME}-${process.env.ENVIRONMENT}-stack`
  const region = process.env.AWS_REGION || 'ca-central-1'
  console.log(`Attempting to fetch Cognito outputs from CloudFormation stack ${stackName} in ${region}`)
  const cfOutputs = fetchCognitoOutputsFromCloudFormation(stackName, region)
  if (cfOutputs['CognitoUserPoolId'] && !frontendEnv.VITE_USER_POOL_ID) {
    frontendEnv.VITE_USER_POOL_ID = cfOutputs['CognitoUserPoolId']
  }
  if (cfOutputs['CognitoClientId'] && !frontendEnv.VITE_USER_POOL_CLIENT_ID) {
    frontendEnv.VITE_USER_POOL_CLIENT_ID = cfOutputs['CognitoClientId']
  }
}

// Create .env file for frontend (single env file used for both dev and prod builds)
const frontendEnvPath = path.join(__dirname, '../../frontend/.env')
const envContent = Object.entries(frontendEnv)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n')

fs.writeFileSync(frontendEnvPath, envContent + '\n', 'utf-8')
console.log(`✅ Wrote frontend environment to ${frontendEnvPath}`)
console.log('\nFrontend environment variables:')
console.log(envContent)

