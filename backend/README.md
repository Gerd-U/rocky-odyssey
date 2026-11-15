# Rocky Odyssey — backend

API en Python con FastAPI. Conserva los datos de ubicaciones en JSON y calcula
comparaciones y rankings usando los datos que proporciona el equipo. Los datos
científicos pendientes se mantienen vacíos o no disponibles hasta recibir sus
fuentes; este backend no los completa ni los estima.

## Preparar el entorno

Desde PowerShell en esta carpeta:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
```

## Ejecutar la API

Desde `backend/`, con `.venv` instalado:

```powershell
.\.venv\Scripts\uvicorn.exe app.main:app --reload
```

La API usa `http://127.0.0.1:8000`; la documentación interactiva queda en
`/docs`. CORS permite peticiones del frontend local y no habilita credenciales.

## Ejecutar pruebas

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

Las dependencias de ejecución están en `requirements.txt`; las de pruebas, en
`requirements-dev.txt`.

## Endpoints

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/` | Estado básico de la API |
| GET | `/api/info` | Metadatos del proyecto y criterios admitidos |
| GET | `/api/sites` | Lista con el contrato camelCase del frontend |
| GET | `/api/sites/{site_id}` | Un sitio por ID; 404 si no existe |
| GET | `/api/bases` | Bases del frontend |
| GET | `/api/locations/` | Lista filtrable de ubicaciones científicas |
| GET | `/api/locations/{location_id}` | Ubicación por ID |
| POST | `/api/locations/` | Crear ubicación validada |
| PUT | `/api/locations/{location_id}` | Actualizar ubicación |
| DELETE | `/api/locations/{location_id}` | Eliminar ubicación |
| GET | `/api/locations/{location_id}/quality` | Calidad, cobertura y estado de fuentes |
| POST | `/api/comparison/{location_id}` | Calcular y guardar comparación con Marte y Luna |
| GET | `/api/ranking/?target=mars&sort_by=priority` | Ranking por prioridad o similitud |

`GET /api/sites` y `GET /api/bases` devuelven los tipos `Site[]` y `Base[]`
que consume el frontend. Las estructuras de referencia son los archivos JSON
ya existentes en `data/`; las comparaciones guardadas en `locations.json`
pueden completar campos compatibles cuando coinciden por ID.

Los siete grupos de entrada científica son `geology`, `topography`,
`temperature`, `ice_water`, `dust_atmosphere`, `habitability` y `subsurface`.
La similitud de cada criterio acepta un valor de 0 a 100 o `null` cuando todavía
no hay dato. No deben cargarse valores sin fuente científica.
