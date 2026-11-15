
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.storage import load_locations, save_locations
from app.services.scoring import calculate_planetary_scores

router = APIRouter(prefix="/api/comparison", tags=["Comparison"])


class ComparisonRequest(BaseModel):
    mars_similarities: dict[str, Optional[float]]
    moon_similarities: dict[str, Optional[float]]
    weights: Optional[dict[str, float]] = None


@router.post("/{location_id}")
def compare_location(location_id: str, request: ComparisonRequest):

    locations = load_locations()

    for location in locations:
        if location["id"] == location_id:

            try:
                scores = calculate_planetary_scores(
                    request.mars_similarities,
                    request.moon_similarities,
                    request.weights
                )
            except ValueError as error:
                raise HTTPException(status_code=422, detail=str(error))

            location["comparison"] = scores

            save_locations(locations)

            return {
                "message": "Comparison saved successfully",
                "location_id": location_id,
                "comparison": scores
            }

    raise HTTPException(
        status_code=404,
        detail="Location not found"
    )
