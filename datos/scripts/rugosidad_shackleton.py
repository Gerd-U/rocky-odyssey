from pathlib import Path
import csv
import numpy as np
import pandas as pd

# La carpeta "datos" se calcula a partir de dónde está este script
BASE = Path(__file__).resolve().parent.parent
SITIO = "Shackleton (borde)"
CAPA = "LRO LOLA DEM, 87.5 deg v4, S Pole"
URL = "https://trek.nasa.gov/moon/#v=0.1&x=17324.577026367668&y=-4949.879150390865&z=7&p=urn%3Aogc%3Adef%3Acrs%3AIAU2000%3A%3A30120&d=&locale=&b=moon&e=-34047.14172363226%2C-29532.049255371297%2C68696.2957763676%2C19632.290954589567&sfz=&w="
FECHA = "2026-11-14"

extremos, centros = [], []
for a in ["eo", "ns", "diagA", "diagB"]:
    ruta = BASE / "datos_crudos" / f"shackleton_borde_{a}.csv"
    d = pd.read_csv(ruta)
    col = [c for c in d.columns if "87.5" in c][0]
    v = d[col].values
    assert not np.isnan(v).any(), f"Hay vacíos en {ruta.name}"
    extremos += [v[0], v[-1]]
    centros.append(v[len(v) // 2])

nueve = np.array([np.mean(centros)] + extremos)  # centro + 8 alrededor
rugosidad = round(float(nueve.std()), 1)         # ddof=0, igual que np.std
print("9 elevaciones:", nueve.round(0))
print("Rugosidad (m):", rugosidad)

# 1) Valor en targets_moon.csv
ruta_t = BASE / "datos_limpios" / "targets_moon.csv"
t = pd.read_csv(ruta_t)
t["nombre"] = t["nombre"].astype(str).str.strip()
assert (t["nombre"] == SITIO).any(), f"No encuentro la fila '{SITIO}'"
t.loc[t["nombre"] == SITIO, "rugosidad"] = rugosidad
t.to_csv(ruta_t, index=False, encoding="utf-8")

# 2) Fuente en el log (sin duplicar si ya existe)
ruta_log = BASE / "sources_log_moon.csv"
texto = ruta_log.read_text(encoding="utf-8")
if f"{SITIO},rugosidad" in texto:
    print("El log ya tiene esta fila; no se agregó otra.")
else:
    with open(ruta_log, "a", newline="", encoding="utf-8") as f:
        if texto and not texto.endswith("\n"):
            f.write("\n")
        csv.writer(f).writerow([SITIO, "rugosidad", rugosidad, CAPA, URL, FECHA])
    print("Fila agregada al log.")
  