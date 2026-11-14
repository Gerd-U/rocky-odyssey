
from app.models.location import Location
from app.services.data_processor import prepare_location_data


location = Location(
    id="test-002",
    name="Test Desert",
    country="Costa Rica",
    coordinates={
        "latitude": 10.0,
        "longitude": -84.0
    },
    geology={
        "composition": "Volcanic rock",
        "rock_types": ["Basalt"],
        "minerals": ["Olivine"]
    },
    temperature={
        "minimum_c": 10,
        "maximum_c": 30,
        "average_c": 20
    }
)

result = prepare_location_data(location)

print("ROCKY ODYSSEY - DATA PROCESSOR")
print(result["validation"])
print("Ready for comparison:", result["ready_for_comparison"])
