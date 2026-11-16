"""Genera los datos de la web (backend/data) solo a partir de los datos de datos/.

QUÉ HACE
- Tierra: las 13 ubicaciones de backend/data/tierra_resumen.json, con lat/lon y región
  de datos/sitios_candidatos.csv.
- Luna y Marte: los 11 objetivos de datos/datos_limpios/objetivos.csv, con las coordenadas
  de los diccionarios SITIOS de los scripts de datos/scripts (moon_sites.py, mars_roughness.py
  y, si falta alguna, los demás). Un objetivo sin coordenadas en ningún script no se agrega.

VARIABLES DE LA TIERRA (de tierra_resumen.json, ignorando null)
- tempMin = mínimo de noche_c; tempMax = máximo de dia_c (se muestran como temperatura)
- rango_termico = el de datos/sources_log_tierra.csv: promedio anual de (día - noche) de
  MOD11A2, el rango DIARIO medio. Es la misma medida que el rango de Marte (mcd_range.py,
  ciclo diario promediado en 4 estaciones) y de la Luna (ciclo día/noche). Una diferencia
  en °C equivale a una en K, así que se compara directo con el rango_termico (K) de
  objetivos.csv. (tempMax - tempMin sería el rango ANUAL, que mezcla las estaciones.)
- hielo = % de registros de "nieve" con ndsi > 0
- elevación = elevacion_metros
- rugosidad = desviación estándar (ddof=0) de las 9 elevaciones ASTER GDEM de cada sitio
  (datos_crudos/rocky-odyssey-tierra-ASTGTM-NC-003-results.csv, cuadrícula 3x3 de 0.05°
  ~5.5 km de generar_puntos.py). Es el mismo método que la rugosidad de la Luna y Marte
  (moon_sites.py, mars_roughness.py: 9 puntos, 3x3, 5.5 km, np.std).

SIMILITUD
- Se comparan rango_termico y rugosidad.
  El hielo NO entra: es 0 en los 11 objetivos, así que solo premiaba a los sitios sin nieve
  sin decir nada del parecido (regalaba un tercio del puntaje).
- Similitud por variable entre un sitio de la Tierra (a) y un objetivo (b), en proporción:
      sim = 100 * min(a, b) / max(a, b)        (100 si los dos son 0)
  Una diferencia cuenta según su tamaño relativo: 20 frente a 49 es 41 %. Antes se dividía
  |a - b| entre el rango de los 24 lugares, y los extremos de la Luna (~300 K de rango,
  910 m de rugosidad) hacían que cualquier diferencia pareciera pequeña (90 %+).
  Ojo: con valores pequeños es exigente (6 m frente a 9 m de rugosidad = 67 %).
- rango_termico -> criterio "temperature"; rugosidad -> criterio "topography".
- Puntaje = calculate_score de backend/app/services/scoring.py con los pesos por defecto
  (promedio de los criterios con dato).
- La Luna y Marte se comparan POR SEPARADO (la web tiene un globo para cada uno): cada sitio
  de la Tierra tiene un gemelo en la Luna (el objetivo lunar con mayor puntaje) y otro en
  Marte (el marciano con mayor puntaje). Se guardan en twins = {"moon": {analogOf, similarity},
  "mars": {...}}, con similarity = puntaje / 100.
- target / analogOf / similarity (un solo destino, como antes) = el gemelo con mayor puntaje
  de los dos.

SALIDA
- backend/data/locations.json: los 13 sitios de la Tierra (validados con Location).
- backend/data/sites.json: actualiza target/analogOf/similarity/twins/measures de los sitios con
  datos que ya existían y agrega los nuevos. measures = {thermalRange (°C de diferencia),
  ice (% de días con nieve), roughness (m)}: las tres medidas que se comparan.
- backend/data/bases.json: agrega las bases nuevas; las existentes no se tocan.
Se puede correr varias veces: si el id ya existe se actualiza, si no se agrega.

Uso: python datos/scripts/generar_datos_web.py
"""

import ast
import csv
import json
import statistics
import sys
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
DATOS = RAIZ / "datos"
SCRIPTS = DATOS / "scripts"
BACKEND = RAIZ / "backend"
DATA_WEB = BACKEND / "data"

sys.path.insert(0, str(BACKEND))
from app.models.location import Location  # noqa: E402
from app.services.scoring import calculate_score  # noqa: E402

