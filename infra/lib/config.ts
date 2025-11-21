import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') })

export interface Config {
  // AWS Configuration
  awsRegion: string
  awsAccountId: string
  projectName: string
  environment: string

  // Domain Configuration
  domainName: string
  hostedZoneId: string
  frontendDomain: string
  assetsDomain: string
  apiDomain: string

  // Frontend Environment Variables
  viteAppName: string
  viteMaxUploadSize: string
  viteMaxFilesPerUpload: string
  vitePollingInterval: string
}

export function getConfig(): Config {
  const config: Config = {
    awsRegion: process.env.AWS_REGION || 'ca-central-1',
    awsAccountId: process.env.AWS_ACCOUNT_ID || '',
    projectName: process.env.PROJECT_NAME || 'hqmemes',
    environment: process.env.ENVIRONMENT || 'prod',

    domainName: process.env.DOMAIN_NAME || '',
    hostedZoneId: process.env.HOSTED_ZONE_ID || '',
    frontendDomain: process.env.FRONTEND_DOMAIN || '',
    assetsDomain: process.env.ASSETS_DOMAIN || '',
    apiDomain: process.env.API_DOMAIN || '',

    viteAppName: process.env.VITE_APP_NAME || 'HQMemes',
    viteMaxUploadSize: process.env.VITE_MAX_UPLOAD_SIZE || '10485760',
    viteMaxFilesPerUpload: process.env.VITE_MAX_FILES_PER_UPLOAD || '10',
    vitePollingInterval: process.env.VITE_POLLING_INTERVAL || '5000',
  }

  // Validate required fields
  const requiredFields: (keyof Config)[] = [
    'awsAccountId',
    'domainName',
    'hostedZoneId',
    'frontendDomain',
    'assetsDomain',
    'apiDomain',
  ]

  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`Missing required environment variable: ${field.toUpperCase()}`)
    }
  }

  return config
}

