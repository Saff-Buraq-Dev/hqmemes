/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_ASSETS_URL: string
  readonly VITE_AWS_REGION: string
  readonly VITE_USER_POOL_ID: string
  readonly VITE_USER_POOL_CLIENT_ID: string
  readonly VITE_APP_NAME: string
  readonly VITE_MAX_UPLOAD_SIZE: string
  readonly VITE_MAX_FILES_PER_UPLOAD: string
  readonly VITE_POLLING_INTERVAL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

