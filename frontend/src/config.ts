/**
 * URL base del backend (sin "/" final ni "/api").
 * En Vercel se define con la variable de entorno VITE_API_URL del proyecto del frontend;
 * en desarrollo local, si no está definida, se usa el backend de uvicorn en el puerto 8000.
 * Vite la incrusta al compilar: si cambia, hay que volver a desplegar.
 */
export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");
