
import json
from pathlib import Path
from typing import Optional

from app.models.location import Location


# Ruta del archivo JSON
DATA_FILE = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "locations.json"
)


def load_locations() -> list[dict]:
    """Leer todas las ubicaciones almacenadas."""

    if not DATA_FILE.exists():
        return []

    with open(DATA_FILE, "r", encoding="utf-8") as file:
        data = json.load(file)

    return data.get("locations", [])


def save_locations(locations: list[dict]) -> None:
    """Guardar todas las ubicaciones en JSON."""

    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)

    with open(DATA_FILE, "w", encoding="utf-8") as file:
        json.dump(
            {"locations": locations},
            file,
            indent=4,
            ensure_ascii=False
        )


def get_location(location_id: str) -> Optional[dict]:
    """Buscar una ubicación por su ID."""

    locations = load_locations()

    for location in locations:
        if location["id"] == location_id:
            return location

    return None


def add_location(location: Location) -> dict:
    """Agregar una nueva ubicación."""

    locations = load_locations()
    new_location = location.model_dump()

    if any(item["id"] == new_location["id"] for item in locations):
        raise ValueError("Location ID already exists")

    locations.append(new_location)
    save_locations(locations)

    return new_location


def update_location(location_id: str, location: Location) -> Optional[dict]:
    """Actualizar una ubicación existente."""

    locations = load_locations()

    for index, item in enumerate(locations):
        if item["id"] == location_id:

            updated_location = location.model_dump()
            updated_location["id"] = location_id

            locations[index] = updated_location
            save_locations(locations)

            return updated_location

    return None


def delete_location(location_id: str) -> bool:
    """Eliminar una ubicación por su ID."""

    locations = load_locations()

    updated_locations = [
        item for item in locations
        if item["id"] != location_id
    ]

    if len(updated_locations) == len(locations):
        return False

    save_locations(updated_locations)

    return True
