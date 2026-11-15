"""Genera los datos que consume la web a partir de los datos del equipo.

Uso, desde la raíz del repo:  python datos/scripts/generar_web.py

Entradas (solo se leen):
  datos/datos_limpios/objetivos.csv        bases de la Luna y Marte (cualquier cantidad)
  datos/datos_limpios/tierra.csv           métricas de la Tierra (metricas_tierra.py)
  datos/datos_limpios/tierra_detalle.json  elevación, extremos y serie mensual
  datos/sitios_candidatos.csv              lat, lon, región, geología y nivel de estudio
  datos/sources_log_tierra.csv, sources_log_moon.csv, sources_log_mars.csv
  datos/textos_sitios.json                 nombres y descripciones en es/en
  frontend/src/data/credits.json           autor y licencia de las fotos

Salidas (siempre iguales si los datos no cambian):
  backend/data/sites.json, backend/data/bases.json
  frontend/src/data/sites.mock.json, frontend/src/data/bases.mock.json

Similitud: similitud_config.py da la similitud de cada criterio (0-100) y
calculate_score de backend/app/services/scoring.py la combina.
Solo usa la biblioteca estándar de Python.
"""

import csv
import json
import re
import sys
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
DATOS = RAIZ / "datos"
sys.path.insert(0, str(RAIZ / "backend"))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.services.scoring import CRITERIA, calculate_score  # noqa: E402
from similitud_config import PESOS, similitudes  # noqa: E402

CUERPOS = {"luna": "moon", "marte": "mars"}

# ---------- Ids estables: nombre en los CSV -> id de la web ----------
IDS = {
    # Tierra
    "Altiplano del Tibet": "altiplano-del-tibet",
    "Askja": "askja",
    "Atacama": "atacama",
    "Dasht-e Lut": "dasht-e-lut",
    "Depresion de Danakil": "depresion-de-danakil",
    "Desierto de Gobi": "desierto-de-gobi",
    "Isla Devon": "isla-devon",
    "Mojave": "mojave",
    "Salar de Uyuni": "salar-de-uyuni",
    "Taklamakan": "taklamakan",
    "Tibesti": "tibesti",
    "Tolbachik Kamchatka": "tolbachik-kamchatka",
    "Valles secos McMurdo": "valles-secos-mcmurdo",
    # Bases
    "Shackleton (borde)": "shackleton",
    "Pozo Mare Tranquillitatis": "pozo-mare-tranquillitatis",
    "Jezero": "jezero",
    "Arcadia Planitia": "arcadia-planitia",
    "Gale": "gale",
    "Oxia Planum": "oxia-planum",
    "Utopia Planitia": "utopia-planitia",
    "Hellas Planitia": "hellas-planitia",
    "Arsia Mons": "arsia-mons",
}

# ---------- Coordenadas de las bases (lat, lon) y de dónde salen ----------
# Las bases que no están aquí se buscan en datos/bases_marte_candidatas.csv (medir_bases_marte.py)
COORDENADAS_BASES = {
    "Jezero": (18.4, 77.5, "mars_roughness.py y sources_log_mars.csv"),
    "Arcadia Planitia": (47.0, 184.0, "mars_roughness.py y sources_log_mars.csv"),
    "Pozo Mare Tranquillitatis": (8.3, 33.2, "moon_roughness.py"),
    # No aparece en los scripts ni en los logs: se toma de la base equivalente del bases.json anterior
    "Shackleton (borde)": (-89.9, 0.0, "bases.json anterior (sin coordenadas en scripts ni logs)"),
}

# ---------- Fotos existentes del mismo lugar (ruta en credits.json) ----------
FOTOS = {
    "atacama": "/images/atacama.jpg",
    "valles-secos-mcmurdo": "/images/mcmurdo.jpg",
    "isla-devon": "/images/devon.jpg",
    "altiplano-del-tibet": "/images/altiplano-del-tibet.jpg",
    "askja": "/images/askja.jpg",
    "dasht-e-lut": "/images/dasht-e-lut.jpg",
    "depresion-de-danakil": "/images/depresion-de-danakil.jpg",
    "desierto-de-gobi": "/images/desierto-de-gobi.jpg",
    "mojave": "/images/mojave.jpg",
    "salar-de-uyuni": "/images/salar-de-uyuni.jpg",
    "taklamakan": "/images/taklamakan.jpg",
    "tibesti": "/images/tibesti.jpg",
    "tolbachik-kamchatka": "/images/tolbachik-kamchatka.jpg",
    "shackleton": "/images/bases/shackleton.jpg",
    "pozo-mare-tranquillitatis": "/images/bases/tranquilidad.jpg",
    "jezero": "/images/bases/jezero.jpg",
    "arcadia-planitia": "/images/bases/arcadia.jpg",
    "gale": "/images/bases/gale.jpg",
    "oxia-planum": "/images/bases/oxia-planum.jpg",
    "utopia-planitia": "/images/bases/utopia-planitia.jpg",
    "hellas-planitia": "/images/bases/hellas-planitia.jpg",
    "arsia-mons": "/images/bases/arsia-mons.jpg",
}

