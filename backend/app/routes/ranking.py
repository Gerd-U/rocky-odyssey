
from fastapi import APIRouter
from typing import Literal

from app.storage import load_locations
from app.services.prioritization import calculate_priority

router = APIRouter(prefix="/api/ranking", tags=["Ranking"])


@router.get("/")
def create_ranking(
    target: Literal["mars", "moon"] = "mars",
    sort_by: Literal["score", "priority"] = "priority"
):
    locations = load_locations()
    valid_locations = []

    for location in locations:
        comparison = location.get("comparison") or {}
        result = comparison.get(target)

        if not result:
            continue

        score = result.get("score")
        coverage = result.get("coverage_percent")

        priority = calculate_priority(
            score,
            location.get("research_level"),
            coverage
        )

        if priority is None:
            continue

        valid_locations.append({
            "location_id": location.get("id"),
            "location_name": location.get("name"),
            "country": location.get("country"),
            "coordinates": location.get("coordinates"),
            **priority
        })

    # Ordenar los sitios según el criterio seleccionado
    if sort_by == "priority":
        valid_locations.sort(
            key=lambda item: item["priority_score"],
            reverse=True
        )
    else:
        valid_locations.sort(
            key=lambda item: item["similarity_score"],
            reverse=True
        )

    # Asignar posición en el ranking
    for position, location in enumerate(valid_locations, start=1):
        location["rank"] = position

    return {
        "target": target,
        "sort_by": sort_by,
        "total": len(valid_locations),
        "ranking": valid_locations
    }
