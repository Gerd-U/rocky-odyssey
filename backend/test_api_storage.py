import json

import pytest
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app import storage
from app.main import app
from app.models.location import Location
from app.routes import comparison as comparison_route
from app.routes import frontend_data as frontend_route
from app.routes import locations as locations_route
from app.routes import ranking as ranking_route


def test_api_routes_are_registered():
    paths = app.openapi()["paths"]

    assert "/api/sites" in paths
    assert "/api/sites/{site_id}" in paths
    assert "/api/bases" in paths
    assert "/api/locations/" in paths
    assert "/api/comparison/{location_id}" in paths
    assert "/api/ranking/" in paths
    assert {"get", "post"} <= paths["/api/locations/"].keys()
    assert {"get", "put", "delete"} <= paths["/api/locations/{location_id}"].keys()
    assert "post" in paths["/api/comparison/{location_id}"]
    assert "get" in paths["/api/ranking/"]


def test_frontend_site_and_base_data_match_declared_contract():
    sites = frontend_route.get_sites()
    bases = frontend_route.get_bases()
    site_fields = {
        "id", "name", "country", "lat", "lng", "target", "analogOf",
        "similarity", "factors", "missions", "image", "imageAuthor",
        "imageLicense", "description", "dataSource",
    }
    base_fields = {
        "id", "name", "body", "lat", "lng", "factors", "image",
        "imageAuthor", "imageLicense", "description",
    }
    factor_fields = {"precipMm", "tempMin", "tempMax", "terrain"}

    assert sites and bases
    for site in sites:
        assert site_fields <= site.keys()
        assert isinstance(site["id"], str)
        assert isinstance(site["name"], str)
        assert isinstance(site["country"], str)
        assert isinstance(site["lat"], (int, float))
        assert isinstance(site["lng"], (int, float))
        assert isinstance(site["similarity"], (int, float))
        assert 0 <= site["similarity"] <= 1
        assert site["target"] in {"mars", "moon"}
        assert factor_fields <= site["factors"].keys()
        assert isinstance(site["missions"], list)

    for base in bases:
        assert base_fields <= base.keys()
        assert isinstance(base["id"], str)
        assert isinstance(base["name"], str)
        assert isinstance(base["lat"], (int, float))
        assert isinstance(base["lng"], (int, float))
        assert base["body"] in {"mars", "moon"}
        assert factor_fields <= base["factors"].keys()


def test_single_site_lookup_returns_404_for_unknown_id():
    first_site = frontend_route.get_sites()[0]

    assert frontend_route.get_site(first_site["id"]) == first_site
    with pytest.raises(HTTPException) as error:
        frontend_route.get_site("not-a-site")
    assert error.value.status_code == 404


def test_cors_middleware_allows_frontend_origin():
    middleware = next(
        item for item in app.user_middleware if item.cls is CORSMiddleware
    )

    assert middleware.kwargs["allow_origins"] == ["*"]
    assert middleware.kwargs["allow_credentials"] is False


def test_location_crud_persists_json_and_keeps_path_id(monkeypatch, tmp_path):
    monkeypatch.setattr(storage, "DATA_FILE", tmp_path / "locations.json")
    payload = {
        "id": "crud-test",
        "name": "Test location",
        "country": "Test country",
        "coordinates": {"latitude": 12.0, "longitude": -45.0},
    }
    location = Location(**payload)

    created = locations_route.create_location(location)
    assert created["id"] == "crud-test"
    saved_json = json.loads(storage.DATA_FILE.read_text(encoding="utf-8"))
    assert saved_json["locations"][0]["id"] == "crud-test"
    assert locations_route.get_location_by_id("crud-test")["name"] == "Test location"

    with pytest.raises(HTTPException) as duplicate:
        locations_route.create_location(location)
    assert duplicate.value.status_code == 409

    updated = locations_route.edit_location(
        "crud-test",
        Location(**{**payload, "id": "body-id-is-ignored", "name": "Updated"}),
    )
    assert updated["id"] == "crud-test"
    assert updated["name"] == "Updated"
    assert storage.load_locations()[0]["name"] == "Updated"

    assert locations_route.remove_location("crud-test")["id"] == "crud-test"
    assert storage.load_locations() == []
    with pytest.raises(HTTPException) as missing:
        locations_route.get_location_by_id("crud-test")
    assert missing.value.status_code == 404


def test_comparison_endpoint_calculates_and_persists_both_planets(monkeypatch):
    locations = [
        {"id": "comparison-test", "name": "Test location", "country": "Test"}
    ]
    persisted = {}
    monkeypatch.setattr(comparison_route, "load_locations", lambda: locations)
    monkeypatch.setattr(
        comparison_route,
        "save_locations",
        lambda items: persisted.update(locations=items),
    )

    result = comparison_route.compare_location(
        "comparison-test",
        comparison_route.ComparisonRequest(
            mars_similarities={"geology": 40},
            moon_similarities={"geology": 80},
        ),
    )

    assert result["comparison"]["mars"]["score"] == 40
    assert result["comparison"]["moon"]["score"] == 80
    assert persisted["locations"][0]["comparison"] == result["comparison"]

    with pytest.raises(HTTPException) as missing:
        comparison_route.compare_location(
            "missing",
            comparison_route.ComparisonRequest(
                mars_similarities={}, moon_similarities={}
            ),
        )
    assert missing.value.status_code == 404


def test_ranking_sorts_mars_and_moon_by_priority_or_similarity(monkeypatch):
    locations = [
        {
            "id": "site-a", "name": "Site A", "country": "Test",
            "coordinates": {}, "research_level": "high",
            "comparison": {
                "mars": {"score": 90, "coverage_percent": 100},
                "moon": {"score": 20, "coverage_percent": 100},
            },
        },
        {
            "id": "site-b", "name": "Site B", "country": "Test",
            "coordinates": {}, "research_level": "low",
            "comparison": {
                "mars": {"score": 80, "coverage_percent": 50},
                "moon": {"score": 95, "coverage_percent": 50},
            },
        },
    ]
    monkeypatch.setattr(ranking_route, "load_locations", lambda: locations)

    mars_priority = ranking_route.create_ranking("mars", "priority")
    mars_similarity = ranking_route.create_ranking("mars", "score")
    moon_priority = ranking_route.create_ranking("moon", "priority")
    moon_similarity = ranking_route.create_ranking("moon", "score")

    assert [row["location_id"] for row in mars_priority["ranking"]] == ["site-b", "site-a"]
    assert [row["location_id"] for row in mars_similarity["ranking"]] == ["site-a", "site-b"]
    assert [row["location_id"] for row in moon_priority["ranking"]] == ["site-b", "site-a"]
    assert [row["location_id"] for row in moon_similarity["ranking"]] == ["site-b", "site-a"]


def test_location_creation_rejects_invalid_scientific_source():
    with pytest.raises(HTTPException) as error:
        locations_route.create_location(
            Location(
                id="invalid-source",
                name="Test",
                country="Test",
                coordinates={"latitude": 0, "longitude": 0},
                sources=[{"name": "  "}],
            )
        )
    assert error.value.status_code == 422


def test_locations_list_handler_returns_count_and_filters():
    response = locations_route.get_all_locations()

    assert response["total"] == len(response["locations"])
    assert response["filters"]["target"] is None
