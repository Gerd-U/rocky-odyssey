"""Datos reales del equipo en /api/sites y /api/bases (generados por datos/scripts/generar_web.py)."""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

OLD_IDS = {
    "riotinto", "mdrs", "svalbard", "lanzarote", "hiseas", "meteorcrater",
    "islandia", "concordia", "marius", "gale",
}
OLD_FIELDS = {"factors", "target", "analogOf", "similarity", "precipMm", "terrain", "imageCredit"}
CRITERIA = {"topography", "temperature", "ice_water"}


def get_json(path, **params):
    response = client.get(path, params=params)
    assert response.status_code == 200, response.text
    return response.json()


@pytest.fixture(scope="module")
def sites():
    return get_json("/api/sites")


@pytest.fixture(scope="module")
def bases():
    return get_json("/api/bases")


def test_there_are_13_sites_and_4_bases(sites, bases):
    assert len(sites) == 13
    assert len(bases) == 4
    assert len({site["id"] for site in sites}) == 13
    assert sorted(base["body"] for base in bases) == ["mars", "mars", "moon", "moon"]


def test_old_ids_and_fields_are_gone(sites, bases):
    ids = {item["id"] for item in sites + bases}

    assert not ids & OLD_IDS
    for item in sites + bases:
        assert not OLD_FIELDS & item.keys()


def test_matches_point_to_a_base_of_the_right_body(sites, bases):
    body_by_id = {base["id"]: base["body"] for base in bases}

    for site in sites:
        assert set(site["matches"]) == {"moon", "mars"}, site["id"]
        for body, match in site["matches"].items():
            assert body_by_id[match["baseId"]] == body, (site["id"], body)


def test_match_scores_coverage_and_criteria_are_in_range(sites):
    for site in sites:
        for match in site["matches"].values():
            assert 0 <= match["score"] <= 1
            assert set(match["criteria"]) == CRITERIA
            assert 0 < match["coverage"] <= 100
            for value in match["criteria"].values():
                assert value is None or 0 <= value <= 100


def test_all_sites_are_real_data(sites, bases):
    assert {item["dataSource"] for item in sites + bases} == {"real"}


def test_sources_and_monthly_series(sites, bases):
    for site in sites:
        assert len(site["monthlyTemp"]) == 12
        assert [m["month"] for m in site["monthlyTemp"]] == list(range(1, 13))
        assert {source["variable"] for source in site["sources"]} >= {"rugosidad", "rango_termico", "hielo"}

    provisional = [
        (base["id"], source["variable"])
        for base in bases
        for source in base["sources"]
        if source.get("provisional")
    ]
    assert ("shackleton", "rango_termico") in provisional


def test_sites_without_photo_have_no_image_fields(sites):
    for site in sites:
        if site["image"] is None:
            assert site["imageAuthor"] is None
            assert site["imageLicense"] is None


@pytest.mark.parametrize("lang", ["es", "en", "xx"])
def test_single_site_in_each_lang(lang):
    site = get_json("/api/sites/valles-secos-mcmurdo", lang=lang)
    expected = "Valles Secos de McMurdo" if lang == "es" else "McMurdo Dry Valleys"

    assert site["name"] == expected
    assert isinstance(site["description"], str)


@pytest.mark.parametrize("site_id", ["mcmurdo", "riotinto", "no-existe"])
def test_unknown_or_old_site_ids_return_404(site_id):
    assert client.get(f"/api/sites/{site_id}").status_code == 404
