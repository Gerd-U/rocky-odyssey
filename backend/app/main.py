from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import locations
from app.routes import ranking

#crear aplicacion
app = FastAPI(
    title="Rocky Odyssey API",
    description="Sistema de comparacion de ubicaciones terrestres con Marte y la Luna",
    version="1.0.0"
)

#configuracion CORS para conectar el Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(locations.router)

app.include_router(ranking.router)

#Ruta principal
@app.get("/")
def home():
    return{
         "project": "Rocky Odyssey",
        "message": "Welcome to Rocky Odyssey API",
        "status": "online"
    }

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