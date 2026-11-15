from pathlib import Path
import csv
import pandas as pd

BASE = Path(__file__).resolve().parent.parent
FECHA = "2026-11-15"
RUTA_T = BASE / "datos_limpios" / "targets_mars.csv"
RUTA_LOG = BASE / "sources_log_mars.csv"
URL = "https://www-mars.lmd.jussieu.fr/mcd_python/"
NOTA = ("Criterio propio equivalente a cobertura de hielo en superficie (%), igual que MOD10A1 en la Tierra: "
        "0 si no hay hielo ni escarcha de agua documentado en la superficie del sitio. "
        "El hielo somero de Marte esta enterrado y no cuenta en esta medida")

t = pd.read_csv(RUTA_T)
t["hielo"] = 0.0
t.to_csv(RUTA_T, index=False, encoding="utf-8")

with open(RUTA_LOG, newline="", encoding="utf-8") as f:
    filas = [r for r in csv.reader(f) if r]
cabecera = filas[0]
cuerpo = [r for r in filas[1:] if r[1].strip() != "hielo"]
nuevas = [[n, "hielo", 0.0, NOTA, URL, FECHA] for n in t["nombre"]]
with open(RUTA_LOG, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(cabecera)
    w.writerows(cuerpo + nuevas)
print(t)