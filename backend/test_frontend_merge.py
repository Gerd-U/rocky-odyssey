import json
import shutil
from pathlib import Path

import pytest

from app.routes import frontend_data as frontend_route

BACKEND_DIR = Path(__file__).resolve().parent
REAL_DATA_DIR = BACKEND_DIR / "data"
FIXTURE_LOCATIONS = BACKEND_DIR / "fixtures" / "test_locations.json"


def load_backup_sites():
    with open(REAL_DATA_DIR / "sites.json", encoding="utf-8") as file:
        return json.load(file)


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


def without_data_source(sites):
    return [
        {key: value for key, value in site.items() if key != "dataSource"}
        for site in sites
    ]


def test_repository_locations_file_is_empty():
    stored = json.loads((REAL_DATA_DIR / "locations.json").read_text(encoding="utf-8"))

    assert stored == {"locations": []}


def test_empty_locations_returns_backup_values_as_placeholder(data_dir):
    write_locations(data_dir, [])

    sites = frontend_route.get_sites()

    assert without_data_source(sites) == load_backup_sites()
    assert {site["dataSource"] for site in sites} == {"placeholder"}


@pytest.mark.parametrize("content", [None, "", '{"locations": null}', "{}"])
def test_missing_or_blank_locations_file_does_not_fail(data_dir, content):
    if content is not None:
        (data_dir / "locations.json").write_text(content, encoding="utf-8")

    sites = frontend_route.get_sites()

    assert without_data_source(sites) == load_backup_sites()
    assert {site["dataSource"] for site in sites} == {"placeholder"}


def test_test_fixture_ids_do_not_match_any_site_and_are_ignored(data_dir):
    shutil.copy(FIXTURE_LOCATIONS, data_dir / "locations.json")

    sites = frontend_route.get_sites()

    assert without_data_source(sites) == load_backup_sites()
    assert {site["dataSource"] for site in sites} == {"placeholder"}


def test_matching_location_replaces_values_only_for_that_site(data_dir):
    backup = load_backup_sites()
    target_site = backup[0]
    target = target_site["target"]
    write_locations(data_dir, [
        {
            "id": target_site["id"],
            "coordinates": {"latitude": -10.5, "longitude": 20.25},
            "temperature": {"minimum_c": -30, "maximum_c": 45},
            "comparison": {target: {"score": 42}},
        },
        {"id": "not-in-sites", "coordinates": {"latitude": 1, "longitude": 2}},
    ])

    sites = frontend_route.get_sites()
    by_id = {site["id"]: site for site in sites}
    merged = by_id[target_site["id"]]

    assert merged["lat"] == -10.5
    assert merged["lng"] == 20.25
    assert merged["factors"]["tempMin"] == -30
    assert merged["factors"]["tempMax"] == 45
    assert merged["similarity"] == pytest.approx(0.42)
    assert merged["dataSource"] == "real"
    assert "not-in-sites" not in by_id

    others = [site for site in sites if site["id"] != target_site["id"]]
    assert without_data_source(others) == backup[1:]
    assert {site["dataSource"] for site in others} == {"placeholder"}


def test_incomplete_location_mixes_new_values_with_backup(data_dir):
    backup = load_backup_sites()
    target_site = backup[0]
    other_target = "moon" if target_site["target"] == "mars" else "mars"
    write_locations(data_dir, [
        {
            "id": target_site["id"],
            "coordinates": {"latitude": -11.0, "longitude": None},
            "temperature": {"minimum_c": None, "maximum_c": 38},
            # Solo trae score del otro cuerpo: no debe tocar la similitud.
            "comparison": {other_target: {"score": 10}},
        },
    ])

    merged = frontend_route.get_site(target_site["id"])

    assert merged["lat"] == -11.0
    assert merged["lng"] == target_site["lng"]
    assert merged["factors"]["tempMin"] == target_site["factors"]["tempMin"]
    assert merged["factors"]["tempMax"] == 38
    assert merged["factors"]["precipMm"] == target_site["factors"]["precipMm"]
    assert merged["factors"]["terrain"] == target_site["factors"]["terrain"]
    assert merged["similarity"] == target_site["similarity"]
    assert merged["name"] == target_site["name"]
    assert merged["dataSource"] == "real"


def test_location_with_only_nulls_stays_placeholder(data_dir):
    target_site = load_backup_sites()[0]
    write_locations(data_dir, [
        {
            "id": target_site["id"],
            "coordinates": {"latitude": None, "longitude": None},
            "temperature": {"minimum_c": None, "maximum_c": None},
            "comparison": None,
        },
    ])

    merged = frontend_route.get_site(target_site["id"])

    assert merged["dataSource"] == "placeholder"
    assert {k: v for k, v in merged.items() if k != "dataSource"} == target_site
