#Genera la grilla de puntos 3 X 3 con las coordenadas y nomenclatura que subes a AppEEARS

import pandas as pd


def generar_grilla_appeears(
    lugares: list[dict], paso: float = 0.05, salida_csv: str = "puntos_appeears.csv"
) -> pd.DataFrame:
    offsets = [-paso, 0.0, paso]
    filas = []

    for lugar in lugares:
        cat = lugar["Category"]
        lat_c = lugar["lat"]
        lon_c = lugar["lon"]

        for dlat in offsets:
            for dlon in offsets:
                lat = round(lat_c + dlat, 4)
                lon = round(lon_c + dlon, 4)
                point_id = f"{cat}{dlat:+.2f}{dlon:+.2f}".replace("+", "")
                filas.append({
                    "Category": cat,
                    "ID": point_id,
                    "Latitude": lat,
                    "Longitude": lon
                })

    df_puntos = pd.DataFrame(filas)
    df_puntos.to_csv(salida_csv, index=False)
    return df_puntos