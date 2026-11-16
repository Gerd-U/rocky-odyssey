import csv
import json
import os
from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api", tags=["Frontend"])

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
# Carpeta con sources_log_moon.csv y sources_log_mars.csv. Por defecto backend/data, donde
# generar_datos_web.py los copia desde datos/: así el backend no depende de nada fuera de su
# carpeta (en Vercel solo se despliega backend/). DATOS_DIR permite apuntar a otra.
SCIENCE_DIR = Path(os.getenv("DATOS_DIR") or DATA_DIR)

SUPPORTED_LANGS = ("en", "es")
DEFAULT_LANG = "en"

# Campos de sites.json y bases.json que vienen como {"es": ..., "en": ...}
TRANSLATED_FIELDS = ("name", "country", "description", "missions")

# Explicit links keep planetary measurements separate from terrestrial analog sites.
BASE_MEASUREMENT_NAMES = {
    "shackleton": {"shackleton (borde)"},
    "tranquilidad": {"pozo mare tranquillitatis"},
    "jezero": {"jezero"},
    "arcadia": {"arcadia planitia"},
    "gale": {"gale"},
    "malapertmassif": {"malapert massif"},
    "cabeus": {"cabeus"},
    "rimaebode": {"rimae bode"},
    "peary": {"peary"},
    "oxiaplanum": {"oxia planum"},
    "arsiamons": {"arsia mons"},
}


def _source_organization(url: str, layer: str) -> str | None:
    host = url.lower()
    if "trek.nasa.gov" in host or "svs.gsfc.nasa.gov" in host:
        return "NASA Goddard Space Flight Center"
    if "astrogeology.usgs.gov" in host:
        return "U.S. Geological Survey (USGS)"
    if "mars.lmd.jussieu.fr" in host:
        return "Laboratoire de Météorologie Dynamique (LMD), CNRS / Sorbonne Université"
    if layer.startswith("tmax_k -"):
        return "Cálculo derivado de mediciones de la fuente indicada"
    return None


def load_planetary_measurements() -> dict[str, list[dict]]:
    """Read scientific logs and attach only exact, explicitly mapped planetary sites."""
    by_name = {
        name: base_id
        for base_id, names in BASE_MEASUREMENT_NAMES.items()
        for name in names
    }
    measurements: dict[str, list[dict]] = {base_id: [] for base_id in BASE_MEASUREMENT_NAMES}
    base_bodies = {base.get("id"): base.get("body") for base in load_data("bases.json")}
    for body, filename in (("moon", "sources_log_moon.csv"), ("mars", "sources_log_mars.csv")):
        path = SCIENCE_DIR / filename
        if not path.exists():
            continue
        with path.open(encoding="utf-8-sig", newline="") as stream:
            for row in csv.DictReader(stream):
                name = (row.get("sitio") or "").strip().casefold()
                base_id = by_name.get(name)
                if base_id is None or base_id not in measurements:
                    continue
                base_body = base_bodies.get(base_id)
                if base_body != body:
                    continue
                try:
                    value = float(row["valor"])
                except (KeyError, TypeError, ValueError):
                    continue
                variable = (row.get("variable") or "").strip()
                layer = (row.get("capa") or "").strip()
                url = (row.get("url") or "").strip()
                measurement = {"name": variable, "value": value}
                units = {
                    "tmax_k": "K",
                    "tmin_k": "K",
                    "rango_termico": "K",
                    "hielo": "%",
                    "hielo_favorabilidad": "score 0-100",
                }
                if variable in units:
                    measurement["unit"] = units[variable]
                source = {"name": layer or variable}
                organization = _source_organization(url, layer)
                if organization:
                    source["organization"] = organization
                if url:
                    source["url"] = url
                if row.get("fecha_consulta"):
                    source["accessedAt"] = row["fecha_consulta"]
                measurement["source"] = source
                measurements[base_id].append(measurement)
    return measurements


