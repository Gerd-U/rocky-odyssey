
import math
from app.models.location import Location
from urllib.parse import urlparse

def is_missing(value):
    """Determinar si un valor está vacío o no disponible."""

    if value is None:
        return True

    if isinstance(value, str) and not value.strip():
        return True

    if isinstance(value, list):
        return not value or all(is_missing(item) for item in value)

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


def prepare_location_data(location):
    validation = validate_location(location)

    sources_validation = validate_sources(
    [source.model_dump() for source in location.sources]
)

    return {
        "location": location,
        "validation": validation,
        "sources_validation": sources_validation,
        "ready_for_comparison": (
            validation["valid"]
            and sources_validation["valid"]
        )
    }

def validate_sources(sources):
    errors = []
    warnings = []

    valid_criteria = [
        "geology",
        "topography",
        "temperature",
        "ice_water",
        "dust_atmosphere",
        "habitability",
        "subsurface"
    ]

    if not isinstance(sources, list):
        return {
            "valid": False,
            "total_sources": 0,
            "errors": ["Sources must be a list"],
            "warnings": warnings,
        }

    if not sources:
        warnings.append("Location has no registered scientific sources")

    for index, source in enumerate(sources):
        if not isinstance(source, dict):
            errors.append(f"Source {index + 1}: must be an object")
            continue

        name = source.get("name")

        if not isinstance(name, str) or not name.strip():
            errors.append(f"Source {index + 1}: missing name")

        url = source.get("url")

        if url is None or (isinstance(url, str) and not url.strip()):
            warnings.append(f"Source {index + 1}: missing URL")
        else:
            try:
                parsed_url = urlparse(url) if isinstance(url, str) else None
                valid_url = (
                    parsed_url is not None
                    and parsed_url.scheme in ["http", "https"]
                    and bool(parsed_url.netloc)
                )
            except ValueError:
                valid_url = False

            if not valid_url:
                errors.append(f"Source {index + 1}: invalid URL")

        criteria = source.get("criteria_supported", [])

        if not isinstance(criteria, list):
            errors.append(
                f"Source {index + 1}: criteria_supported must be a list"
            )
            continue

        for criterion in criteria:
            if not isinstance(criterion, str) or criterion not in valid_criteria:
                errors.append(
                    f"Source {index + 1}: invalid criterion '{criterion}'"
                )

    return {
        "valid": len(errors) == 0,
        "total_sources": len(sources),
        "errors": errors,
        "warnings": warnings
    }
