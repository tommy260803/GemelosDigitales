import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("world_bank_oop", ROOT / "scripts" / "extract_world_bank_oop.py")
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader
SPEC.loader.exec_module(MODULE)


def test_local_wdi_oop_extracts_2023_for_all_study_countries():
    rows = MODULE.read(2023)
    values = {row["country"]: round(float(row["out_of_pocket_share_current_health_expenditure_percent"]), 6) for row in rows}
    assert values == {
        "Ethiopia": 46.268593, "Ghana": 26.677233, "Kenya": 24.245653,
        "Tanzania": 27.93128, "Uganda": 32.171795,
    }
    assert all("not a delivery fee" in row["use_constraint"] for row in rows)