SALIDAS = [
    (RAIZ / "backend" / "data", ""),
    (RAIZ / "frontend" / "src" / "data", ".mock"),
]


def slug(texto: str) -> str:
    """Respaldo para nombres nuevos que aún no estén en IDS."""
    sin_tildes = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", sin_tildes.lower()).strip("-")


def id_de(nombre: str) -> str:
    return IDS.get(nombre) or slug(nombre)


def numero(valor: str):
    valor = (valor or "").strip()
    if not valor:
        return None
    n = float(valor)
    return int(n) if n.is_integer() and "." not in valor else n


def valor_log(valor: str):
    """Valor de una fila de los logs: número si lo es; si no, el texto tal cual (p. ej. coordenadas)."""
    try:
        return numero(valor)
    except ValueError:
        return valor.strip()


def leer_csv(ruta: Path) -> list[dict]:
    with open(ruta, encoding="utf-8-sig", newline="") as f:
        return [{k.strip(): (v or "").strip() for k, v in fila.items()} for fila in csv.DictReader(f)]


def lon_180(lon: float) -> float:
    return round((lon + 180) % 360 - 180, 4)


def metricas(fila: dict) -> dict:
    return {k: numero(fila.get(k, "")) for k in ("rugosidad", "rango_termico", "hielo")}


def fuentes(log: list[dict], sitio: str) -> list[dict]:
    salida = []
    for fila in log:
        if fila["sitio"] != sitio:
            continue
        fuente = {
            "variable": fila["variable"],
            "value": valor_log(fila["valor"]),
            "note": fila["capa"],
            "url": fila["url"] or None,
            "date": fila["fecha_consulta"] or None,
        }
        if "PROVISIONAL" in fila["capa"].upper():
            fuente["provisional"] = True
        salida.append(fuente)
    return salida


def texto(textos: dict, id_: str, campo: str, respaldo):
    valor = textos.get(id_, {}).get(campo)
    if valor is None:
        return {"es": respaldo, "en": respaldo}
    return {"es": valor["es"], "en": valor["en"]}


def foto(id_: str, creditos: dict) -> dict:
    ruta = FOTOS.get(id_)
    if not ruta or ruta not in creditos:
        return {"image": None, "imageAuthor": None, "imageLicense": None}
    return {"image": ruta, "imageAuthor": creditos[ruta]["author"], "imageLicense": creditos[ruta]["license"]}


def comparar(tierra: dict, base: dict) -> dict:
    criterios = similitudes(tierra, base["_metricas"], base["_cuerpo"])
    resultado = calculate_score(criterios, {c: PESOS.get(c, 0.0) for c in CRITERIA})
    score = resultado["score"]
    return {
        "baseId": base["id"],
        "score": None if score is None else round(score / 100, 4),
        "coverage": resultado["coverage_percent"],
        "criteria": {c: (None if v is None else round(v, 2)) for c, v in criterios.items()},
    }


def escribir(ruta: Path, datos) -> None:
    contenido = json.dumps(datos, ensure_ascii=False, indent=2) + "\n"
    if ruta.exists() and ruta.read_text(encoding="utf-8") == contenido:
        return
    ruta.write_text(contenido, encoding="utf-8", newline="\n")


