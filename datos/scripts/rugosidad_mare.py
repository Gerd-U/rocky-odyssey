from pathlib import Path
import csv
import numpy as np
import pandas as pd

# datos/ = la carpeta que contiene scripts/, datos_crudos/ y datos_limpios/
BASE = Path(__file__).resolve().parent.parent

SITIO = "Pozo Mare Tranquillitatis"   # igual que en targets_moon.csv
CAPA = "LRO_LOLA_DEM_Global_128ppd_v04"   # capa global, no la polar de 87.5
PREFIJO = "Mare"                      # archivos: Mare_eo.csv, Mare_ns.csv, ...
URL = "https://trek.nasa.gov/moon/#v=0.1&x=31.931762099671268&y=8.924331498568433&z=6&p=urn%3Aogc%3Adef%3Acrs%3AEPSG%3A%3A104903&d=&l=LRO_LOLA_Shade_Global_128ppd_v04%2Ctrue%2C1&l=LRO_LOLA_DEM_Global_128ppd_v04%2Ctrue%2C1&locale=&b=moon&e=26.87255809248097%2C4.886855987944253%2C36.99096610686156%2C12.961807009192613&sfz=&w="
FECHA = "2026-11-14"

extremos, centros = [], []
for a in ["eo", "ns", "diagA", "diagB"]:
    ruta = BASE / "datos_crudos" / f"{PREFIJO}_{a}.csv"
    d = pd.read_csv(ruta)

    # Las primeras 3 columnas son X, Y, Distance; la capa global es una de las siguientes
    candidatas = [c for c in d.columns[3:] if "S Pole" not in c and "Endurance" not in c]
    assert candidatas, f"No encuentro la capa global en {ruta.name}. Columnas: {list(d.columns)}"
    col = candidatas[0]
    v = d[col].values
    assert not np.isnan(v).any(), f"Hay vacíos en {ruta.name} (columna {col})"

    print(f"{ruta.name} | columna: {col} | inicio {v[0]:.0f} | centro {v[len(v)//2]:.0f} | fin {v[-1]:.0f} | largo {d['Distance'].max():.0f} m")
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