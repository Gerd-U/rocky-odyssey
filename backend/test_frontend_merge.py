import copy
import json
import shutil
from pathlib import Path

import pytest

from app.routes import frontend_data as frontend_route

BACKEND_DIR = Path(__file__).resolve().parent
REAL_DATA_DIR = BACKEND_DIR / "data"
FIXTURE_LOCATIONS = BACKEND_DIR / "fixtures" / "test_locations.json"


def load_backup_sites(lang="en"):
    """sites.json con los campos bilingües ya resueltos, como los devuelve la API."""

    with open(REAL_DATA_DIR / "sites.json", encoding="utf-8") as file:
        sites = json.load(file)

    return [
        {
            key: value[lang] if isinstance(value, dict) and set(value) == {"es", "en"} else value
            for key, value in site.items()
        }
        for site in sites
    ]


@pytest.fixture
def data_dir(monkeypatch, tmp_path):
    """Carpeta data/ temporal con el sites.json real y sin locations.json."""

    shutil.copy(REAL_DATA_DIR / "sites.json", tmp_path / "sites.json")
    monkeypatch.setattr(frontend_route, "DATA_DIR", tmp_path)
    return tmp_path


def write_locations(data_dir, locations):
    (data_dir / "locations.json").write_text(
        json.dumps({"locations": locations}), encoding="utf-8"
    )


def site_with_matches(backup):
    """Primer sitio que tiene base emparejada en la Luna y en Marte."""

    return next(site for site in backup if {"moon", "mars"} <= set(site["matches"]))


def test_repository_locations_file_is_empty():
    stored = json.loads((REAL_DATA_DIR / "locations.json").read_text(encoding="utf-8"))

    assert stored == {"locations": []}


def test_empty_locations_returns_sites_json_unchanged(data_dir):
    write_locations(data_dir, [])

    sites = frontend_route.get_sites()

    assert sites == load_backup_sites()
    assert {site["dataSource"] for site in sites} == {"real"}


@pytest.mark.parametrize("content", [None, "", '{"locations": null}', "{}"])
def test_missing_or_blank_locations_file_does_not_fail(data_dir, content):
    if content is not None:
        (data_dir / "locations.json").write_text(content, encoding="utf-8")

    assert frontend_route.get_sites() == load_backup_sites()


def test_test_fixture_ids_do_not_match_any_site_and_are_ignored(data_dir):
    shutil.copy(FIXTURE_LOCATIONS, data_dir / "locations.json")

    assert frontend_route.get_sites() == load_backup_sites()


def test_matching_location_replaces_values_only_for_that_site(data_dir):
    backup = load_backup_sites()
    target_site = site_with_matches(backup)
    write_locations(data_dir, [
        {
            "id": target_site["id"],
            "coordinates": {"latitude": -10.5, "longitude": 20.25},
            "temperature": {"minimum_c": -30, "maximum_c": 45},
            "comparison": {"moon": {"score": 42}},
        },
        {"id": "not-in-sites", "coordinates": {"latitude": 1, "longitude": 2}},
    ])

    sites = frontend_route.get_sites()
    by_id = {site["id"]: site for site in sites}
    merged = by_id[target_site["id"]]

    assert merged["lat"] == -10.5
    assert merged["lng"] == 20.25
    assert merged["metrics"]["tempMinC"] == -30
    assert merged["metrics"]["tempMaxC"] == 45
    assert merged["matches"]["moon"]["score"] == pytest.approx(0.42)
    assert merged["matches"]["moon"]["baseId"] == target_site["matches"]["moon"]["baseId"]
    assert merged["matches"]["mars"] == target_site["matches"]["mars"]
    assert merged["dataSource"] == "real"
    assert "not-in-sites" not in by_id

    others = [site for site in sites if site["id"] != target_site["id"]]
    assert others == [site for site in backup if site["id"] != target_site["id"]]


def test_incomplete_location_mixes_new_values_with_backup(data_dir):
    target_site = site_with_matches(load_backup_sites())
    write_locations(data_dir, [
        {
            "id": target_site["id"],
            "coordinates": {"latitude": -11.0, "longitude": None},
            "temperature": {"minimum_c": None, "maximum_c": 38},
            # Score fuera de rango: se ignora y la similitud se queda como estaba.
            "comparison": {"mars": {"score": 140}},
        },
    ])

    merged = frontend_route.get_site(target_site["id"])

    assert merged["lat"] == -11.0
    assert merged["lng"] == target_site["lng"]
    assert merged["metrics"]["tempMinC"] == target_site["metrics"]["tempMinC"]
    assert merged["metrics"]["tempMaxC"] == 38
    assert merged["metrics"]["roughnessM"] == target_site["metrics"]["roughnessM"]
    assert merged["matches"] == target_site["matches"]
    assert merged["name"] == target_site["name"]
    assert merged["dataSource"] == "real"


def test_location_with_only_nulls_changes_nothing(data_dir):
    target_site = load_backup_sites()[0]
    write_locations(data_dir, [
        {
            "id": target_site["id"],
            "coordinates": {"latitude": None, "longitude": None},
            "temperature": {"minimum_c": None, "maximum_c": None},
            "comparison": None,
        },
    ])

    assert frontend_route.get_site(target_site["id"]) == target_site


def test_site_without_data_source_is_marked_placeholder_or_real():
    site = {"id": "x", "lat": 1, "lng": 2, "metrics": {}, "matches": {}}

    untouched = frontend_route.merge_scientific_data([copy.deepcopy(site)], [])[0]
    updated = frontend_route.merge_scientific_data(
        [copy.deepcopy(site)], [{"id": "x", "coordinates": {"latitude": 5}}]
    )[0]

    assert untouched["dataSource"] == "placeholder"
    assert updated["dataSource"] == "real"
    assert updated["lat"] == 5
