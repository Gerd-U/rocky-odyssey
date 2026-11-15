
from math import isfinite


RESEARCH_SCORES = {
    "low": 100,
    "medium": 50,
    "high": 0
}

SIMILARITY_WEIGHT = 0.60
RESEARCH_WEIGHT = 0.25
COVERAGE_WEIGHT = 0.15


def calculate_priority(
    similarity_score,
    research_level,
    coverage_percent
):
    """Calcula la prioridad de una ubicación."""

    # Validar similitud
    if (
        not isinstance(similarity_score, (int, float))
        or isinstance(similarity_score, bool)
        or not isfinite(similarity_score)
        or not 0 <= similarity_score <= 100
    ):
        return None

    # Validar cobertura
    if (
        not isinstance(coverage_percent, (int, float))
        or isinstance(coverage_percent, bool)
        or not isfinite(coverage_percent)
        or not 0 <= coverage_percent <= 100
    ):
        return None

    # Validar nivel de investigación
    if not isinstance(research_level, str):
        return None

    research_level = research_level.lower().strip()

    research_score = RESEARCH_SCORES.get(research_level)

    if research_score is None:
        return None

    # Calcular prioridad ponderada
    priority = (
        similarity_score * SIMILARITY_WEIGHT
        + research_score * RESEARCH_WEIGHT
        + coverage_percent * COVERAGE_WEIGHT
    )

    return {
        "similarity_score": round(similarity_score, 2),
        "research_score": research_score,
        "coverage_score": round(coverage_percent, 2),
        "priority_score": round(priority, 2),
        "research_level": research_level
    }
