/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true" para usar los JSON de src/data en lugar del backend */
  readonly VITE_USE_MOCK: string
  /** URL base del backend, p. ej. http://localhost:8000 */
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
