import pandas as pd

sitios = pd.read_csv("datos/sitios_candidatos.csv")
paso = 0.05
filas = []
for _, s in sitios.iterrows():
    for dlat in (-paso, 0, paso):
        for dlon in (-paso, 0, paso):
            filas.append({
                "ID": f"{s['nombre']}_{dlat:+.2f}_{dlon:+.2f}",
                "Category": s["nombre"],
                "Latitude": round(s["lat"] + dlat, 4),
                "Longitude": round(s["lon"] + dlon, 4),
            })

pd.DataFrame(filas).to_csv("datos/puntos_appeears.csv", index=False, encoding="utf-8")
print(len(filas), "puntos generados")
