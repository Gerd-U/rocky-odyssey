
import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api", tags=["Frontend"])

DATA_DIR = Path(__file__).resolve().parents[2] / "data"


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
def get_sites():
    sites = load_data("sites.json")
    return merge_scientific_data(sites)


@router.get("/sites/{site_id}")
def get_site(site_id: str):
    for site in get_sites():
        if site.get("id") == site_id:
            return site

    raise HTTPException(status_code=404, detail="Site not found")


@router.get("/bases")
def get_bases():
    return load_data("bases.json")
