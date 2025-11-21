#!/usr/bin/env node
/**
 * Script to inject environment variables into the frontend build
 * This replaces static .env files with dynamic values from CDK outputs
 */
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load CDK outputs (if available) and .env
const cdkOutputsPath = path.join(__dirname, '../../cdk.out')
const envPath = path.join(__dirname, '../../.env')

// Load environment variables
dotenv.config({ path: envPath })

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

// Create .env file for frontend (single env file used for both dev and prod builds)
const frontendEnvPath = path.join(__dirname, '../../frontend/.env')
const envContent = Object.entries(frontendEnv)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n')

fs.writeFileSync(frontendEnvPath, envContent + '\n', 'utf-8')
console.log(`✅ Wrote frontend environment to ${frontendEnvPath}`)
console.log('\nFrontend environment variables:')
console.log(envContent)

