# Rocky Odyssey — API Documentation

## 1. Información general

**Backend:** FastAPI  
**Base URL local:** `http://127.0.0.1:8000`  
**Documentación interactiva:** `http://127.0.0.1:8000/docs`  
**Formato de intercambio:** JSON

La API permite consultar ubicaciones, registrar sitios, comparar sus características con Marte y la Luna, y consultar rankings y calidad de datos.

## 2. Endpoints disponibles

### Ubicaciones

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/locations/` | Obtener ubicaciones |
| GET | `/api/locations/{location_id}` | Consultar una ubicación |
| POST | `/api/locations/` | Registrar ubicación |
| PUT | `/api/locations/{location_id}` | Actualizar ubicación |
| DELETE | `/api/locations/{location_id}` | Eliminar ubicación |
| GET | `/api/locations/{location_id}/quality` | Consultar calidad de datos |

### Ranking

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/ranking/` | Obtener ranking de ubicaciones |

Parámetros:

- `target`: `mars` o `moon`.
- `sort_by`: `priority` o `score`.

Ejemplo:

`GET /api/ranking/?target=mars&sort_by=priority`

### Comparaciones

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/comparison/{location_id}` | Calcular y guardar comparación |

## 3. Consultar ubicaciones

**GET** `/api/locations/`

Parámetros opcionales:

- `country`: filtrar por país.
- `research_level`: nivel de investigación.
- `name`: buscar por nombre.
- `target`: filtrar por `mars` o `moon`.
- `sort_by`: `asc` o `desc` (requiere target).

Ejemplo:

`GET /api/locations/?target=mars&sort_by=desc`

La respuesta contiene:

- `total`
- `filters`
- `locations`

## 4. Registrar una ubicación

**POST** `/api/locations/`

Ejemplo de JSON:

```json
{
  "id": "site-001",
  "name": "Example Location",
  "country": "Costa Rica",
  "coordinates": {
    "latitude": 10,
    "longitude": -84
  },
  "geology": {
    "composition": "Volcanic rock",
    "rock_types": ["Basalt"],
    "minerals": ["Olivine"]
  },
  "research_level": "low",
  "sources": [
    {
      "name": "NASA",
      "organization": "NASA",
      "url": "https://www.nasa.gov",
      "criteria_supported": ["geology"],
      "accessed_at": "2026-11-14"
    }
  ]
}
```

Los demás criterios científicos pueden incluirse según el modelo `Location`.

Las fuentes son opcionales, pero si se proporcionan deben superar la validación de estructura.

## 5. Consultar calidad de datos

**GET** `/api/locations/{location_id}/quality`

Ejemplo:

`GET /api/locations/test-001/quality`

La respuesta incluye:

- `data_validation`: validación de los siete criterios.
- `sources_validation`: validación de las fuentes.
- `ready_for_comparison`: indicador de preparación según las validaciones actuales.

Importante: la validación de fuentes comprueba su estructura y formato, no su autenticidad ni credibilidad científica.

## 6. Consultar ranking

**GET** `/api/ranking/?target=mars&sort_by=priority`

El ranking devuelve información como:

- `location_id`
- `location_name`
- `country`
- `coordinates`
- `similarity_score`
- `research_score`
- `coverage_score`
- `priority_score`
- `rank`

También se puede consultar el ranking de la Luna:

`GET /api/ranking/?target=moon&sort_by=priority`

## 7. Comparar una ubicación

**POST** `/api/comparison/{location_id}`

Ejemplo:

`POST /api/comparison/test-001`

JSON:

```json
{
  "mars_similarities": {
    "geology": 85,
    "topography": 90,
    "temperature": 75,
    "ice_water": 80,
    "dust_atmosphere": 70,
    "habitability": 65,
    "subsurface": 88
  },
  "moon_similarities": {
    "geology": 70,
    "topography": 75,
    "temperature": 80,
    "ice_water": 85,
    "dust_atmosphere": 60,
    "habitability": 55,
    "subsurface": 78
  }
}
```

Los valores de similitud deben estar entre 0 y 100. Los criterios sin información pueden enviarse como `null`.

## 8. Integración con React

Ejemplo de consulta desde JavaScript:

```javascript
const API_URL = "http://127.0.0.1:8000";

async function getLocations() {
    try {
        const response = await fetch(
            `${API_URL}/api/locations/`
        );

        if (!response.ok) {
            throw new Error("Error al consultar ubicaciones");
        }

        const data = await response.json();

        return data.locations;

    } catch (error) {
        console.error(error);
        return [];
    }
}
```

Ejemplo de uso:

```javascript
useEffect(() => {
    getLocations().then(setLocations);
}, []);
```

## 9. Códigos de respuesta

| Código | Significado |
|---|---|
| 200 | Solicitud exitosa |
| 404 | Ubicación no encontrada |
| 409 | ID de ubicación duplicado |
| 422 | Datos o fuentes inválidas |
| 500 | Error interno del servidor |

## 10. Consideraciones para el frontend

- Las coordenadas se expresan en latitud y longitud.
- Los scores se expresan de 0 a 100.
- Los objetivos de comparación son `mars` y `moon`.
- Los niveles de investigación utilizados son `low`, `medium` y `high`.
- Los criterios científicos son `geology`, `topography`, `temperature`, `ice_water`, `dust_atmosphere`, `habitability` y `subsurface`.
- Los datos deben mostrarse según la información realmente disponible.
- No asumir que una ubicación tiene información completa si existen criterios faltantes.

**Nota:** Esta documentación describe las rutas y estructuras implementadas hasta ahora. Conviene verificar los esquemas definitivos en `/docs` antes de integrar cada funcionalidad.