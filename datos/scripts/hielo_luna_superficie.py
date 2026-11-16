from pathlib import Path
import csv
import pandas as pd

BASE = Path(__file__).resolve().parent.parent
FECHA = "2026-11-15"
RUTA_T = BASE / "datos_limpios" / "targets_moon.csv"
RUTA_LOG = BASE / "sources_log_moon.csv"
URL = "https://doi.org/10.1073/pnas.1802345115"

# Pon 3.5 solo a un sitio que hayas verificado como trampa fria (tmax < 110 K). Ejemplo: {"Cabeus": 3.5}
HIELO_ESPECIAL = {}

NOTA = ("Criterio propio equivalente a cobertura de hielo (%), como MOD10A1 en la Tierra: "
        "0 si el sitio no es trampa fria (tmax anual >= 110 K); 3.5 si lo es "
        "(Li et al. 2018, ~3.5% de las trampas frias con hielo expuesto)")

t = pd.read_csv(RUTA_T)
t["nombre"] = t["nombre"].astype(str).str.strip()
RUTA_T.with_name("targets_moon_backup_hielo.csv").write_bytes(RUTA_T.read_bytes())
t["hielo"] = [HIELO_ESPECIAL.get(n, 0.0) for n in t["nombre"]]
t.to_csv(RUTA_T, index=False, encoding="utf-8")
print(t)

with open(RUTA_LOG, newline="", encoding="utf-8") as f:
    filas = [r for r in csv.reader(f) if r]
cabecera = filas[0]
cuerpo = [r for r in filas[1:] if len(r) > 1 and r[1].strip() != "hielo"]
nuevas = [[n, "hielo", HIELO_ESPECIAL.get(n, 0.0), NOTA, URL, FECHA] for n in t["nombre"]]
with open(RUTA_LOG, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(cabecera)
    w.writerows(cuerpo + nuevas)
print("Log actualizado:", len(nuevas), "filas de hielo")