def main() -> None:
    textos = json.loads((DATOS / "textos_sitios.json").read_text(encoding="utf-8"))
    ruta_candidatas = DATOS / "bases_marte_candidatas.csv"
    candidatas_marte = {
        f["nombre"]: (float(f["lat"]), float(f["lon"]), f["fuente_coordenadas"])
        for f in (leer_csv(ruta_candidatas) if ruta_candidatas.exists() else [])
    }
    creditos = {c["path"]: c for c in json.loads((RAIZ / "frontend" / "src" / "data" / "credits.json").read_text(encoding="utf-8"))}
    logs = {
        "tierra": leer_csv(DATOS / "sources_log_tierra.csv"),
        "luna": leer_csv(DATOS / "sources_log_moon.csv"),
        "marte": leer_csv(DATOS / "sources_log_mars.csv"),
    }
    avisos = []

    # ---------- Bases ----------
    bases = []
    for fila in leer_csv(DATOS / "datos_limpios" / "objetivos.csv"):
        nombre, cuerpo = fila["nombre"], fila["cuerpo"].lower()
        if cuerpo not in CUERPOS:
            raise SystemExit(f"Cuerpo desconocido para {nombre}: {cuerpo}")
        id_ = id_de(nombre)
        if id_ not in textos:
            avisos.append(f"{nombre}: sin textos en textos_sitios.json; se usa el nombre del CSV")
        lat, lon, origen = COORDENADAS_BASES.get(nombre) or candidatas_marte.get(nombre, (None, None, "sin coordenadas"))
        if lat is None:
            avisos.append(f"{nombre}: sin coordenadas")
        log = logs[cuerpo]
        valores = {f["variable"]: valor_log(f["valor"]) for f in log if f["sitio"] == nombre}
        m = metricas(fila)
        bases.append({
            "id": id_,
            "name": texto(textos, id_, "name", nombre),
            "description": texto(textos, id_, "description", ""),
            "body": CUERPOS[cuerpo],
            "lat": lat,
            "lng": None if lon is None else lon_180(lon),
            "metrics": {
                "roughnessM": m["rugosidad"],
                "thermalRange": m["rango_termico"],
                "coldIndex": m["hielo"],
                "tminK": valores.get("tmin_k"),
                "tmaxK": valores.get("tmax_k"),
            },
            "sources": fuentes(log, nombre),
            **foto(id_, creditos),
            "dataSource": "real",
            "_metricas": m,
            "_cuerpo": cuerpo,
            "_origen_coordenadas": origen,
        })
    bases.sort(key=lambda b: (b["body"], b["id"]))

    # ---------- Sitios de la Tierra ----------
    candidatos = {f["nombre"]: f for f in leer_csv(DATOS / "sitios_candidatos.csv")}
    detalle = json.loads((DATOS / "datos_limpios" / "tierra_detalle.json").read_text(encoding="utf-8"))
    sitios = []
    for fila in leer_csv(DATOS / "datos_limpios" / "tierra.csv"):
        nombre = fila["nombre"]
        id_ = id_de(nombre)
        cand = candidatos.get(nombre)
        if cand is None:
            avisos.append(f"{nombre}: no está en sitios_candidatos.csv; sin coordenadas")
            cand = {}
        if id_ not in textos:
            avisos.append(f"{nombre}: sin textos en textos_sitios.json; se usa el nombre del CSV")
        det = detalle.get(nombre, {})
        m = metricas(fila)

        matches = {}
        for cuerpo_web in ("moon", "mars"):
            opciones = [comparar(m, b) for b in bases if b["body"] == cuerpo_web]
            opciones = [o for o in opciones if o["score"] is not None]
            if opciones:
                # mejor score; en empate, el id para que el resultado sea estable
                matches[cuerpo_web] = sorted(opciones, key=lambda o: (-o["score"], o["baseId"]))[0]

        sitios.append({
            "id": id_,
            "name": texto(textos, id_, "name", nombre),
            "country": texto(textos, id_, "country", cand.get("region", "")),
            "description": texto(textos, id_, "description", ""),
            "missions": (textos.get(id_, {}).get("missions") or {"es": [], "en": []}),
            "lat": numero(cand.get("lat", "")),
            "lng": numero(cand.get("lon", "")),
            "region": cand.get("region") or None,
            "geology": cand.get("geologia") or None,
            "studied": numero(cand.get("estudiado", "")),
            "metrics": {
                "roughnessM": m["rugosidad"],
                "thermalRange": m["rango_termico"],
                "coldIndex": m["hielo"],
                "elevationM": det.get("elevacion_m"),
                "tempMinC": det.get("temp_min_c"),
                "tempMaxC": det.get("temp_max_c"),
            },
            "monthlyTemp": [
                {"month": s["mes"], "dayC": s["dia_c"], "nightC": s["noche_c"]}
                for s in det.get("serie_mensual", [])
            ],
            "matches": matches,
            "sources": fuentes(logs["tierra"], nombre),
            **foto(id_, creditos),
            "dataSource": "real",
        })
    sitios.sort(key=lambda s: s["id"])

    for b in bases:
        if "anterior" in b["_origen_coordenadas"]:
            avisos.append(f"{b['id']}: coordenadas tomadas del {b['_origen_coordenadas']}")
    publicas = [{k: v for k, v in b.items() if not k.startswith("_")} for b in bases]

    for carpeta, sufijo in SALIDAS:
        escribir(carpeta / f"sites{sufijo}.json", sitios)
        escribir(carpeta / f"bases{sufijo}.json", publicas)

    print(f"{len(sitios)} sitios y {len(publicas)} bases")
    print(f"{'sitio':<26} {'Luna':<28} {'Marte':<22}")
    for s in sitios:
        celdas = []
        for cuerpo in ("moon", "mars"):
            mt = s["matches"].get(cuerpo)
            celdas.append(f"{mt['baseId']} {mt['score']:.3f}" if mt else "-")
        print(f"{s['id']:<26} {celdas[0]:<28} {celdas[1]:<22}")
    for aviso in avisos:
        print("AVISO:", aviso)


if __name__ == "__main__":
    main()
