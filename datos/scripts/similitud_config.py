"""Similitud por criterio entre un lugar de la Tierra y una base, de 0 a 100.

El equipo puede ajustar aquí las fórmulas, escalas y pesos sin tocar generar_web.py.
Los nombres de criterio son los de backend/app/services/scoring.py (calculate_score).
"""

from math import log10
from typing import Optional

# Rango térmico: diferencia máxima (en K o °C, es lo mismo) que todavía da algo de similitud
ESCALA_RANGO = {"luna": 300.0, "marte": 100.0}

# Peso de cada criterio en calculate_score (los demás criterios de scoring.py quedan sin dato)
PESOS = {
    "topography": 1.0,    # rugosidad
    "temperature": 1.0,   # rango térmico
    "ice_water": 1.0,     # índice de frío
}


def similitud_rugosidad(a: Optional[float], b: Optional[float]) -> Optional[float]:
    """100 * max(0, 1 - |log10(1 + a) - log10(1 + b)| / 2). Escala logarítmica: 10 m y 100 m difieren 1 orden."""
    if a is None or b is None:
        return None
    return 100 * max(0.0, 1 - abs(log10(1 + a) - log10(1 + b)) / 2)


def similitud_rango(a: Optional[float], b: Optional[float], cuerpo: str) -> Optional[float]:
    """100 * max(0, 1 - |a - b| / ESCALA), con ESCALA según el cuerpo de la base."""
    if a is None or b is None:
        return None
    return 100 * max(0.0, 1 - abs(a - b) / ESCALA_RANGO[cuerpo])


def similitud_frio(a: Optional[float], b: Optional[float]) -> Optional[float]:
    """100 - |a - b|, con los dos índices de frío en %."""
    if a is None or b is None:
        return None
    return 100 - abs(a - b)


def similitudes(tierra: dict, base: dict, cuerpo: str) -> dict[str, Optional[float]]:
    """tierra y base: {"rugosidad", "rango_termico", "hielo"} (None si falta)."""
    return {
        "topography": similitud_rugosidad(tierra["rugosidad"], base["rugosidad"]),
        "temperature": similitud_rango(tierra["rango_termico"], base["rango_termico"], cuerpo),
        "ice_water": similitud_frio(tierra["hielo"], base["hielo"]),
    }
