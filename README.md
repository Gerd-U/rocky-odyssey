# Rocky Odyssey

Web que busca lugares de la Tierra parecidos a las zonas donde se piensa poner bases en la Luna y en Marte. Es nuestro proyecto para el NASA Space Apps Challenge, en el reto *Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars*.

Antes de mandar gente o equipos a otro mundo, se ensaya aquí. El desierto de Atacama, los Valles Secos de McMurdo o la Isla Devon ya se usan para eso. La idea de Rocky Odyssey es medir ese parecido con datos reales y mostrarlo de forma que cualquiera lo entienda: eliges un lugar de la Tierra y ves al lado su gemelo en la Luna y en Marte.

## Qué tiene la web

- Dos globos 3D, uno de la Tierra y otro del destino (Luna o Marte). Al elegir un sitio, los dos giran hasta el lugar y su base gemela.
- 13 sitios de la Tierra y 11 bases candidatas: 6 en la Luna (Shackleton, Mare Tranquillitatis, Malapert Massif, Cabeus, Rimae Bode y Peary) y 5 en Marte (Jezero, Arcadia Planitia, Gale, Oxia Planum y Arsia Mons).
- Cada sitio tiene un gemelo en la Luna y otro en Marte, con su porcentaje de similitud y una tabla que compara temperatura, rango térmico y rugosidad de los dos lados.
- Fotos reales de cada lugar con licencia abierta. Los créditos están en el pie de la web.
- Español e inglés.

## De dónde salen los datos

Todo lo que muestra la web sale de `datos/`. No hay valores escritos a mano.

| Cuerpo | Temperatura | Rugosidad |
|---|---|---|
| Tierra | MODIS MOD11A2 v061 (temperatura del suelo de día y de noche, 2023), por NASA AppEEARS | ASTER GDEM ASTGTM v003, por NASA AppEEARS |
| Luna | LRO Diviner, mapas de temperatura mínima y máxima en Moon Trek | LOLA (CGI Moon Kit, 64 píxeles por grado) |
| Marte | Mars Climate Database v6.2, ciclo diario en 4 estaciones | MOLA (mosaico de 463 m) |

Cada valor de la Luna y Marte queda anotado con su fuente y fecha de consulta en `datos/sources_log_moon.csv` y `datos/sources_log_mars.csv`. Los de la Tierra están en `datos/sources_log_tierra.csv`.

## Cómo se calcula la similitud

Se comparan dos medidas que existen en los tres cuerpos:

- Rango térmico, la diferencia media entre el día y la noche. En la Tierra es el promedio de (día − noche) de 2023; en Marte, el promedio del ciclo diario en 4 estaciones; en la Luna, la diferencia entre la mínima y la máxima del ciclo lunar. Una diferencia de 1 °C es igual a una de 1 K, así que se comparan directo.
- Rugosidad, la desviación estándar de 9 elevaciones en una cuadrícula de 3 × 3 con unos 5,5 km entre puntos. Es el mismo método en la Tierra, la Luna y Marte.

Para cada medida se calcula `100 × menor / mayor`, y el porcentaje final es el promedio de las dos (con `calculate_score` de `backend/app/services/scoring.py`). La Luna y Marte se comparan por separado: el gemelo de un sitio en cada destino es la base con el porcentaje más alto.

El hielo no entra en el cálculo. En las 11 bases vale 0, así que solo premiaba a los sitios de la Tierra sin nieve sin decir nada del parecido.

Los porcentajes son provisionales y la web lo dice así. Hay dos límites que conocemos: MODIS mide la Tierra hacia las 10:30 y las 22:30, no en el momento más caliente ni en el más frío, y la Mars Climate Database da la temperatura del aire a 2 m del suelo, no la del suelo.

## Cómo está armado

```
datos/      datos crudos y limpios, sources_log y scripts de Python que los procesan
backend/    API en FastAPI que sirve los sitios y las bases (backend/data/*.json)
frontend/   web en React + Vite + Tailwind, con los globos de react-globe.gl
```

El recorrido de los datos es este:

```
datos/  ->  datos/scripts/generar_datos_web.py  ->  backend/data/*.json  ->  /api/sites y /api/bases  ->  web
```

`generar_datos_web.py` lee los datos, calcula las medidas de la Tierra y los gemelos, y escribe `locations.json`, `sites.json` y `bases.json`. Se puede correr las veces que haga falta: actualiza lo que ya existe sin duplicar nada y conserva las fotos.

## Correrlo en local

Hacen falta Python 3 y Node 20 o superior. La web pide todos los datos al backend, así que hay que levantar los dos.

Backend (desde `backend/`):

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\uvicorn.exe app.main:app --reload
```

La API queda en `http://127.0.0.1:8000` y su documentación interactiva en `/docs`.

Frontend (desde `frontend/`):

```bash
npm install
npm run dev
```

La web queda en `http://localhost:5173`. Si el backend está en otra dirección, se cambia `VITE_API_URL` en `frontend/.env`.

Para regenerar los datos de la web después de cambiar algo en `datos/` (desde la raíz):

```powershell
backend\.venv\Scripts\python.exe datos\scripts\generar_datos_web.py
```

Pruebas del backend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest
```

## Más documentación

- [backend/README.md](backend/README.md): entorno, API y pruebas.
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md): todos los endpoints.
- [frontend/README.md](frontend/README.md): rutas, componentes y cómo se cargan los datos.

## Créditos

Los datos son de la NASA (AppEEARS, LRO, MOLA), del USGS y del Laboratoire de Météorologie Dynamique (Mars Climate Database). Las fotos son de Wikimedia Commons, con dominio público o licencias Creative Commons; el autor y la licencia de cada una están en `frontend/src/data/credits.json` y en el pie de la web.
