# Rocky Odyssey - Backend (Python)

Aquí va el backend en **Python con FastAPI**. Todavía no está implementado: mientras tanto el frontend funciona con datos de prueba (`VITE_USE_MOCK=true`).

## Endpoints que debe exponer

| Método | Ruta              | Respuesta                    |
| ------ | ----------------- | ---------------------------- |
| GET    | `/api/sites`      | `Site[]`                     |
| GET    | `/api/sites/:id`  | `Site` (404 si no existe)    |
| GET    | `/api/bases`      | `Base[]`                     |

Las respuestas tienen que respetar exactamente los tipos definidos en
[`frontend/src/types/site.ts`](../frontend/src/types/site.ts) (mismos nombres de campo, en camelCase).
Los JSON de `frontend/src/data/*.mock.json` sirven como ejemplo de la forma esperada.

El frontend llama a `${VITE_API_URL}/api/...` (por defecto `http://localhost:8000`), así que hay que habilitar CORS para el origen del servidor de desarrollo de Vite (`http://localhost:5173`).
