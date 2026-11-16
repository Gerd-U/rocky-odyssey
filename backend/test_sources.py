from app.services.data_processor import validate_sources


def test_validate_complete_source():
    result = validate_sources(
        [
            {
                "name": "Test source",
                "organization": "Test organization",
                "url": "https://example.org/source",
                "criteria_supported": ["geology", "temperature"],
                "accessed_at": "2026-11-14",
            }
        ]
    )

    assert result["valid"] is True
    assert result["total_sources"] == 1
    assert result["errors"] == []


def test_reject_invalid_source_fields():
    result = validate_sources(
        [{"name": "   ", "url": "not-a-url", "criteria_supported": ["geology", "invalid"]}]
    )

    assert result["valid"] is False
    assert any("missing name" in error for error in result["errors"])
    assert any("invalid URL" in error for error in result["errors"])
    assert any("invalid criterion" in error for error in result["errors"])


def test_reject_malformed_source_shape():
    result = validate_sources(["not-an-object"])

    assert result["valid"] is False
    assert result["errors"] == ["Source 1: must be an object"]


def test_reject_non_list_sources_and_criteria():
    invalid_collection = validate_sources({"name": "not a list"})
    invalid_criteria = validate_sources(
        [{"name": "Test source", "criteria_supported": "geology"}]
    )

    assert invalid_collection["valid"] is False
    assert invalid_collection["errors"] == ["Sources must be a list"]
    assert invalid_criteria["valid"] is False
    assert "criteria_supported must be a list" in invalid_criteria["errors"][0]


def test_missing_sources_are_a_warning():
    result = validate_sources([])

    assert result["valid"] is True
    assert result["total_sources"] == 0
    assert result["warnings"] == ["Location has no registered scientific sources"]
