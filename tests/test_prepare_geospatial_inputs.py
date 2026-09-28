import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("prepare_geo", ROOT / "scripts" / "prepare_geospatial_inputs.py")
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader
SPEC.loader.exec_module(MODULE)


def test_osm_tag_parser_and_hospital_definition():
    value = '"amenity"=>"hospital","maternity"=>"no","oneway"=>"no"'
    tags = MODULE.tags(value)
    assert tags["amenity"] == "hospital"
    assert tags["maternity"] == "no"
    assert MODULE.hospital_destinations is not None


def test_speed_profile_has_requested_classes():
    assert MODULE.SPEEDS_KMH["primary"] == 60
    assert MODULE.SPEEDS_KMH["secondary"] == 40
    assert MODULE.SPEEDS_KMH["tertiary"] == 20


def test_all_model_centroids_match_gadm_boundary():
    import csv
    from shapely.geometry import Point

    rows = list(csv.DictReader(open(ROOT / "data" / "model_inputs" / "territorial_demographics.csv", encoding="utf-8")))
    for row in rows:
        geometry, source = MODULE.load_boundary(
            row["country"],
            Point(float(row["longitude"]), float(row["latitude"])),
            ROOT / "data" / "geospatial" / "boundaries",
        )
        assert geometry.covers(Point(float(row["longitude"]), float(row["latitude"])))
        assert "_2.shp" in source or "_1.shp" in source
