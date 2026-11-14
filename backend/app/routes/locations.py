
from fastapi import APIRouter, HTTPException

from app.models.location import Location
from app.storage import (
    load_locations,
    get_location,
    add_location,
    update_location,
    delete_location
)

router = APIRouter(
    prefix="/api/locations",
    tags=["Locations"]
)


# Obtener todas las ubicaciones
@router.get("/")
def get_all_locations():
    return load_locations()


# Obtener una ubicación por ID
@router.get("/{location_id}")
def get_location_by_id(location_id: str):

    location = get_location(location_id)

    if location is None:
        raise HTTPException(
            status_code=404,
            detail="Location not found"
        )

    return location


# Registrar una nueva ubicación
@router.post("/")
def create_location(location: Location):

    try:
        return add_location(location)

    except ValueError as error:
        raise HTTPException(
            status_code=409,
            detail=str(error)
        )


# Actualizar una ubicación
@router.put("/{location_id}")
def edit_location(location_id: str, location: Location):

    updated = update_location(location_id, location)

    if updated is None:
        raise HTTPException(
            status_code=404,
            detail="Location not found"
        )

    return updated


# Eliminar una ubicación
@router.delete("/{location_id}")
def remove_location(location_id: str):

    deleted = delete_location(location_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Location not found"
        )

    return {
        "message": "Location deleted successfully",
        "id": location_id
    }
