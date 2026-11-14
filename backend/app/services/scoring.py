
from typing import Optional


# Variables que utiliza Rocky Odyssey
CRITERIA = [
    "geology",
    "topography",
    "temperature",
    "ice_water",
    "dust_atmosphere",
    "habitability",
    "subsurface"
]


def calculate_score(
    similarities: dict[str, Optional[float]],
    weights: Optional[dict[str, float]] = None
) -> dict:
    """
    Calcula el score de similitud de una ubicación.

    Cada similitud debe estar entre 0 y 100.
    Los criterios sin datos se excluyen del cálculo.
    """

    if weights is None:
        weights = {
            criterion: 1.0 for criterion in CRITERIA
        }

    total_weight = 0
    weighted_score = 0
    evaluated_criteria = []
    missing_criteria = []

    for criterion in CRITERIA:

        similarity = similarities.get(criterion)
        weight = weights.get(criterion, 0)

        if similarity is None:
            missing_criteria.append(criterion)
            continue

        if not 0 <= similarity <= 100:
            raise ValueError(
                f"Invalid similarity for {criterion}"
            )

        if weight < 0:
            raise ValueError(
                f"Weight cannot be negative: {criterion}"
            )

        if weight == 0:
            continue

        weighted_score += similarity * weight
        total_weight += weight

        evaluated_criteria.append(criterion)

    if total_weight == 0:
        return {
            "score": None,
            "evaluated_criteria": [],
            "missing_criteria": CRITERIA,
            "coverage_percent": 0,
            "status": "insufficient_data"
        }

    final_score = weighted_score / total_weight

    coverage = (
        len(evaluated_criteria) / len(CRITERIA)
    ) * 100

    return {
        "score": round(final_score, 2),
        "evaluated_criteria": evaluated_criteria,
        "missing_criteria": missing_criteria,
        "coverage_percent": round(coverage, 2),
        "status": "calculated"
    }


def calculate_planetary_scores(
    mars_similarities: dict,
    moon_similarities: dict,
    weights: Optional[dict] = None
) -> dict:

    return {
        "mars": calculate_score(
            mars_similarities, weights
        ),
        "moon": calculate_score(
            moon_similarities, weights
        )
    }
