
from app.models.location import Location
from app.services.comparison import compare_location


def test_compare_location_calculates_and_returns_both_targets():
    location = Location(
        id="test-001",
        name="Test Location",
        country="Costa Rica",
        coordinates={"latitude": 10.0, "longitude": -84.0},
    )
    mars = {
        "geology": 90,
        "topography": 80,
        "temperature": 75,
        "ice_water": 60,
        "dust_atmosphere": 85,
        "habitability": 50,
        "subsurface": 70,
    }
    moon = {
        "geology": 80,
        "topography": 95,
        "temperature": 40,
        "ice_water": 70,
        "dust_atmosphere": 90,
        "habitability": 30,
        "subsurface": 85,
    }

    result = compare_location(location, mars, moon)

    assert result["location_id"] == location.id
    assert result["comparison"]["mars"]["score"] == 72.86
    assert result["comparison"]["moon"]["score"] == 70.0
    assert result["comparison"]["mars"]["coverage_percent"] == 100
