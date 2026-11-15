from pathlib import Path
import csv
import pandas as pd
import numpy as np
import rasterio
from rasterio.windows import Window

BASE = Path(__file__).resolve().parent.parent
TIF = BASE / "datos_crudos" / "Mars_MGS_MOLA_DEM_mosaic_global_463m.tif"
PPD = 128       # píxeles por grado del archivo
R = 3396.19     # km, radio de Marte
D = 5.5         # km, espaciado de la cuadrícula (el mismo que en la Luna y la Tierra)

def destino(lat, lon, dist_km, rumbo):
    la1, lo1 = np.radians(lat), np.radians(lon)
    d = dist_km / R
    la2 = np.arcsin(np.sin(la1) * np.cos(d) + np.cos(la1) * np.sin(d) * np.cos(rumbo))
    lo2 = lo1 + np.arctan2(np.sin(rumbo) * np.sin(d) * np.cos(la1),
                           np.cos(d) - np.sin(la1) * np.sin(la2))
    return np.degrees(la2), (np.degrees(lo2) + 180) % 360 - 180

def elevacion(src, lat, lon, lon0):
    # lon0 = longitud del centro del mapa (0 o 180)
    col = int(((lon - lon0 + 180) % 360) * PPD) % src.width
    row = min(max(int((90 - lat) * PPD), 0), src.height - 1)
    return float(src.read(1, window=Window(col, row, 1, 1))[0, 0])

def nueve_puntos(lat, lon):
    pts = []
    for dy in (-D, 0, D):
        for dx in (-D, 0, D):
            dist = (dx ** 2 + dy ** 2) ** 0.5
            pts.append(destino(lat, lon, dist, np.arctan2(dx, dy)))
    return pts

SITIOS = {
    "Jezero": (18.4, 77.5),
    "Arcadia Planitia": (47.0, 184.0),   # aproximado
}
resultados = {}

with rasterio.open(TIF) as src:
    print("Tipo:", src.dtypes[0], "| tamaño:", src.width, "x", src.height, "| nodata:", src.nodata)

    # Prueba de validación: el punto más bajo de Marte en este modelo = -8201 m
    prueba = {lon0: elevacion(src, -32.84749, 62.20833, lon0) for lon0 in (0, 180)}
    print("Prueba del punto más bajo (esperado cerca de -8201 m):", prueba)
    lon0 = min(prueba, key=lambda k: abs(prueba[k] + 8201))
    if abs(prueba[lon0] + 8201) > 150:
        raise SystemExit("AVISO: ninguna convención de longitud coincide. No se guarda nada.")
    print("Convención de longitud detectada: centro en", lon0)

    for nombre, (lat, lon) in SITIOS.items():
        elev = np.array([elevacion(src, la, lo, lon0) for la, lo in nueve_puntos(lat, lon)])
        rug = round(float(elev.std()), 1)
        resultados[nombre] = rug
        print(nombre, "| 9 elevaciones:", elev.round(0), "| rugosidad (m):", rug)

# ---- Guardar en datos_limpios/targets_mars.csv (conserva lo que ya haya) ----
ruta_t = BASE / "datos_limpios" / "targets_mars.csv"
columnas = ["nombre", "cuerpo", "rugosidad", "rango_termico", "hielo"]
filas = {}
if ruta_t.exists():
    for _, f in pd.read_csv(ruta_t).iterrows():
        filas[f["nombre"]] = f.to_dict()
for nombre, rug in resultados.items():
    fila = filas.get(nombre, {"nombre": nombre, "cuerpo": "marte", "rango_termico": None, "hielo": None})
    fila["rugosidad"] = rug
    filas[nombre] = fila
pd.DataFrame(list(filas.values()), columns=columnas).to_csv(ruta_t, index=False, encoding="utf-8")
print("Guardado en", ruta_t.name)

# ---- Fuente en datos/sources_log_mars.csv (sin duplicar) ----
CAPA = "Mars MGS MOLA DEM 463m (mosaico global USGS)"
URL = "https://astrogeology.usgs.gov/search/map/mars_mgs_mola_dem_463m"
FECHA = "2026-11-14"
ruta_log = BASE / "sources_log_mars.csv"
nuevo = not ruta_log.exists()
texto = "" if nuevo else ruta_log.read_text(encoding="utf-8")
with open(ruta_log, "a", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    if nuevo:
        w.writerow(["sitio", "variable", "valor", "capa", "url", "fecha_consulta"])
    elif texto and not texto.endswith("\n"):
        f.write("\n")
    for nombre, (lat, lon) in SITIOS.items():
        if f"{nombre},rugosidad" in texto:
            print("El log ya tiene", nombre, "; no se agregó otra fila.")
            continue
        capa = f"{CAPA}; 9 puntos (3x3, 5.5 km) centrados en ({lat}, {lon}) aprox."
        w.writerow([nombre, "rugosidad", resultados[nombre], capa, URL, FECHA])
print("Log listo:", ruta_log.name)