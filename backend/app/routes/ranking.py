
from fastapi import APIRouter, HTTPException
from typing import Literal
from pydantic import BaseModel

router = APIRouter(prefix="/api/ranking", tags=["Ranking"])


class RankingRequest(BaseModel):
    locations: list[dict]
    target: Literal["mars", "moon"] = "mars"


@router.post("/")
def create_ranking(request: RankingRequest):
    valid_locations = []

    for location in request.locations:
        comparison = location.get("comparison", {})
        result = comparison.get(request.target)

        if not result:
            continue

        score = result.get("score")

        if score is None:
            continue

        if not isinstance(score, (int, float)) or isinstance(score, bool):
            raise HTTPException(status_code=422, detail="Invalid score")

        if not 0 <= score <= 100:
            raise HTTPException(
                status_code=422,
                detail="Score must be between 0 and 100"
            )

        if result.get("status") != "calculated":
            continue

        valid_locations.append({
            "location_id": location.get("location_id"),
            "location_name": location.get("location_name"),
            "country": location.get("country"),
            "coordinates": location.get("coordinates"),
            "score": score,
            "coverage_percent": result.get("coverage_percent")
        })

    valid_locations.sort(
        key=lambda item: item["score"],
        reverse=True
    )

    for position, location in enumerate(valid_locations, start=1):
        location["rank"] = position

    return {
        "target": request.target,
        "total": len(valid_locations),
        "ranking": valid_locations
    }