def apply_base_measurements(bases, measurements_by_id):
    """Use measured temperatures for matching bases; preserve raw K in scientificData."""
    for base in bases:
        measurements = measurements_by_id.get(base.get("id"), [])
        base["scientificData"] = measurements
        factors = base.setdefault("factors", {})
        factor_status = {key: "demonstration" for key in factors}
        factor_sources = {}
        by_name = {item["name"]: item for item in measurements}
        for measurement_name, factor_name in (("tmin_k", "tempMin"), ("tmax_k", "tempMax")):
            measurement = by_name.get(measurement_name)
            if measurement and measurement.get("unit") == "K":
                # Kelvin to Celsius: °C = K - 273.15.
                factors[factor_name] = round(measurement["value"] - 273.15, 2)
                factor_status[factor_name] = "scientific"
                factor_sources[factor_name] = {
                    "measurement": measurement_name,
                    "source": measurement["source"],
                    "conversion": "°C = K - 273.15",
                }
        base["factorDataStatus"] = factor_status
        base["factorSources"] = factor_sources
    return bases


def resolve_lang(lang) -> str:
    """Idioma pedido si está admitido; si no, inglés."""

    return lang if lang in SUPPORTED_LANGS else DEFAULT_LANG


def localize(item: dict, lang) -> dict:
    """Devuelve el item con los campos traducidos ya resueltos al idioma pedido."""

    lang = resolve_lang(lang)
    localized = dict(item)

    for field in TRANSLATED_FIELDS:
        value = localized.get(field)

        if isinstance(value, dict):
            localized[field] = value.get(lang, value.get(DEFAULT_LANG))

    return localized


def load_data(filename: str):
    file_path = DATA_DIR / filename

    try:
        with open(file_path, "r", encoding="utf-8") as file:
            return json.load(file)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"No se encontró {filename}")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail=f"JSON inválido: {filename}")


def load_scientific_locations() -> list[dict]:
    """Ubicaciones de locations.json; lista vacía si el archivo no existe o está vacío."""

    file_path = DATA_DIR / "locations.json"

    if not file_path.exists():
        return []

    content = file_path.read_text(encoding="utf-8").strip()

    if not content:
        return []

    try:
        stored = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="JSON inválido: locations.json")

    return (stored or {}).get("locations") or []


def _is_number(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def merge_scientific_data(sites, locations=None):
    """Sobrescribe campo por campo los valores de sites.json con datos reales.

    Un campo solo se reemplaza si el location trae un valor; si falta o es
    null se conserva el valor escrito a mano en sites.json. Los locations cuyo
    id no existe en sites.json se ignoran. Cada sitio recibe ``dataSource``:
    "real" si se aplicó al menos un dato y "placeholder" si no.
    """

    if locations is None:
        locations = load_scientific_locations()

    locations_by_id = {
        location["id"]: location
        for location in locations
        if isinstance(location, dict) and location.get("id")
    }

    for site in sites:
        location = locations_by_id.get(site.get("id")) or {}
        applied = False

        coordinates = location.get("coordinates") or {}
        temperature = location.get("temperature") or {}
        comparison = location.get("comparison") or {}
        result = comparison.get(site.get("target")) or {}

        updates = [
            (site, "lat", coordinates.get("latitude")),
            (site, "lng", coordinates.get("longitude")),
            (site.setdefault("factors", {}), "tempMin", temperature.get("minimum_c")),
            (site.setdefault("factors", {}), "tempMax", temperature.get("maximum_c")),
        ]

        for container, key, value in updates:
            if _is_number(value):
                container[key] = value
                applied = True

        score = result.get("score")

        if _is_number(score) and 0 <= score <= 100:
            site["similarity"] = score / 100
            applied = True

        site["dataSource"] = "real" if applied else "placeholder"

    return sites


@router.get("/sites")
def get_sites(lang: str = DEFAULT_LANG):
    sites = merge_scientific_data(load_data("sites.json"))
    return [localize(site, lang) for site in sites]


@router.get("/sites/{site_id}")
def get_site(site_id: str, lang: str = DEFAULT_LANG):
    for site in get_sites(lang):
        if site.get("id") == site_id:
            return site

    raise HTTPException(status_code=404, detail="Site not found")


@router.get("/bases")
def get_bases(lang: str = DEFAULT_LANG):
    measurements = load_planetary_measurements()
    bases = load_data("bases.json")
    apply_base_measurements(bases, measurements)
    return [localize(base, lang) for base in bases]
