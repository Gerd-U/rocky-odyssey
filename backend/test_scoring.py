
from app.services.scoring import calculate_planetary_scores

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

results = calculate_planetary_scores(mars, moon)

print("ROCKY ODYSSEY - SCORING")
print(results)
