import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# En local lee backend/.env (si existe). En Vercel las variables vienen del proyecto
# y no hay .env: load_dotenv no hace nada y no pisa las que ya existen.
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from app.routes import locations, ranking, comparison
from app.routes.frontend_data import router as frontend_data_router

#crear aplicacion
app = FastAPI(
    title="Rocky Odyssey API",
    description="Sistema de comparacion de ubicaciones terrestres con Marte y la Luna",
    version="1.0.0"
)
# Registrar rutas
app.include_router(frontend_data_router)

#configuracion CORS para conectar el Frontend
# ORIGENES: lista separada por comas, p. ej. "https://rocky-odyssey.vercel.app,http://localhost:5173"
ORIGENES = [
    origen.strip()
    for origen in os.getenv("ORIGENES", "http://localhost:5173").split(",")
    if origen.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGENES,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Caché en la CDN de Vercel para los datos de la web, que solo cambian al volver a desplegar
# (cada despliegue empieza con la caché vacía). Así la mayoría de visitas no despiertan la
# función y no esperan el arranque en frío. "Vary: Origin" guarda una copia por origen: sin él,
# una visita directa (sin cabecera Origin, sin permiso de CORS) podría quedar en caché y
# servirse a la web, que fallaría por CORS.
CDN_CACHE_PATHS = ("/api/sites", "/api/bases")
CDN_CACHE_CONTROL = "public, s-maxage=86400, stale-while-revalidate=604800"


@app.middleware("http")
async def cdn_cache(request, call_next):
    response = await call_next(request)
    if (
        request.method == "GET"
        and response.status_code == 200
        and request.url.path.startswith(CDN_CACHE_PATHS)
    ):
        response.headers["Cache-Control"] = CDN_CACHE_CONTROL
        response.headers["Vary"] = "Origin"
    return response


app.include_router(locations.router)

app.include_router(ranking.router)

app.include_router(comparison.router)

#Ruta principal
@app.get("/")
def home():
    return{
         "project": "Rocky Odyssey",
        "message": "Welcome to Rocky Odyssey API",
        "status": "online"
    }

#estado del servidor, para comprobar el despliegue
@app.get("/health")
def health():
    return {"ok": True}

#verificar funcionamiento del servidor
@app.get("/api/info")
def project_info():
    return{
        "name": "Rocky Odyssey",
        "targets": ["Mars", "Moon"],
        "comparison_variables": [
            "geology",
            "topography",
            "temperature",
            "ice_water",
            "dust_atmosphere",
            "habitability",
            "subsurface_caves"
        ]
    }