
import pytest

from app.services.prioritization import calculate_priority


def test_low_research_priority():
    result = calculate_priority(90, "low", 100)

    assert result["priority_score"] == 94


def test_medium_research_priority():
    result = calculate_priority(90, "medium", 100)

    assert result["priority_score"] == 81.5


def test_high_research_priority():
    result = calculate_priority(90, "high", 100)

    assert result["priority_score"] == 69


def test_invalid_similarity():
    assert calculate_priority(120, "low", 100) is None


def test_invalid_coverage():
    assert calculate_priority(90, "low", 150) is None


def test_invalid_research_level():
    assert calculate_priority(90, "unknown", 100) is None


def test_missing_similarity():
    assert calculate_priority(None, "low", 100) is None


def test_boolean_similarity():
    assert calculate_priority(True, "low", 100) is None


def test_research_level_case_insensitive():
    result = calculate_priority(90, "LOW", 100)

    assert result["research_score"] == 100
