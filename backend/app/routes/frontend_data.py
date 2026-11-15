import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api", tags=["Frontend"])

DATA_DIR = Path(__file__).resolve().parents[2] / "data"

SUPPORTED_LANGS = ("en", "es")
DEFAULT_LANG = "en"

# Campos de sites.json y bases.json que vienen como {"es": ..., "en": ...}
TRANSLATED_FIELDS = ("name", "country", "description", "missions")


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
    return [localize(base, lang) for base in load_data("bases.json")]
