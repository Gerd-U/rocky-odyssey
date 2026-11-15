
from typing import Optional
from math import isfinite


# Criterios oficiales de Rocky Odyssey
CRITERIA = [
    "geology",
    "topography",
    "temperature",
    "ice_water",
    "dust_atmosphere",
    "habitability",
    "subsurface"
]


def validate_weights(weights: Optional[dict[str, float]] = None) -> dict:
    """Valida y devuelve los pesos de los siete criterios."""

    if weights is None:
        return {criterion: 1.0 for criterion in CRITERIA}

    unknown = set(weights) - set(CRITERIA)

    if unknown:
        raise ValueError(f"Unknown criteria weights: {sorted(unknown)}")

    validated = {}

    for criterion in CRITERIA:
        weight = weights.get(criterion, 1.0)

        if not isinstance(weight, (int, float)) or isinstance(weight, bool):
            raise ValueError(f"Invalid weight for {criterion}")

        if not isfinite(weight) or weight < 0:
            raise ValueError(f"Invalid weight for {criterion}")

        validated[criterion] = float(weight)

    return validated


def calculate_score(
    similarities: dict[str, Optional[float]],
    weights: Optional[dict[str, float]] = None
) -> dict:
    """
    Calcula la similitud ponderada de una ubicación.

    Las similitudes deben estar entre 0 y 100.
    Los criterios sin datos se excluyen del cálculo.
    """

    if not isinstance(similarities, dict):
        raise ValueError("Similarities must be a dictionary")

    unknown = set(similarities) - set(CRITERIA)

    if unknown:
        raise ValueError(f"Unknown similarity criteria: {sorted(unknown)}")

    validated_weights = validate_weights(weights)

    total_weight = 0.0
    weighted_score = 0.0
    evaluated_criteria = []
    missing_criteria = []

    for criterion in CRITERIA:

        similarity = similarities.get(criterion)
        weight = validated_weights[criterion]

        if similarity is None:
            missing_criteria.append(criterion)
            continue

        if (
            not isinstance(similarity, (int, float))
            or isinstance(similarity, bool)
            or not isfinite(similarity)
            or not 0 <= similarity <= 100
        ):
            raise ValueError(
                f"Invalid similarity for {criterion}: must be between 0 and 100"
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
    """Calcula las puntuaciones independientes para Marte y la Luna."""

    validated_weights = validate_weights(weights)

    return {
        "mars": calculate_score(
            mars_similarities,
            validated_weights
        ),
        "moon": calculate_score(
            moon_similarities,
            validated_weights
        )
    }
