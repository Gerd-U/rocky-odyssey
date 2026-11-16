import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app

DATA_DIR = Path(__file__).resolve().parent / "data"
TRANSLATED_FIELDS = ("name", "country", "description", "missions")

client = TestClient(app)


def raw(filename):
    return json.loads((DATA_DIR / filename).read_text(encoding="utf-8"))


def expected_value(item, field, lang):
    return item[field][lang]


def assert_strings(item):
    for field in ("name", "description", "country"):
        if field in item:
            assert isinstance(item[field], str), field
    if "missions" in item:
        assert isinstance(item["missions"], list)
        assert all(isinstance(mission, str) for mission in item["missions"])


def get_json(path, **params):
    response = client.get(path, params=params)
    assert response.status_code == 200, response.text
    return response.json()


@pytest.mark.parametrize("lang", ["en", "es"])
def test_sites_and_bases_are_resolved_to_requested_lang(lang):
    raw_sites = {site["id"]: site for site in raw("sites.json")}
    raw_bases = {base["id"]: base for base in raw("bases.json")}

    sites = get_json("/api/sites", lang=lang)
    bases = get_json("/api/bases", lang=lang)

    assert [site["id"] for site in sites] == list(raw_sites)
    assert [base["id"] for base in bases] == list(raw_bases)

    for site in sites:
        for field in TRANSLATED_FIELDS:
            assert site[field] == expected_value(raw_sites[site["id"]], field, lang)
        assert site["dataSource"] in {"real", "placeholder"}

    for base in bases:
        for field in ("name", "description"):
            assert base[field] == expected_value(raw_bases[base["id"]], field, lang)


def test_default_lang_is_english():
    assert get_json("/api/sites") == get_json("/api/sites", lang="en")
    assert get_json("/api/bases") == get_json("/api/bases", lang="en")
    assert get_json("/api/sites/atacama") == get_json("/api/sites/atacama", lang="en")


@pytest.mark.parametrize("lang", ["fr", "EN", ""])
def test_invalid_lang_falls_back_to_english(lang):
    assert get_json("/api/sites", lang=lang) == get_json("/api/sites", lang="en")
    assert get_json("/api/bases", lang=lang) == get_json("/api/bases", lang="en")
    assert get_json("/api/sites/atacama", lang=lang) == get_json("/api/sites/atacama", lang="en")


def test_spanish_and_english_differ():
    en = get_json("/api/sites/atacama", lang="en")
    es = get_json("/api/sites/atacama", lang="es")

    assert en["name"] == "Atacama Desert"
    assert es["name"] == "Desierto de Atacama"
    # Lo que no se traduce es igual en los dos idiomas
    for key in ("id", "lat", "lng", "similarity", "factors", "image", "imageAuthor", "imageLicense"):
        assert en[key] == es[key]


@pytest.mark.parametrize("lang", ["en", "es"])
def test_unknown_site_returns_404(lang):
    response = client.get("/api/sites/not-a-site", params={"lang": lang})

    assert response.status_code == 404


@pytest.mark.parametrize("lang", ["en", "es"])
def test_translated_fields_arrive_as_strings_not_objects(lang):
    for item in get_json("/api/sites", lang=lang) + get_json("/api/bases", lang=lang):
        assert_strings(item)
        assert not any(isinstance(value, dict) and "es" in value for value in item.values())

    assert_strings(get_json("/api/sites/mcmurdo", lang=lang))


def test_response_matches_frontend_types():
    site_keys = {
        "id", "name", "country", "lat", "lng", "target", "analogOf", "similarity",
        "factors", "missions", "image", "imageAuthor", "imageLicense",
        "description", "dataSource",
    }
    base_keys = {
        "id", "name", "body", "lat", "lng", "factors", "image",
        "imageAuthor", "imageLicense", "description", "scientificData",
        "factorSources", "factorDataStatus",
    }

    for site in get_json("/api/sites"):
        # twins y measures son opcionales: solo los tienen los sitios con datos reales
        assert set(site) - {"twins", "measures"} == site_keys
        if "measures" in site:
            assert set(site["measures"]) == {"thermalRange", "ice", "roughness"}
        for body, twin in site.get("twins", {}).items():
            assert body in {"moon", "mars"}
            assert set(twin) == {"analogOf", "similarity"}
    for base in get_json("/api/bases"):
        assert set(base) == base_keys
        assert isinstance(base["scientificData"], list)
        assert isinstance(base["factorSources"], dict)
        assert isinstance(base["factorDataStatus"], dict)


def test_license_codes_are_codes_not_spanish_text():
    items = get_json("/api/sites", lang="es") + get_json("/api/bases", lang="es")

    # Un lugar sin foto (image "", p. ej. Rimae Bode) no lleva licencia ni autor
    for item in items:
        if not item["image"]:
            assert item["imageLicense"] == "" and item["imageAuthor"] == ""

    licenses = {item["imageLicense"] for item in items if item["image"]}

    assert "Dominio público" not in licenses
    assert all(lic == "public-domain" or lic.startswith("CC ") for lic in licenses)
