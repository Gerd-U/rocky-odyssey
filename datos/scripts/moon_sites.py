from pathlib import Path
import csv
import numpy as np
import pandas as pd
import rasterio
from rasterio.windows import Window

BASE = Path(__file__).resolve().parent.parent
FECHA = "2026-11-15"
TIF = BASE / "datos_crudos" / "ldem_64_uint.tif"
RUTA_T = BASE / "datos_limpios" / "targets_moon.csv"
RUTA_LOG = BASE / "sources_log_moon.csv"
PPD, R, D = 64, 1737.4, 5.5   # px/grado, radio lunar (km), espaciado de la cuadricula (km)

# (lat, lon) del centro. None = no recalcular rugosidad: se conserva la de targets_moon.csv
SITIOS = {
    "Shackleton (borde)": None,
    "Pozo Mare Tranquillitatis": (8.3, 33.2),
    "Malapert Massif": (-84.8, 12.3),
    "Cabeus": (-85.3, -41.8),          
    "Rimae Bode": (9.54, -3.22),      
    "Peary": (88.56, 25.7),            
}

# (tmin, tmax, rango leido de la capa) en kelvin
TEMPERATURAS = {
    "Cabeus": (36.9, 201.1, 164.2),
    "Malapert Massif": (50.0, 242.0, 192.0),
    "Rimae Bode": (93.6, 392.3, 298.7),
    "Peary": (37.3, 160.0, 122.8),
    "Pozo Mare Tranquillitatis": (93.9, 394.8, 300.9),   
    "Shackleton (borde)": (41.8, 91.1, 49.3),            # celda de 0.5 grados: domina el fondo en sombra
}
CAPA_T = ("Moon Trek (trek.nasa.gov/moon), capas LRO DLRE Bolometric Brightness Min y Max Temperatures, 0.5ppd. "
          "Celda de 0.5 grados (~15 km): promedia el terreno de la celda, no un punto")
URL_T = "https://trek.nasa.gov/moon/"

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
    return (float(dn) - 20000) * 0.5

def nueve_puntos(lat, lon):
    pts = []
    for dy in (-D, 0, D):
        for dx in (-D, 0, D):
            pts.append(destino(lat, lon, (dx ** 2 + dy ** 2) ** 0.5, np.arctan2(dx, dy)))
    return pts

# comprobaciones antes de tocar nada
for s, (mn, mx, r) in TEMPERATURAS.items():
    assert s in SITIOS, f"'{s}' esta en TEMPERATURAS pero no en SITIOS"
    assert mx > mn > 0, f"{s}: tmin={mn}, tmax={mx} (kelvin, tmax > tmin > 0)"
    assert abs((mx - mn) - r) <= 0.2, f"{s}: tmax - tmin = {mx - mn:.1f} pero el rango dice {r}. Revisa el dato."
for s in SITIOS:
    assert s in TEMPERATURAS, f"Faltan temperaturas de '{s}'"

viejo = pd.read_csv(RUTA_T) if RUTA_T.exists() else pd.DataFrame(columns=["nombre", "rugosidad", "hielo"])
viejo["nombre"] = viejo["nombre"].astype(str).str.strip()

def anterior(sitio, col):
    f = viejo.loc[viejo["nombre"] == sitio, col]
    return float(f.iloc[0]) if len(f) and pd.notna(f.iloc[0]) else None

filas_t, log_nuevo, reemplazar = [], [], set()
with rasterio.open(TIF) as src:
    for sitio, coord in SITIOS.items():
        mn, mx, _ = TEMPERATURAS[sitio]
        rango = round(mx - mn, 1)

        if coord is None:
            rug = anterior(sitio, "rugosidad")
            assert rug is not None, f"{sitio}: sin coordenadas y sin rugosidad previa"
            print(f"AVISO: {sitio} sin coordenadas; se conserva rugosidad {rug}")
            recalculada = False
        else:
            lat, lon = coord
            elev = np.array([elevacion(src, la, lo) for la, lo in nueve_puntos(lat, lon)])
            rug = round(float(elev.std()), 1)
            recalculada = True

        hielo = anterior(sitio, "hielo")   # el hielo lo llena hielo_luna_superficie.py

        print(f"{sitio}: rugosidad {rug} | tmin {mn} | tmax {mx} | rango {rango} | hielo {hielo}")
        filas_t.append({"nombre": sitio, "cuerpo": "luna", "rugosidad": rug,
                        "rango_termico": rango, "hielo": hielo})

        reemplazar |= {(sitio, "tmax_k"), (sitio, "tmin_k"), (sitio, "rango_termico")}
        log_nuevo += [
            [sitio, "tmax_k", mx, CAPA_T, URL_T, FECHA],
            [sitio, "tmin_k", mn, CAPA_T, URL_T, FECHA],
            [sitio, "rango_termico", rango, "tmax_k - tmin_k", URL_T, FECHA],
        ]
        if recalculada:
            reemplazar.add((sitio, "rugosidad"))
            log_nuevo.append([sitio, "rugosidad", rug,
                              f"CGI Moon Kit ldem_64_uint (LOLA, 64 ppd); 9 puntos (3x3, {D} km) centrados en ({lat}, {lon})",
                              "https://svs.gsfc.nasa.gov/4720", FECHA])

# respaldo y sobrescritura de targets
if RUTA_T.exists():
    RUTA_T.with_name("targets_moon_backup.csv").write_bytes(RUTA_T.read_bytes())
pd.DataFrame(filas_t).to_csv(RUTA_T, index=False, encoding="utf-8")

# log: reemplaza lo viejo; la rugosidad de Moon Trek se conserva como rugosidad_moontrek
with open(RUTA_LOG, newline="", encoding="utf-8") as f:
    filas = [r for r in csv.reader(f) if r]
encabezado, cuerpo = filas[0], filas[1:]
conservar = []
for r in cuerpo:
    s, v = r[0], r[1]
    if (s, v) in reemplazar:
        if v == "rugosidad" and "CGI Moon Kit" not in r[3]:
            conservar.append([s, "rugosidad_moontrek"] + r[2:])
        continue
    conservar.append(r)
with open(RUTA_LOG, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(encabezado)
    w.writerows(conservar + log_nuevo)
print("Listo: targets_moon.csv y sources_log_moon.csv actualizados (respaldo: targets_moon_backup.csv).")