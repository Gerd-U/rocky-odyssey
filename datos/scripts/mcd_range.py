from pathlib import Path
import re

BASE = Path(__file__).resolve().parent.parent
por_sitio = {}   # sitio -> lista de (minima, maxima), una por estación

for f in sorted((BASE / "datos_crudos").glob("mcd_*.txt")):
    sitio = f.stem.split("_")[1]
    ls, var, bloques = "?", None, {}
    for linea in f.read_text(encoding="utf-8").splitlines():
        if linea.startswith("###"):
            m = re.search(r"Ls ([\d.]+)\s*deg", linea)
            if m:
                ls = m.group(1)
            m = re.search(r"Column 2 is (.+)", linea)
            if m:                              # cualquier variable abre un bloque nuevo
                var = m.group(1).strip()
                bloques[var] = []
        elif var is not None:
            partes = linea.split()
            if len(partes) == 2:
                try:
                    bloques[var].append(float(partes[1]))
                except ValueError:
                    pass

    for var, v in bloques.items():
        if not v:
            continue
        print(f"{f.name} | Ls {ls} | {var}: min {min(v):.1f}, max {max(v):.1f}")
        if var.startswith("Temperature"):
            if min(v) <= 0:
                print("   AVISO: hay un valor <= 0 en la temperatura; revisa el archivo")
            por_sitio.setdefault(sitio, []).append((min(v), max(v)))

print()
for sitio, lista in por_sitio.items():
    tmax = sum(mx for mn, mx in lista) / len(lista)
    tmin = sum(mn for mn, mx in lista) / len(lista)
    print(f"{sitio}: tmax_k {tmax:.1f} | tmin_k {tmin:.1f} | rango_termico {tmax - tmin:.1f} K ({len(lista)} estaciones)")

    # ---------- Guardar en targets_mars.csv y en el log ----------
import csv
import pandas as pd

NOMBRES = {"jezero": "Jezero", "arcadia": "Arcadia Planitia", "gale": "Gale",
           "oxia": "Oxia Planum", "hellas": "Hellas Planitia", "arsia": "Arsia Mons"}
COORDS = {"jezero": "18.4 N, 77.5 E", "arcadia": "47.0 N, 184.0 E", "gale": "4.6 S, 137.4 E",
          "oxia": "18.2 N, 335.4 E", "hellas": "42.4 S, 70.5 E", "arsia": "8.3 S, 239.9 E"}
FECHA = "2026-11-15"  
URL = "https://www-mars.lmd.jussieu.fr/mcd_python/"
VERSION_MCD = "v6.2"

ruta_t = BASE / "datos_limpios" / "targets_mars.csv"
t = pd.read_csv(ruta_t)
ruta_log = BASE / "sources_log_mars.csv"
texto = ruta_log.read_text(encoding="utf-8")

filas_log = []
for sitio, lista in por_sitio.items():
    nombre = NOMBRES[sitio]
    tmax = round(sum(mx for mn, mx in lista) / len(lista), 1)
    tmin = round(sum(mn for mn, mx in lista) / len(lista), 1)
    rango = round(tmax - tmin, 1)
    assert (t["nombre"] == nombre).any(), f"No encuentro '{nombre}' en targets_mars.csv"
    t.loc[t["nombre"] == nombre, "rango_termico"] = rango
    capa = (f"Mars Climate Database {VERSION_MCD}; Temperature (K) a 2 m sobre la superficie; "
            f"Ls 0, 90, 180, 270; hora local: all; escenario de polvo: climatology ave solar; "
            f"topografía de alta resolución; punto {COORDS[sitio]}")
    for var, val, nota in [("tmax_k", tmax, "promedio de las 4 máximas diarias"),
                           ("tmin_k", tmin, "promedio de las 4 mínimas diarias"),
                           ("rango_termico", rango, "tmax_k - tmin_k")]:
        if f"{nombre},{var}" in texto:
            print("El log ya tiene", nombre, var, "; no se agregó.")
            continue
        filas_log.append([nombre, var, val, f"{capa}. {nota}", URL, FECHA])

t.to_csv(ruta_t, index=False, encoding="utf-8")
if filas_log:
    with open(ruta_log, "a", newline="", encoding="utf-8") as f:
        if texto and not texto.endswith("\n"):
            f.write("\n")
        csv.writer(f).writerows(filas_log)
print("Guardado: targets_mars.csv y sources_log_mars.csv")