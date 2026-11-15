
"""Este script hará cuatro cosas:
1. Leer los tres CSV.
2. Limpiar los valores que representan datos faltantes o inválidos.
3. Agrupar los resultados por ubicación y fecha.
4. Generar un JSON que pueda consumir el backend."""

import pandas as pd
import json
from pathlib import Path

# Ubicaciones de los archivos
BASE_DIR = Path(__file__).resolve().parents[2]

DATOS = BASE_DIR / "datos" / "datos_crudos"
SALIDA = BASE_DIR / "backend" / "data"

SALIDA.mkdir(parents=True, exist_ok=True)

# Leer archivos
temperatura = pd.read_csv(
    DATOS / "rocky-odyssey-tierra-MOD11A2-061-results.csv"
)

nieve = pd.read_csv(
    DATOS / "rocky-odyssey-tierra-MOD10A1-061-results.csv"
)

elevacion = pd.read_csv(
    DATOS / "rocky-odyssey-tierra-ASTGTM-NC-003-results.csv"
)

# -------------------------
# 1. TEMPERATURA
# -------------------------

col_dia = "MOD11A2_061_LST_Day_1km"
col_noche = "MOD11A2_061_LST_Night_1km"

temperatura["Date"] = pd.to_datetime(temperatura["Date"])

# Eliminar valores faltantes (0)
temperatura.loc[
    temperatura[col_dia] == 0, col_dia
] = float("nan")

temperatura.loc[
    temperatura[col_noche] == 0, col_noche
] = float("nan")

# Los valores del CSV están en Kelvin
# Convertir a grados Celsius
temperatura["temp_dia_c"] = temperatura[col_dia] - 273.15
temperatura["temp_noche_c"] = temperatura[col_noche] - 273.15

# Limitar al año 2023
temperatura = temperatura[
    temperatura["Date"].dt.year == 2023
]

# Agrupar por ubicación y fecha
temp_resumen = (
    temperatura.groupby(["Category", "Date"], as_index=False)
    .agg(
        temperatura_dia=("temp_dia_c", "mean"),
        temperatura_noche=("temp_noche_c", "mean")
    )
)

# -------------------------
# 2. COBERTURA DE NIEVE
# -------------------------

col_nieve = "MOD10A1_061_NDSI_Snow_Cover"

nieve["Date"] = pd.to_datetime(nieve["Date"])

# Solo conservar valores válidos de 0 a 100.
# Los valores superiores son códigos de calidad.
nieve = nieve[
    nieve[col_nieve].between(0, 100)
]

nieve = nieve[
    nieve["Date"].dt.year == 2023
]

nieve_resumen = (
    nieve.groupby(["Category", "Date"], as_index=False)
    .agg(
        ndsi_nieve=(col_nieve, "mean")
    )
)

# -------------------------
# 3. ELEVACIÓN
# -------------------------

col_elevacion = "ASTGTM_NC_003_ASTER_GDEM_DEM"

elevacion_resumen = (
    elevacion.groupby("Category", as_index=False)
    .agg(
        elevacion_metros=(col_elevacion, "mean")
    )
)

# -------------------------
# 4. UNIFICAR RESULTADOS
# -------------------------

resultado = []

sitios = sorted(
    set(temp_resumen["Category"])
    | set(nieve_resumen["Category"])
    | set(elevacion_resumen["Category"])
)

for sitio in sitios:

    temp = temp_resumen[
        temp_resumen["Category"] == sitio
    ]

    snow = nieve_resumen[
        nieve_resumen["Category"] == sitio
    ]

    elev = elevacion_resumen[
        elevacion_resumen["Category"] == sitio
    ]

    resultado.append({
        "ubicacion": sitio,

        "elevacion_metros": (
            None if elev.empty
            else float(elev.iloc[0]["elevacion_metros"])
        ),

        "temperaturas": [
            {
                "fecha": row["Date"].strftime("%Y-%m-%d"),
                "dia_c": (
                    None if pd.isna(row["temperatura_dia"])
                    else round(float(row["temperatura_dia"]), 2)
                ),
                "noche_c": (
                    None if pd.isna(row["temperatura_noche"])
                    else round(float(row["temperatura_noche"]), 2)
                )
            }
            for _, row in temp.iterrows()
        ],

        "nieve": [
            {
                "fecha": row["Date"].strftime("%Y-%m-%d"),
                "ndsi": round(float(row["ndsi_nieve"]), 2)
            }
            for _, row in snow.iterrows()
        ]
    })

# Exportar JSON
archivo = SALIDA / "tierra_resumen.json"

with open(archivo, "w", encoding="utf-8") as f:
    json.dump(resultado, f, ensure_ascii=False, indent=4)

print("Procesamiento completado.")
print("Ubicaciones:", len(resultado))
print("Archivo generado:", archivo)
