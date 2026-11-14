
import math
from app.models.location import Location


def is_missing(value):
    """Determinar si un valor está vacío o no disponible."""

    if value is None:
        return True

    if isinstance(value, str) and not value.strip():
        return True

    if isinstance(value, list) and len(value) == 0:
        return True

    if isinstance(value, dict):
        return all(is_missing(v) for v in value.values())

    return False


def has_valid_values(data):
    """Comprobar que un grupo tenga información disponible."""

    values = data.model_dump()

    return any(
        not is_missing(value)
        for value in values.values()
    )


def validate_location(location: Location) -> dict:
    """Validar la calidad de los datos de una ubicación."""

    errors = []
    warnings = []
    missing_criteria = []

    # Revisar las siete variables científicas
    criteria = {
        "geology": location.geology,
        "topography": location.topography,
        "temperature": location.temperature,
        "ice_water": location.ice_water,
        "dust_atmosphere": location.dust_atmosphere,
        "habitability": location.habitability,
        "subsurface": location.subsurface
    }

    for name, data in criteria.items():

        if not has_valid_values(data):
            missing_criteria.append(name)

    # Validar temperaturas
    temperature = location.temperature

    values = [
        temperature.minimum_c,
        temperature.maximum_c,
        temperature.average_c
    ]

    for value in values:
        if value is not None and not math.isfinite(value):
            errors.append("Temperature contains a non-finite value.")

    if (
        temperature.minimum_c is not None
        and temperature.maximum_c is not None
        and temperature.minimum_c > temperature.maximum_c
    ):
        errors.append("Minimum temperature exceeds maximum temperature.")

    if (
        temperature.average_c is not None
        and temperature.minimum_c is not None
        and temperature.average_c < temperature.minimum_c
    ):
        warnings.append("Average temperature is below minimum temperature.")

    if (
        temperature.average_c is not None
        and temperature.maximum_c is not None
        and temperature.average_c > temperature.maximum_c
    ):
        warnings.append("Average temperature exceeds maximum temperature.")

    # Revisar valores numéricos
    numeric_values = {
        "elevation": location.topography.elevation_m,
        "slope": location.topography.slope_degrees,
        "roughness": location.topography.roughness,
        "humidity": location.dust_atmosphere.humidity_percent
    }

    for name, value in numeric_values.items():

        if value is not None and not math.isfinite(value):
            errors.append(f"{name} contains a non-finite value.")

    # Calcular cobertura de información
    total_criteria = len(criteria)
    available_criteria = total_criteria - len(missing_criteria)

    coverage = (available_criteria / total_criteria) * 100

    return {
        "location_id": location.id,
        "location_name": location.name,
        "valid": len(errors) == 0,
        "coverage_percent": round(coverage, 2),
        "available_criteria": available_criteria,
        "total_criteria": total_criteria,
        "missing_criteria": missing_criteria,
        "errors": errors,
        "warnings": warnings
    }


def prepare_location_data(location: Location) -> dict:
    """Preparar los datos para su posterior comparación."""

    validation = validate_location(location)

    return {
        "location": location.model_dump(),
        "validation": validation,
        "ready_for_comparison": validation["valid"]
    }
