from pathlib import Path
import csv
import pandas as pd

BASE = Path(__file__).resolve().parent.parent
FECHA = "2026-11-15"   # cambia si lo asignas otro día

# --- Pozo de Mare Tranquillitatis: valores publicados (Williams et al. 2017) ---
TMAX = 392   # K, punto medio de 387-397. Si prefieres Vasavada, pon 385
TMIN = 95    # K
RANGO = TMAX - TMIN
URL_WILLIAMS = "https://doi.org/10.1016/j.icarus.2016.08.012"
URL_PAIGE = "https://doi.org/10.1126/science.1187726"

ESCALA = ("Criterio propio, escala 0-100 de favorabilidad al hielo: "
          "0 sin evidencia; 25 estable solo en lugares muy locales; "
          "50 condiciones favorables mas evidencia indirecta; "
          "75 evidencia fuerte por teledeteccion; 100 deteccion directa")

POZO = "Pozo Mare Tranquillitatis"
SHACK = "Shackleton (borde)"

ruta_t = BASE / "datos_limpios" / "targets_moon.csv"
t = pd.read_csv(ruta_t)
t["nombre"] = t["nombre"].astype(str).str.strip()
for n in (POZO, SHACK):
    assert (t["nombre"] == n).any(), f"No encuentro la fila '{n}'"

t.loc[t["nombre"] == POZO, "rango_termico"] = RANGO
t.loc[t["nombre"] == POZO, "hielo"] = 0
t.loc[t["nombre"] == SHACK, "hielo"] = 25
t.to_csv(ruta_t, index=False, encoding="utf-8")

filas = [
    [POZO, "tmax_k", TMAX, "Valor publicado (no leido de una capa): Williams et al. 2017, Icarus 283, 300-325; maximo ecuatorial 387-397 K, se usa el punto medio", URL_WILLIAMS, FECHA],
    [POZO, "tmin_k", TMIN, "Valor publicado: Williams et al. 2017; minimo ecuatorial antes del amanecer, unos 95 K", URL_WILLIAMS, FECHA],
    [POZO, "rango_termico", RANGO, "tmax_k - tmin_k", URL_WILLIAMS, FECHA],
    [POZO, "hielo", 0, ESCALA + ". Zona ecuatorial con maximas cercanas a 390 K, muy por encima del umbral de ~110 K de las trampas frias (Paige et al. 2010)", URL_PAIGE, FECHA],
    [SHACK, "hielo", 25, ESCALA + ". El borde esta iluminado gran parte de cada orbita, no es trampa fria; el piso vecino si lo es, pero su albedo no indica hielo expuesto en superficie (Zuber et al. 2012, Nature; verificar)", URL_PAIGE, FECHA],
]

ruta_log = BASE / "sources_log_moon.csv"
texto = ruta_log.read_text(encoding="utf-8")
nuevas = [f for f in filas if f"{f[0]},{f[1]}," not in texto]
if nuevas:
    with open(ruta_log, "a", newline="", encoding="utf-8") as f:
        if texto and not texto.endswith("\n"):
            f.write("\n")
        csv.writer(f).writerows(nuevas)
print("Filas nuevas en el log:", len(nuevas))
print(t)