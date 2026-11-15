
import pytest

from app.services.scoring import (
    CRITERIA,
    calculate_score,
    calculate_planetary_scores
)


def test_calculate_score_with_all_criteria():
    similarities = {
        "geology": 90,
        "topography": 80,
        "temperature": 75,
        "ice_water": 60,
        "dust_atmosphere": 85,
        "habitability": 50,
        "subsurface": 70
    }

    result = calculate_score(similarities)

    assert result["score"] == 72.86
    assert result["coverage_percent"] == 100
    assert result["status"] == "calculated"


def test_calculate_score_with_missing_data():
    similarities = {
        "geology": 90,
        "topography": 80,
        "temperature": None
    }

    result = calculate_score(similarities)

    assert result["score"] == 85
    assert result["coverage_percent"] == 28.57
    assert "temperature" in result["missing_criteria"]


def test_calculate_score_with_custom_weights():
    similarities = {
        "geology": 100,
        "topography": 50
    }

    weights = {
        "geology": 3,
        "topography": 1
    }

    result = calculate_score(similarities, weights)

    assert result["score"] == 87.5


def test_reject_similarity_above_100():
    with pytest.raises(ValueError):
        calculate_score({"geology": 120})


def test_reject_negative_similarity():
    with pytest.raises(ValueError):
        calculate_score({"geology": -10})


def test_reject_negative_weight():
    with pytest.raises(ValueError):
        calculate_score(
            {"geology": 80},
            {"geology": -1}
        )


def test_reject_unknown_criterion():
    with pytest.raises(ValueError):
        calculate_score({"unknown": 80})


def test_insufficient_data():
    result = calculate_score({criterion: None for criterion in CRITERIA})

    assert result["score"] is None
    assert result["status"] == "insufficient_data"
    assert result["coverage_percent"] == 0


def test_calculate_mars_and_moon():
    mars = {"geology": 90, "temperature": 80}
    moon = {"geology": 70, "temperature": 60}

    result = calculate_planetary_scores(mars, moon)

    assert result["mars"]["score"] == 85
    assert result["moon"]["score"] == 65
