
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


def merge_scientific_data(sites):
    stored = load_data("locations.json")
    locations = stored.get("locations", [])

    locations_by_id = {
        location["id"]: location
        for location in locations
    }

    for site in sites:
        location = locations_by_id.get(site["id"])

        if not location:
            continue

        coordinates = location.get("coordinates", {})
        temperature = location.get("temperature", {})

        if coordinates.get("latitude") is not None:
            site["lat"] = coordinates["latitude"]

        if coordinates.get("longitude") is not None:
            site["lng"] = coordinates["longitude"]

        factors = site.setdefault("factors", {})

        if temperature.get("minimum_c") is not None:
            factors["tempMin"] = temperature["minimum_c"]

        if temperature.get("maximum_c") is not None:
            factors["tempMax"] = temperature["maximum_c"]

        comparison = location.get("comparison") or {}
        target = site.get("target")
        result = comparison.get(target) or {}

        if result.get("score") is not None:
            site["similarity"] = result["score"] / 100

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
