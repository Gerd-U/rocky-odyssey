
from typing import Optional

from app.models.location import Location
from app.services.scoring import calculate_planetary_scores


def compare_location(
    location: Location,
    mars_similarities: dict[str, Optional[float]],
    moon_similarities: dict[str, Optional[float]],
    weights: Optional[dict[str, float]] = None
) -> dict:
    """
    Comparar una ubicación terrestre con Marte y la Luna.
    """

    scores = calculate_planetary_scores(
        mars_similarities,
        moon_similarities,
        weights
    )

    return {
        "location_id": location.id,
        "location_name": location.name,
        "country": location.country,
        "coordinates": location.coordinates.model_dump(),
        "comparison": scores
    }
