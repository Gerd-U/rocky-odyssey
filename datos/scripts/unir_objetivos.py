from pathlib import Path
import pandas as pd

BASE = Path(__file__).resolve().parent.parent
COLUMNAS = ["nombre", "cuerpo", "rugosidad", "rango_termico", "hielo"]

luna = pd.read_csv(BASE / "datos_limpios" / "targets_moon.csv")
marte = pd.read_csv(BASE / "datos_limpios" / "targets_mars.csv")

for nombre, d in (("targets_moon.csv", luna), ("targets_mars.csv", marte)):
    faltan = [c for c in COLUMNAS if c not in d.columns]
    assert not faltan, f"A {nombre} le faltan las columnas: {faltan}"

obj = pd.concat([luna[COLUMNAS], marte[COLUMNAS]], ignore_index=True)
obj["nombre"] = obj["nombre"].astype(str).str.strip()
obj["cuerpo"] = obj["cuerpo"].astype(str).str.strip().str.lower()

assert set(obj["cuerpo"]) == {"luna", "marte"}, f"Valores raros en 'cuerpo': {set(obj['cuerpo'])}"
assert not obj["nombre"].duplicated().any(), "Hay nombres repetidos"
print(obj["cuerpo"].value_counts().to_string())
assert (obj["cuerpo"].value_counts() >= 2).all(), "Cada cuerpo necesita al menos 2 objetivos"

# Aviso de casillas vacías
vacias = obj[COLUMNAS[2:]].isna()
if vacias.any().any():
    print("AVISO: casillas vacías:")
    for i, fila in vacias.iterrows():
        for col in COLUMNAS[2:]:
            if fila[col]:
                print("  -", obj.loc[i, "nombre"], "->", col)
else:
    print("Todas las casillas están llenas.")

obj.to_csv(BASE / "datos_limpios" / "objetivos.csv", index=False, encoding="utf-8")
print()
print(obj)