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
que consume el frontend.

`/api/sites`, `/api/sites/{site_id}` y `/api/bases` aceptan `?lang=es|en` (por
defecto `en`; un valor no admitido también usa `en`). En `sites.json` y
`bases.json`, los campos `name`, `country`, `description` y `missions` son
objetos `{"es": ..., "en": ...}`, y la API los devuelve ya resueltos como texto.
`imageLicense` es un código: `public-domain` o el nombre de una licencia
Creative Commons (`CC BY-SA 3.0`), que se muestra tal cual. Los sitios sin foto
traen `image`, `imageAuthor` e `imageLicense` en `null`.

`data/sites.json` y `data/bases.json` no se editan a mano: los genera
`datos/scripts/generar_web.py` con los datos del equipo (ver "Actualizar los
datos"). Cada sitio trae sus métricas (`metrics`), la serie mensual de
temperatura (`monthlyTemp`), sus fuentes (`sources`) y, en `matches`, la base
más parecida de la Luna y la de Marte con su `score` (0 a 1), la cobertura y la
similitud de cada criterio.

## Actualizar los datos

Desde la raíz del repo, en este orden:

```powershell
python datos/scripts/metricas_tierra.py   # métricas de la Tierra -> datos/datos_limpios/tierra.csv
python datos/scripts/unir_objetivos.py    # bases de la Luna y Marte -> datos/datos_limpios/objetivos.csv
python datos/scripts/generar_web.py       # sites.json y bases.json (y los mocks del frontend)
```

`metricas_tierra.py` y `generar_web.py` solo usan la biblioteca estándar de
Python; `unir_objetivos.py` necesita pandas (`datos/requirements.txt`). Las
fórmulas están explicadas en `datos/METODOLOGIA.md` y las de similitud se
ajustan en `datos/scripts/similitud_config.py`.

## Cómo cargar datos de `locations.json`

Con `data/locations.json` vacío (`{"locations": []}`), `/api/sites` devuelve
exactamente lo que tiene `data/sites.json`. Para corregir un sitio sin volver a
generar los datos, agrega a `locations.json` un location cuyo `id` sea igual al
de `sites.json` (`atacama`, `valles-secos-mcmurdo`, `isla-devon`…). Si el `id`
no existe en `sites.json`, ese location se ignora.

El merge solo lee estos campos:

| Campo en `locations.json` | Campo en `/api/sites` |
| --- | --- |
| `coordinates.latitude` | `lat` |
| `coordinates.longitude` | `lng` |
| `temperature.minimum_c` | `metrics.tempMinC` |
| `temperature.maximum_c` | `metrics.tempMaxC` |
| `comparison.<mars\|moon>.score` (de 0 a 100) | `matches.<mars\|moon>.score` (de 0 a 1) |

El score solo se aplica si el sitio ya tiene una base emparejada en ese cuerpo.
Los campos que no mandes, o que mandes como `null`, se quedan con el valor de
`sites.json`. Si se aplica al menos uno, el sitio sale con `"dataSource": "real"`.

Ejemplo de estructura para `atacama` (los valores son solo para mostrar el
formato; sustitúyelos por datos con fuente):

```json
{
    "locations": [
        {
            "id": "atacama",
            "name": "Desierto de Atacama",
            "country": "Chile",
            "coordinates": { "latitude": 0.0, "longitude": 0.0 },
            "temperature": { "minimum_c": 0.0, "maximum_c": 0.0 },
            "comparison": {
                "mars": { "score": 0 }
            }
        }
    ]
}
```

Los registros de prueba que antes estaban en `locations.json` ahora viven en
`fixtures/test_locations.json` y solo los usan las pruebas.

Los siete grupos de entrada científica son `geology`, `topography`,
`temperature`, `ice_water`, `dust_atmosphere`, `habitability` y `subsurface`.
La similitud de cada criterio acepta un valor de 0 a 100 o `null` cuando todavía
no hay dato. No deben cargarse valores sin fuente científica.
