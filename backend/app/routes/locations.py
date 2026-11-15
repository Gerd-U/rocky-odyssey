
from typing import Optional

from fastapi import APIRouter, HTTPException

from app.models.location import Location
from app.storage import (
    load_locations,
    get_location,
    add_location,
    update_location,
    delete_location
)
from app.services.data_processor import validate_sources

router = APIRouter(
    prefix="/api/locations",
    tags=["Locations"]
)


# Validar las fuentes científicas
def check_location_sources(location: Location):
    sources = [
        source.model_dump()
        for source in location.sources
    ]

    validation = validate_sources(sources)

    if not validation["valid"]:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Invalid scientific sources",
                "validation": validation
            }
        )

    return validation


# Obtener todas las ubicaciones
@router.get("/")
def get_all_locations(
    country: Optional[str] = None,
    research_level: Optional[str] = None,
    name: Optional[str] = None,
    target: Optional[str] = None,
    sort_by: Optional[str] = None
):
    locations = load_locations()

    # Filtrar por país
    if country:
        locations = [
            loc for loc in locations
            if country.lower() in loc.get("country", "").lower()
        ]

    # Filtrar por nivel de investigación
    if research_level:
        locations = [
            loc for loc in locations
            if loc.get("research_level", "").lower()
            == research_level.lower()
        ]

    # Buscar por nombre
    if name:
        locations = [
            loc for loc in locations
            if name.lower() in loc.get("name", "").lower()
        ]

    # Filtrar por planeta
    if target:
        target = target.lower()

        if target not in ["mars", "moon"]:
            raise HTTPException(
                status_code=400,
                detail="Target must be mars or moon"
            )

        locations = [
            loc for loc in locations
            if loc.get("comparison", {})
            .get(target, {})
            .get("score") is not None
        ]

    # Ordenar por puntuación
    if sort_by:
        if sort_by not in ["asc", "desc"]:
            raise HTTPException(
                status_code=400,
                detail="sort_by must be asc or desc"
            )

        if not target:
            raise HTTPException(
                status_code=400,
                detail="Target is required to sort by score"
            )

        locations.sort(
            key=lambda loc: loc.get("comparison", {})
            .get(target, {})
            .get("score", 0),
            reverse=(sort_by == "desc")
        )

    return {
        "total": len(locations),
        "filters": {
            "country": country,
            "research_level": research_level,
            "name": name,
            "target": target,
            "sort_by": sort_by
        },
        "locations": locations
    }


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

    check_location_sources(location)

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

    check_location_sources(location)

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
# Consultar la calidad de los datos de una ubicación
@router.get("/{location_id}/quality")
def get_location_quality(location_id: str):

    location_data = get_location(location_id)

    if location_data is None:
        raise HTTPException(
            status_code=404,
            detail="Location not found"
        )

    location = Location(**location_data)

    from app.services.data_processor import (
        prepare_location_data
    )

    result = prepare_location_data(location)

    return {
        "location_id": location.id,
        "location_name": location.name,
        "data_validation": result["validation"],
        "sources_validation": result["sources_validation"],
        "ready_for_comparison": result["ready_for_comparison"]
    }