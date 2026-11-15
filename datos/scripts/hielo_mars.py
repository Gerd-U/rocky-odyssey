from pathlib import Path
import csv
import pandas as pd

BASE = Path(__file__).resolve().parent.parent
FECHA = "2026-11-15"   # cambia si lo asignaste otro día

ESCALA = ("Criterio propio, escala 0-100 de favorabilidad al hielo: "
          "0 sin evidencia; 25 estable solo en lugares muy locales; "
          "50 condiciones favorables mas evidencia indirecta; "
          "75 evidencia fuerte por teledeteccion; 100 deteccion directa")

ASIGNACION = {
    "Jezero": (0, "Hidrogeno bajo en latitudes bajas (Boynton et al. 2007), atribuido a minerales hidratados",
               "https://doi.org/10.1029/2007JE002887"),
    "Arcadia Planitia": (75, "Hielo en exceso por neutrones (Odyssey) y craters frescos con hielo en la region (Byrne et al. 2009)",
                         "https://arxiv.org/abs/1705.05556"),
}

ruta_t = BASE / "datos_limpios" / "targets_mars.csv"
t = pd.read_csv(ruta_t)
ruta_log = BASE / "sources_log_mars.csv"
texto = ruta_log.read_text(encoding="utf-8")
filas = []
for nombre, (valor, razon, url) in ASIGNACION.items():
    assert (t["nombre"] == nombre).any(), f"No encuentro '{nombre}'"
    t.loc[t["nombre"] == nombre, "hielo"] = valor
    if f"{nombre},hielo" not in texto:
        filas.append([nombre, "hielo", valor, f"{ESCALA}. {razon}", url, FECHA])

t.to_csv(ruta_t, index=False, encoding="utf-8")
if filas:
    with open(ruta_log, "a", newline="", encoding="utf-8") as f:
        if texto and not texto.endswith("\n"):
            f.write("\n")
        csv.writer(f).writerows(filas)
print("Listo")