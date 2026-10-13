/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_WS_URL?: string
  readonly SUPABASE_URL: string
  readonly SUPABASE_ANON_KEY: string
  readonly AUTH_DOMAIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

