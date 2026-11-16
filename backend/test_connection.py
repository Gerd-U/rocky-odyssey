from app.routes.locations import get_all_locations


def test_locations_handler_returns_consistent_total():
    response = get_all_locations()

    assert isinstance(response["locations"], list)
    assert response["total"] == len(response["locations"])
