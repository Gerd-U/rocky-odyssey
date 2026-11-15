from pathlib import Path
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
    "Jezero": (18.4, 77.5),   # aproximado, confírmalo
    # "Segundo sitio de Marte": (lat, lon),
}

with rasterio.open(TIF) as src:
    print("Tipo:", src.dtypes[0], "| tamaño:", src.width, "x", src.height, "| nodata:", src.nodata)

    # Prueba de validación: el punto más bajo de Marte en este modelo (-32.84749, 62.20833) = -8201 m
    prueba = {lon0: elevacion(src, -32.84749, 62.20833, lon0) for lon0 in (0, 180)}
    print("Prueba del punto más bajo (esperado cerca de -8201 m):", prueba)
    lon0 = min(prueba, key=lambda k: abs(prueba[k] + 8201))
    if abs(prueba[lon0] + 8201) > 150:
        print("AVISO: ninguna convención de longitud coincide. No uses los resultados de abajo.")
    else:
        print("Convención de longitud detectada: centro en", lon0)

    for nombre, (lat, lon) in SITIOS.items():
        elev = np.array([elevacion(src, la, lo, lon0) for la, lo in nueve_puntos(lat, lon)])
        print(nombre, "| 9 elevaciones:", elev.round(0), "| rugosidad (m):", round(float(elev.std()), 1))