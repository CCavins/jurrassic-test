/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEBUG_AR?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
