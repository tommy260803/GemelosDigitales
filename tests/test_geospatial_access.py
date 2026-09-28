"""Small deterministic routing checks without importing optional GIS packages."""
import importlib.util
from pathlib import Path
from types import SimpleNamespace

import pytest


_SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "calculate_geospatial_access.py"
spec = importlib.util.spec_from_file_location("geospatial_access", _SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def test_fastest_verified_destination_and_one_way_reversal():
    # Adjacency points toward an origin because the search runs from facilities.
    graph = {1: [(2, 2.0, 30.0)], 2: [(3, 1.0, 10.0)], 4: [(2, 0.5, 2.0)]}
    paths = module.shortest_paths(graph, {1, 4})
    assert paths[3] == (1.5, 12.0)
    assert 5 not in paths


def test_distance_is_geodesic_and_nonnegative():
    assert module.haversine_km(0, 0, 0, 0) == 0
    assert 110 < module.haversine_km(0, 0, 0, 1) < 112


def test_missing_verified_inputs_cannot_generate_output(tmp_path):
    output = tmp_path / "access.csv"
    args = SimpleNamespace(
        max_snap_km=5, boundaries=tmp_path / "boundaries.geojson",
        facilities=tmp_path / "facilities.csv", speed_profile=tmp_path / "speeds.json",
        territories=tmp_path / "territories.csv", data_dir=tmp_path, output=output,
    )
    with pytest.raises(FileNotFoundError, match="Missing required input files"):
        module.run(args)
    assert not output.exists()
