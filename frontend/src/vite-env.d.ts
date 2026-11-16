/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base del backend, p. ej. http://localhost:8000 (ver src/config.ts). Opcional en local. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
