
from app.models.location import Location
from app.services.comparison import compare_location


location = Location(
    id="test-001",
    name="Test Location",
    country="Costa Rica",
    coordinates={
        "latitude": 10.0,
        "longitude": -84.0
    }
)

mars = {
    "geology": 90,
    "topography": 80,
    "temperature": 75,
    "ice_water": 60,
    "dust_atmosphere": 85,
    "habitability": 50,
    "subsurface": 70
}

moon = {
    "geology": 80,
    "topography": 95,
    "temperature": 40,
    "ice_water": 70,
    "dust_atmosphere": 90,
    "habitability": 30,
    "subsurface": 85
}

result = compare_location(location, mars, moon)

print("ROCKY ODYSSEY - COMPARISON")
print(result)