FUENTE = "NASA AppEEARS (MOD11A2 v061, MOD10A1 v061, ASTER GDEM ASTGTM v003)"
ORGANIZACION = "NASA LP DAAC"
CUERPO = {"luna": "moon", "marte": "mars"}
# variable -> criterio de scoring.py
VARIABLES = {"rango_termico": "temperature", "rugosidad": "topography"}

# Ids que ya existen en la web
IDS_EXISTENTES = {
    "Atacama": "atacama",
    "Valles secos McMurdo": "mcmurdo",
    "Isla Devon": "devon",
    "Shackleton (borde)": "shackleton",
    "Pozo Mare Tranquillitatis": "tranquilidad",
    "Jezero": "jezero",
    "Arcadia Planitia": "arcadia",
    "Gale": "gale",
}


def nuevo_id(nombre):
    """Minúsculas, sin tildes ni espacios."""
    sin_tildes = unicodedata.normalize("NFKD", nombre).encode("ascii", "ignore").decode()
    return sin_tildes.lower().replace(" ", "")


def id_de(nombre):
    return IDS_EXISTENTES.get(nombre) or nuevo_id(nombre)


# ---------- lectura ----------

def leer_csv(ruta):
    with open(ruta, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def sitios_de_script(ruta):
    """Lee el diccionario SITIOS de un script sin ejecutarlo."""
    try:
        arbol = ast.parse(ruta.read_text(encoding="utf-8-sig"))
    except SyntaxError:
        return {}
    for nodo in arbol.body:
        if isinstance(nodo, ast.Assign) and any(
            isinstance(t, ast.Name) and t.id == "SITIOS" for t in nodo.targets
        ):
            try:
                valor = ast.literal_eval(nodo.value)
            except ValueError:
                return {}
            return valor if isinstance(valor, dict) else {}
    return {}


def coordenadas_objetivos():
    """Coordenadas (lat, lon) por nombre; primero moon_sites y mars_roughness, luego los demás."""
    principales = [SCRIPTS / "moon_sites.py", SCRIPTS / "mars_roughness.py"]
    otros = sorted(p for p in SCRIPTS.glob("*.py") if p not in principales and p.name != Path(__file__).name)
    coords = {}
    for ruta in principales + otros:
        for nombre, valor in sitios_de_script(ruta).items():
            if nombre in coords or not isinstance(valor, (tuple, list)) or len(valor) < 2:
                continue
            lat, lon = valor[0], valor[1]
            if isinstance(lat, (int, float)) and isinstance(lon, (int, float)):
                coords[nombre] = (float(lat), float(lon))
    return coords


def lon_180(lon):
    """Longitud este 0-360 (como en mars_roughness.py) a -180..180, como en bases.json."""
    return round(lon - 360, 2) if lon > 180 else lon


# ---------- cálculo ----------

def variables_tierra(registro):
    noches = [t["noche_c"] for t in registro["temperaturas"] if t.get("noche_c") is not None]
    dias = [t["dia_c"] for t in registro["temperaturas"] if t.get("dia_c") is not None]
    nieve = [n["ndsi"] for n in registro["nieve"] if n.get("ndsi") is not None]
    temp_min, temp_max = min(noches), max(dias)
    return {
        "tempMin": temp_min,
        "tempMax": temp_max,
        "hielo": round(100 * sum(1 for v in nieve if v > 0) / len(nieve), 1),
        "elevacion": round(registro["elevacion_metros"], 1),
    }


def rangos_tierra():
    """rango_termico de cada sitio de la Tierra, tal como está en sources_log_tierra.csv."""
    return {
        fila["sitio"]: float(fila["valor"])
        for fila in leer_csv(DATOS / "sources_log_tierra.csv")
        if fila["variable"] == "rango_termico"
    }


def rugosidades_tierra():
    """Desviación estándar (ddof=0) de las 9 elevaciones ASTER de cada sitio."""
    elev = {}
    for fila in leer_csv(DATOS / "datos_crudos" / "rocky-odyssey-tierra-ASTGTM-NC-003-results.csv"):
        elev.setdefault(fila["Category"], []).append(float(fila["ASTGTM_NC_003_ASTER_GDEM_DEM"]))
    return {nombre: round(statistics.pstdev(v), 1) for nombre, v in elev.items()}


def similitud(a, b):
    """Proporción entre los dos valores: 100 * menor / mayor (100 si los dos son 0)."""
    mayor = max(a, b)
    if mayor == 0:
        return 100.0
    return 100 * min(a, b) / mayor


# ---------- escritura con el mismo estilo que los JSON a mano ----------

def _dump(valor, sangria, clave=None):
    pad = "  " * sangria
    if isinstance(valor, list) and not any(isinstance(v, (dict, list)) for v in valor):
        return json.dumps(valor, ensure_ascii=False, separators=(", ", ": "))
    if isinstance(valor, dict) and clave == "factors":
        cuerpo = ", ".join(f"{json.dumps(k)}: {json.dumps(v, ensure_ascii=False)}" for k, v in valor.items())
        return "{ " + cuerpo + " }" if cuerpo else "{}"
    if isinstance(valor, list):
        items = [pad + "  " + _dump(v, sangria + 1) for v in valor]
        return "[\n" + ",\n".join(items) + "\n" + pad + "]"
    if isinstance(valor, dict):
        if not valor:
            return "{}"
        items = [f'{pad}  {json.dumps(k, ensure_ascii=False)}: {_dump(v, sangria + 1, k)}' for k, v in valor.items()]
        return "{\n" + ",\n".join(items) + "\n" + pad + "}"
    return json.dumps(valor, ensure_ascii=False)


def escribir(ruta, datos):
    ruta.write_text(_dump(datos, 0) + "\n", encoding="utf-8")


def upsert(lista, item):
    for i, existente in enumerate(lista):
        if existente.get("id") == item["id"]:
            lista[i] = item
            return
    lista.append(item)


def num(valor):
    """Número para texto: sin decimales sobrantes."""
    return f"{valor:g}" if isinstance(valor, float) else str(valor)


def main():
    tierra = json.loads((DATA_WEB / "tierra_resumen.json").read_text(encoding="utf-8"))
    candidatos = {fila["nombre"]: fila for fila in leer_csv(DATOS / "sitios_candidatos.csv")}
    objetivos = leer_csv(DATOS / "datos_limpios" / "objetivos.csv")
    coords_obj = coordenadas_objetivos()
    rugosidad = rugosidades_tierra()
    rango = rangos_tierra()

    sitios = []
    for registro in tierra:
        nombre = registro["ubicacion"]
        cand = candidatos[nombre]
        sitios.append({
            "id": id_de(nombre),
            "nombre": nombre,
            "region": cand["region"],
            "lat": float(cand["lat"]),
            "lon": float(cand["lon"]),
            **variables_tierra(registro),
            "rugosidad": rugosidad[nombre],
            "rango_termico": rango[nombre],  # KeyError si falta en el log: no se inventa
        })

    objs = [{
        "id": id_de(o["nombre"]),
        "nombre": o["nombre"],
        "body": CUERPO[o["cuerpo"]],
        "rugosidad": float(o["rugosidad"]),
        "rango_termico": float(o["rango_termico"]),
        "hielo": float(o["hielo"]),
    } for o in objetivos]

    for s in sitios:
        s["gemelos"] = {}  # cuerpo -> (puntaje, objetivo)
        for o in objs:
            res = calculate_score({
                criterio: similitud(s[var], o[var]) for var, criterio in VARIABLES.items()
            })
            actual = s["gemelos"].get(o["body"])
            if actual is None or res["score"] > actual[0]:
                s["gemelos"][o["body"]] = (res["score"], o)
        s["score"], s["objetivo"] = max(s["gemelos"].values(), key=lambda g: g[0])

    # ---- locations.json ----
    locations = []
    for s in sitios:
        loc = Location(
            id=s["id"],
            name=s["nombre"],
            country=s["region"],
            coordinates={"latitude": s["lat"], "longitude": s["lon"]},
            temperature={"minimum_c": s["tempMin"], "maximum_c": s["tempMax"]},
            topography={"elevation_m": s["elevacion"], "roughness": s["rugosidad"]},
            sources=[{"name": FUENTE, "organization": ORGANIZACION}],
            comparison={body: {"score": score, "analogOf": o["id"]} for body, (score, o) in s["gemelos"].items()},
        )
        locations.append(loc.model_dump(mode="json"))
    (DATA_WEB / "locations.json").write_text(
        json.dumps({"locations": locations}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    # ---- sites.json ----
    sites = json.loads((DATA_WEB / "sites.json").read_text(encoding="utf-8"))
    por_id = {site["id"]: site for site in sites}
    for s in sitios:
        target, analog, sim = s["objetivo"]["body"], s["objetivo"]["id"], round(s["score"] / 100, 4)
        twins = {
            body: {"analogOf": s["gemelos"][body][1]["id"], "similarity": round(s["gemelos"][body][0] / 100, 4)}
            for body in ("moon", "mars") if body in s["gemelos"]
        }
        # Las tres medidas con las que se compara, para que la web las muestre como datos
        measures = {"thermalRange": s["rango_termico"], "ice": s["hielo"], "roughness": s["rugosidad"]}
        if s["id"] in IDS_EXISTENTES.values() and s["id"] in por_id:
            site = por_id[s["id"]]
            site["target"], site["analogOf"], site["similarity"] = target, analog, sim
            site["twins"] = twins
            site["measures"] = measures
            continue
        desc_es = (
            f"Rango térmico diario medio de {num(s['rango_termico'])} °C; entre {num(s['tempMin'])} °C y {num(s['tempMax'])} °C a lo largo de 2023, "
            f"elevación de {num(s['elevacion'])} m, rugosidad de {num(s['rugosidad'])} m y nieve en el {num(s['hielo'])} % de los días con registro. "
            f"Fuente: {FUENTE}."
        )
        desc_en = (
            f"Mean daily thermal range of {num(s['rango_termico'])} °C; between {num(s['tempMin'])} °C and {num(s['tempMax'])} °C over 2023, "
            f"elevation of {num(s['elevacion'])} m, roughness of {num(s['rugosidad'])} m and snow on {num(s['hielo'])}% of recorded days. "
            f"Source: {FUENTE}."
        )
        upsert(sites, {
            "id": s["id"],
            "name": {"es": s["nombre"], "en": s["nombre"]},
            "country": {"es": s["region"], "en": s["region"]},
            "lat": s["lat"],
            "lng": s["lon"],
            "target": target,
            "analogOf": analog,
            "similarity": sim,
            "twins": twins,
            "measures": measures,
            "factors": {"precipMm": None, "tempMin": s["tempMin"], "tempMax": s["tempMax"], "terrain": None},
            "missions": {"es": [], "en": []},
            "image": "",
            "imageAuthor": "",
            "imageLicense": "",
            "description": {"es": desc_es, "en": desc_en},
        })
    escribir(DATA_WEB / "sites.json", sites)

    # ---- bases.json ----
    bases = json.loads((DATA_WEB / "bases.json").read_text(encoding="utf-8"))
    existentes = {"tranquilidad", "shackleton", "jezero", "arcadia", "gale"}
    sin_coordenadas = []
    for o in objs:
        if o["id"] in existentes:
            continue
        if o["nombre"] not in coords_obj:
            sin_coordenadas.append(o["nombre"])
            continue
        lat, lon = coords_obj[o["nombre"]]
        upsert(bases, {
            "id": o["id"],
            "name": {"es": o["nombre"], "en": o["nombre"]},
            "body": o["body"],
            "lat": lat,
            "lng": lon_180(lon),
            "factors": {"precipMm": None, "tempMin": None, "tempMax": None, "terrain": None},
            "image": "",
            "imageAuthor": "",
            "imageLicense": "",
            "description": {
                "es": f"Rugosidad de {num(o['rugosidad'])} m, rango térmico de {num(o['rango_termico'])} K y hielo de {num(o['hielo'])} %.",
                "en": f"Roughness of {num(o['rugosidad'])} m, thermal range of {num(o['rango_termico'])} K and ice of {num(o['hielo'])}%.",
            },
        })
    escribir(DATA_WEB / "bases.json", bases)

    # ---- resumen ----
    print(f"{'Sitio':<22}{'Rango':>7}{'Hielo%':>7}{'Rug.':>7}  {'Luna':<26}{'Marte':<26}")
    for s in sitios:
        celdas = [f"{s['gemelos'][b][1]['nombre']} {s['gemelos'][b][0] / 100:.4f}" for b in ("moon", "mars")]
        print(f"{s['nombre']:<22}{s['rango_termico']:>7.2f}{s['hielo']:>7.1f}{s['rugosidad']:>7.1f}  "
              f"{celdas[0]:<26}{celdas[1]:<26}")
    if sin_coordenadas:
        print("AVISO: objetivos sin coordenadas en ningún script, no se agregaron:", ", ".join(sin_coordenadas))
    print(f"sites.json: {len(sites)} sitios | bases.json: {len(bases)} bases | locations.json: {len(locations)}")


if __name__ == "__main__":
    main()
