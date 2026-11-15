from pathlib import Path
import numpy as np
import rasterio
from rasterio.windows import Window

BASE = Path(__file__).resolve().parent.parent
TIF = BASE / "datos_crudos" / "ldem_64_uint.tif"  
PPD = 64        # píxeles por grado del archivo
R = 1737.4      # km, radio de referencia de la Luna
D = 5.5         # km, espaciado de la cuadrícula (confirma el de la Tierra)

def destino(lat, lon, dist_km, rumbo):
    la1, lo1 = np.radians(lat), np.radians(lon)
    d = dist_km / R
    la2 = np.arcsin(np.sin(la1) * np.cos(d) + np.cos(la1) * np.sin(d) * np.cos(rumbo))
    lo2 = lo1 + np.arctan2(np.sin(rumbo) * np.sin(d) * np.cos(la1),
                           np.cos(d) - np.sin(la1) * np.sin(la2))
    return np.degrees(la2), (np.degrees(lo2) + 180) % 360 - 180

def elevacion(src, lat, lon):
    col = int(((lon + 180) % 360) * PPD) % src.width
    row = min(max(int((90 - lat) * PPD), 0), src.height - 1)
    dn = src.read(1, window=Window(col, row, 1, 1))[0, 0]
    return (float(dn) - 20000) * 0.5   # metros

def nueve_puntos(lat, lon):
    pts = []
    for dy in (-D, 0, D):
        for dx in (-D, 0, D):
            dist = (dx ** 2 + dy ** 2) ** 0.5
            pts.append(destino(lat, lon, dist, np.arctan2(dx, dy)))
    return pts

SITIOS = {
    "Pozo Mare Tranquillitatis": (8.3, 33.2),   # aproximado, confírmalo
    # "Shackleton (borde)": (lat, lon),         # agrégalo cuando tengas las coordenadas del centro
}

with rasterio.open(TIF) as src:
    m = src.read(1, out_shape=(src.height // 20, src.width // 20)).astype(float)
    print("Rango aproximado del mapa (m):", (m.min() - 20000) * 0.5, "a", (m.max() - 20000) * 0.5)
    for nombre, (lat, lon) in SITIOS.items():
        elev = np.array([elevacion(src, la, lo) for la, lo in nueve_puntos(lat, lon)])
        print(nombre, "| 9 elevaciones:", elev.round(0), "| rugosidad (m):", round(float(elev.std()), 1))