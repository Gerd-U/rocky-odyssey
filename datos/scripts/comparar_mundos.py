"""Este script toma los datos procesados de Tierra, Luna y Marte,
los normaliza y genera un JSON unificado de comparación global.
"""

from pathlib import Path
import json

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "backend" / "data"

# Rutas de los archivos procesados de cada mundo
PATH_TIERRA = DATA_DIR / "tierra_resumen.json"
PATH_LUNA = DATA_DIR / "luna_resumen.json"       # Generado previamente
PATH_MARTE = DATA_DIR / "marte_resumen.json"     # Opcional si ya lo tienes procesado

PATH_SALIDA = DATA_DIR / "comparacion_global.json"


def cargar_json(ruta):
    if ruta.exists():
        with open(ruta, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def procesar_comparacion():
    tierra_data = cargar_json(PATH_TIERRA)
    luna_data = cargar_json(PATH_LUNA)
    marte_data = cargar_json(PATH_MARTE)

    resumen_global = {
        "tierra": [],
        "luna": [],
        "marte": []
    }

    # 1. Normalizar datos de la Tierra
    # Asumiendo estructura de tierra_resumen.json que ya creaste
    for zona in tierra_data:
        # Calcular promedios generales de temperatura si existen
        temps = zona.get("temperaturas", [])
        dias = [t["dia_c"] for t in temps if t.get("dia_c") is not None]
        noches = [t["noche_c"] for t in temps if t.get("noche_c") is not None]
        
        media_dia = sum(dias) / len(dias) if dias else None
        media_noche = sum(noches) / len(noches) if noches else None

        resumen_global["tierra"].append({
            "nombre": zona.get("ubicacion"),
            "elevacion_m": zona.get("elevacion_metros"),
            "temperatura_media_dia_c": round(media_dia, 2) if media_dia else None,
            "temperatura_media_noche_c": round(media_noche, 2) if media_noche else None,
            "indicador_hielo_nieve": "Presente (NDSI analizado)"
        })

    # 2. Normalizar datos de la Luna
    for zona in luna_data:
        resumen_global["luna"].append({
            "nombre": zona.get("ubicacion"),
            "latitud": zona.get("latitud"),
            "longitud": zona.get("longitud"),
            "hidrogeno_ppm_promedio": zona.get("hidrogeno_ppm")
        })

    # 3. Normalizar datos de Marte (si aplica estructura similar)
    for zona in marte_data:
        resumen_global["marte"].append({
            "nombre": zona.get("ubicacion", "Sitio Marciano"),
            "datos": zona
        })

    # Guardar JSON maestro de comparación
    PATH_SALIDA.parent.mkdir(parents=True, exist_ok=True)
    with open(PATH_SALIDA, "w", encoding="utf-8") as f:
        json.dump(resumen_global, f, ensure_ascii=False, indent=4)

    print(f"¡Comparación global generada con éxito en: {PATH_SALIDA}")


if __name__ == "__main__":
    procesar_comparacion()