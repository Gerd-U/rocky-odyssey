"""Métricas de los 13 lugares de la Tierra con las mismas fórmulas que la Luna y Marte.

Entradas (solo se leen):
  datos/datos_crudos/rocky-odyssey-tierra-ASTGTM-NC-003-results.csv  (9 elevaciones por sitio)
  backend/data/tierra_resumen.json                                     (temperaturas MODIS 2023)

Salidas (se reescriben completas en cada ejecución, siempre iguales):
  datos/datos_limpios/tierra.csv          nombre,cuerpo,rugosidad,rango_termico,hielo
  datos/datos_limpios/tierra_detalle.json elevación, extremos, serie mensual y nulos
  datos/sources_log_tierra.csv            una fila por sitio y variable

Fórmulas:
  rugosidad      desviación estándar (ddof=0, como np.std) de las 9 elevaciones, 1 decimal
  rango_termico  promedio de (dia_c - noche_c) en las fechas con los dos valores, 1 decimal
                 (equivalente a mcd_range.py: promedio de máximas menos promedio de mínimas)
  hielo          índice de frío: % de los 12 meses con media de (dia_c + noche_c) / 2 bajo 0 °C

Uso, desde la raíz del repo:  python datos/scripts/metricas_tierra.py
Solo usa la biblioteca estándar de Python.
"""

import csv
import json
import math
import statistics
from collections import defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
DATOS = RAIZ / "datos"
CSV_ELEV = DATOS / "datos_crudos" / "rocky-odyssey-tierra-ASTGTM-NC-003-results.csv"
JSON_TEMP = RAIZ / "backend" / "data" / "tierra_resumen.json"
SALIDA_CSV = DATOS / "datos_limpios" / "tierra.csv"
SALIDA_JSON = DATOS / "datos_limpios" / "tierra_detalle.json"
SALIDA_LOG = DATOS / "sources_log_tierra.csv"

COL_ELEV = "ASTGTM_NC_003_ASTER_GDEM_DEM"
PASO_GRADOS = 0.05            # cuadrícula de generar_puntos.py
KM_POR_GRADO = 111.32

# Fuentes, tomadas de datos/referencias/appeears/README.md (citas de productos y fecha de la solicitud)
URL_MOD11A2 = "https://doi.org/10.5067/MODIS/MOD11A2.061"
URL_ASTGTM = "https://doi.org/10.5067/ASTER/ASTGTM_NC.003"
FECHA_CONSULTA = "2026-11-14"   # "Date Completed: 2026-11-14" en el README de AppEEARS
CAPA_TEMP = "MOD11A2.061 (LST_Day_1km y LST_Night_1km, 2023) vía NASA AppEEARS"
CAPA_ELEV = "ASTGTM_NC.003 (ASTER GDEM v3) vía NASA AppEEARS"


def r1(x: float) -> float:
    return round(float(x), 1)


def leer_elevaciones() -> dict[str, list[tuple[float, float, float]]]:
    """Category -> [(lat, lon, elevación)] con las filas válidas del CSV de ASTER."""
    por_sitio: dict[str, list[tuple[float, float, float]]] = defaultdict(list)
    with open(CSV_ELEV, encoding="utf-8-sig", newline="") as f:
        for fila in csv.DictReader(f):
            valor = (fila.get(COL_ELEV) or "").strip()
            try:
                elev = float(valor)
            except ValueError:
                continue
            if not math.isfinite(elev):
                continue
            por_sitio[fila["Category"].strip()].append(
                (float(fila["Latitude"]), float(fila["Longitude"]), elev)
            )
    return por_sitio


def metricas_temperatura(temperaturas: list[dict]) -> dict:
    completas = [t for t in temperaturas if t.get("dia_c") is not None and t.get("noche_c") is not None]
    nulos = len(temperaturas) - len(completas)

    rango = r1(statistics.fmean(t["dia_c"] - t["noche_c"] for t in completas)) if completas else None

    por_mes: dict[int, list[dict]] = defaultdict(list)
    for t in completas:
        por_mes[int(t["fecha"][5:7])].append(t)

    meses_frios = 0
    serie = []
    for mes in range(1, 13):
        lista = por_mes.get(mes, [])
        if not lista:
            serie.append({"mes": mes, "dia_c": None, "noche_c": None})
            continue
        media = statistics.fmean((t["dia_c"] + t["noche_c"]) / 2 for t in lista)
        if media < 0:
            meses_frios += 1
        serie.append({
            "mes": mes,
            "dia_c": round(statistics.fmean(t["dia_c"] for t in lista), 2),
            "noche_c": round(statistics.fmean(t["noche_c"] for t in lista), 2),
        })

    meses_con_dato = sum(1 for s in serie if s["dia_c"] is not None)
    # Porcentaje sobre los 12 meses del año: un mes sin datos cuenta como "no bajo 0 °C"
    hielo = round(100 * meses_frios / 12) if meses_con_dato else None

    dias = [t["dia_c"] for t in temperaturas if t.get("dia_c") is not None]
    noches = [t["noche_c"] for t in temperaturas if t.get("noche_c") is not None]
    return {
        "rango_termico": rango,
        "hielo": hielo,
        "temp_min_c": round(min(noches), 2) if noches else None,
        "temp_max_c": round(max(dias), 2) if dias else None,
        "serie_mensual": serie,
        "fechas": len(temperaturas),
        "fechas_con_nulos": nulos,
        "meses_con_dato": meses_con_dato,
    }


