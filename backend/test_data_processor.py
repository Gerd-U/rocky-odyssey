
from app.models.location import Location
from app.services.data_processor import prepare_location_data, validate_location


def make_location(**overrides):
    data = {
        "id": "test-002",
        "name": "Test Desert",
        "country": "Costa Rica",
        "coordinates": {"latitude": 10.0, "longitude": -84.0},
        "geology": {
            "composition": "Test composition",
            "rock_types": ["Test rock"],
            "minerals": [],
        },
        "temperature": {"minimum_c": 10, "maximum_c": 30, "average_c": 20},
    }
    data.update(overrides)
    return Location(**data)


def test_prepare_location_reports_partial_coverage():
    result = prepare_location_data(make_location())

    assert result["validation"]["coverage_percent"] == 28.57
    assert result["validation"]["available_criteria"] == 2
    assert result["validation"]["total_criteria"] == 7
    assert result["validation"]["valid"] is True
    assert result["sources_validation"]["total_sources"] == 0


def test_validate_location_rejects_minimum_above_maximum():
    location = make_location(
        temperature={"minimum_c": 31, "maximum_c": 30, "average_c": 30}
    )

    result = validate_location(location)

    assert result["valid"] is False
    assert "Minimum temperature exceeds maximum temperature." in result["errors"]


def test_validate_location_rejects_non_finite_values():
    location = make_location(
        temperature={"minimum_c": float("-inf"), "maximum_c": 30, "average_c": 20}
    )

    result = validate_location(location)

    assert result["valid"] is False
    assert "Temperature contains a non-finite value." in result["errors"]


def test_blank_list_entries_do_not_count_as_available_criteria():
    location = make_location(
        geology={"composition": " ", "rock_types": [" "], "minerals": []},
        temperature={"minimum_c": None, "maximum_c": None, "average_c": None},
    )

    result = validate_location(location)

    assert result["coverage_percent"] == 0
    assert "geology" in result["missing_criteria"]
    assert "temperature" in result["missing_criteria"]
