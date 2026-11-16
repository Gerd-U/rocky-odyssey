# Rocky Odyssey

A website that finds places on Earth that resemble the areas being considered for bases on the Moon and Mars. It is our project for the NASA Space Apps Challenge, for the challenge *Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars*.

Before people or equipment are sent to another world, they rehearse here. The Atacama Desert, the McMurdo Dry Valleys and Devon Island are already used for that. Rocky Odyssey measures that resemblance with real data and shows it in a way anyone can follow: you pick a place on Earth and see its twin on the Moon and on Mars right next to it.

## What the website has

- Two 3D globes, one of Earth and one of the destination (Moon or Mars). When you pick a site, both globes turn to the place and its twin base.
- 13 sites on Earth and 11 candidate bases: 6 on the Moon (Shackleton, Mare Tranquillitatis, Malapert Massif, Cabeus, Rimae Bode and Peary) and 5 on Mars (Jezero, Arcadia Planitia, Gale, Oxia Planum and Arsia Mons).
- Every site has a twin on the Moon and another on Mars, with its similarity percentage and a table that compares temperature, thermal range and roughness on both sides.
- Real, openly licensed photos of every place. The credits are in the website footer.
- Spanish and English.

## Where the data comes from

Everything the website shows comes from `datos/`. There are no hand-written values.

| Body | Temperature | Roughness |
|---|---|---|
| Earth | MODIS MOD11A2 v061 (day and night land surface temperature, 2023), via NASA AppEEARS | ASTER GDEM ASTGTM v003, via NASA AppEEARS |
| Moon | LRO Diviner, minimum and maximum temperature maps in Moon Trek | LOLA (CGI Moon Kit, 64 pixels per degree) |
| Mars | Mars Climate Database v6.2, daily cycle in 4 seasons | MOLA (463 m mosaic) |

Every Moon and Mars value is logged with its source and access date in `datos/sources_log_moon.csv` and `datos/sources_log_mars.csv`. The Earth values are in `datos/sources_log_tierra.csv`.

## How similarity is calculated

We compare two measurements that exist on all three bodies:

- Thermal range, the average difference between day and night. On Earth it is the mean of (day − night) over 2023; on Mars, the mean of the daily cycle across 4 seasons; on the Moon, the difference between the minimum and maximum of the lunar cycle. A difference of 1 °C equals a difference of 1 K, so they are compared directly.
- Roughness, the standard deviation of 9 elevations on a 3 × 3 grid with about 5.5 km between points. It is the same method on Earth, the Moon and Mars.

For each measurement we calculate `100 × smaller / larger`, and the final percentage is the average of the two (using `calculate_score` from `backend/app/services/scoring.py`). The Moon and Mars are compared separately: a site's twin on each destination is the base with the highest percentage.

Ice is not part of the calculation. It is 0 at all 11 bases, so it only rewarded Earth sites without snow without saying anything about the resemblance.

The percentages are provisional, and the website says so. There are two limits we know about: MODIS measures Earth around 10:30 and 22:30, not at the hottest or coldest moment, and the Mars Climate Database gives the air temperature 2 m above the ground, not the ground temperature.

## How it is put together

```
datos/      raw and clean data, source logs and the Python scripts that process them
backend/    FastAPI API that serves the sites and bases (backend/data)
frontend/   React + Vite + Tailwind website, with globes from react-globe.gl
```

This is the path the data follows:

```
datos/  ->  datos/scripts/generar_datos_web.py  ->  backend/data/  ->  /api/sites and /api/bases  ->  website
```

`generar_datos_web.py` reads the data, calculates the Earth measurements and the twins, and writes `locations.json`, `sites.json` and `bases.json`. It also copies the Moon and Mars source logs into `backend/data/`, so the backend does not depend on anything outside its folder. You can run it as many times as you need: it updates what already exists without duplicating anything and keeps the photos.

## Running it locally

You need Python 3 and Node 20 or later. The website asks the backend for all of its data, so both have to be running.

Backend (from `backend/`):

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\uvicorn.exe app.main:app --reload
```

The API runs at `http://127.0.0.1:8000`, with interactive documentation at `/docs` and a health check at `/health`.

Frontend (from `frontend/`):

```bash
npm install
npm run dev
```

The website runs at `http://localhost:5173`. If the backend is somewhere else, change `VITE_API_URL` in `frontend/.env`.

To regenerate the website data after changing something in `datos/` (from the repository root):

```powershell
backend\.venv\Scripts\python.exe datos\scripts\generar_datos_web.py
```

Backend tests:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest
```

## Deployment

The frontend and the backend are deployed on Vercel as two separate projects, one with Root Directory `frontend` and the other with Root Directory `backend`. Each project needs one environment variable:

| Project | Variable | Value |
|---|---|---|
| frontend | `VITE_API_URL` | URL of the backend project, without a trailing `/` |
| backend | `ORIGENES` | URL of the frontend project (comma-separated if there are several) |

The examples are in `frontend/.env.example` and `backend/.env.example`. On Vercel the backend runs on a read-only file system, so the routes that save locations (`POST`, `PUT` and `DELETE` on `/api/locations`, and `POST /api/comparisons/{id}`) only work locally. The website does not use them.

## More documentation

- [backend/README.md](backend/README.md): environment, API and tests.
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md): all the endpoints.
- [frontend/README.md](frontend/README.md): routes, components and how the data is loaded.

## Team

- Migdale Badilla Campos
- Keilyn Morera Vargas
- Michelle Arrieta Zamora
- Gerald José Urbina Quesada