def main() -> None:
    elevaciones = leer_elevaciones()
    with open(JSON_TEMP, encoding="utf-8") as f:
        temperaturas = {s["ubicacion"].strip(): s["temperaturas"] for s in json.load(f)}

    nombres = sorted(set(elevaciones) | set(temperaturas))
    filas_csv, detalle, filas_log, avisos = [], {}, [], []

    for nombre in nombres:
        puntos = elevaciones.get(nombre, [])
        elevs = [e for _, _, e in puntos]
        if len(elevs) == 9:
            rugosidad = r1(statistics.pstdev(elevs))       # ddof=0
            elev_media = round(statistics.fmean(elevs), 1)
        else:
            rugosidad = elev_media = None
            avisos.append(f"{nombre}: {len(elevs)} elevaciones válidas (se esperaban 9); sin rugosidad")

        temp = metricas_temperatura(temperaturas.get(nombre, []))
        if nombre not in temperaturas:
            avisos.append(f"{nombre}: sin temperaturas en tierra_resumen.json")
        elif temp["meses_con_dato"] < 12:
            avisos.append(f"{nombre}: solo {temp['meses_con_dato']} meses con dato; "
                          "el índice de frío se calcula sobre 12 meses")

        lat_centro = statistics.fmean(la for la, _, _ in puntos) if puntos else None
        sep_eo_km = (round(PASO_GRADOS * KM_POR_GRADO * math.cos(math.radians(lat_centro)), 2)
                     if lat_centro is not None else None)
        sep_ns_km = round(PASO_GRADOS * KM_POR_GRADO, 2)

        filas_csv.append([nombre, "tierra", rugosidad, temp["rango_termico"], temp["hielo"]])
        detalle[nombre] = {
            "elevacion_m": elev_media,
            "temp_min_c": temp["temp_min_c"],
            "temp_max_c": temp["temp_max_c"],
            "serie_mensual": temp["serie_mensual"],
            "fechas": temp["fechas"],
            "fechas_con_nulos": temp["fechas_con_nulos"],
            "cuadricula": {
                "puntos": len(elevs),
                "paso_grados": PASO_GRADOS,
                "separacion_ns_km": sep_ns_km,
                "separacion_eo_km": sep_eo_km,
            },
        }

        cuadricula = (f"cuadrícula 3x3 con paso de {PASO_GRADOS}° (≈{sep_ns_km:.1f} km norte-sur, "
                      f"≈{sep_eo_km:.1f} km este-oeste en este sitio)" if sep_eo_km is not None else "")
        nulos = f"; {temp['fechas_con_nulos']} fechas con nulos excluidas" if temp["fechas_con_nulos"] else ""
        sin_meses = (f"; {12 - temp['meses_con_dato']} meses sin datos cuentan como no bajo 0 °C"
                     if temp["meses_con_dato"] < 12 else "")
        filas_log += [
            [nombre, "rugosidad", rugosidad,
             f"{CAPA_ELEV}; {cuadricula}; desviación estándar (ddof=0) de las 9 elevaciones",
             URL_ASTGTM, FECHA_CONSULTA],
            [nombre, "elevacion_m", elev_media,
             f"{CAPA_ELEV}; promedio de las 9 elevaciones", URL_ASTGTM, FECHA_CONSULTA],
            [nombre, "rango_termico", temp["rango_termico"],
             f"{CAPA_TEMP}; promedio anual de (día - noche) con las fechas que tienen los dos valores{nulos}",
             URL_MOD11A2, FECHA_CONSULTA],
            [nombre, "temp_min_c", temp["temp_min_c"],
             f"{CAPA_TEMP}; mínimo de la temperatura de noche", URL_MOD11A2, FECHA_CONSULTA],
            [nombre, "temp_max_c", temp["temp_max_c"],
             f"{CAPA_TEMP}; máximo de la temperatura de día", URL_MOD11A2, FECHA_CONSULTA],
            [nombre, "hielo", temp["hielo"],
             f"{CAPA_TEMP}; índice de frío: % de los 12 meses con temperatura media ((día + noche) / 2) "
             f"bajo 0 °C{sin_meses}",
             URL_MOD11A2, FECHA_CONSULTA],
        ]

    with open(SALIDA_CSV, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(["nombre", "cuerpo", "rugosidad", "rango_termico", "hielo"])
        w.writerows([["" if v is None else v for v in fila] for fila in filas_csv])

    with open(SALIDA_JSON, "w", encoding="utf-8", newline="\n") as f:
        json.dump(detalle, f, ensure_ascii=False, indent=2)
        f.write("\n")

    with open(SALIDA_LOG, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(["sitio", "variable", "valor", "capa", "url", "fecha_consulta"])
        w.writerows([["" if v is None else v for v in fila] for fila in filas_log])

    print(f"{'nombre':<24} {'rugosidad':>9} {'rango':>6} {'hielo':>5} {'nulos':>5}")
    for fila in filas_csv:
        print(f"{fila[0]:<24} {fila[2]!s:>9} {fila[3]!s:>6} {fila[4]!s:>5} {detalle[fila[0]]['fechas_con_nulos']:>5}")
    for aviso in avisos:
        print("AVISO:", aviso)
    print(f"\nEscrito: {SALIDA_CSV.relative_to(RAIZ)}, {SALIDA_JSON.relative_to(RAIZ)}, {SALIDA_LOG.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
