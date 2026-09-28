import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("who_mmr", ROOT / "scripts" / "anchor_baseline_mmr_from_who.py")
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader
SPEC.loader.exec_module(MODULE)


def test_who_mmr_2023_has_one_national_value_per_country():
    estimates = MODULE.who_estimates(2023)
    assert {country: round(float(value["horizon_mmr"]), 6) for country, value in estimates.items()} == {
        "Ethiopia": 194.936852, "Ghana": 234.32322, "Kenya": 378.795784,
        "Tanzania": 275.843788, "Uganda": 170.310484,
    }


def test_mmr_anchor_preserves_country_relative_patterns_and_weighted_target():
    rows, _ = MODULE.read_csv(MODULE.DEMOGRAPHICS)
    estimates = MODULE.who_estimates(2023)
    anchored = MODULE.anchor(rows, estimates)
    for country, estimate in estimates.items():
        before = [row for row in rows if row["country"] == country]
        after = [row for row in anchored if row["country"] == country]
        ratios = {
            round(float(next(x for x in after if x["territory_id"] == row["territory_id"])["baseline_mmr"]) / float(row["baseline_mmr"]), 10)
            for row in before
        }
        assert len(ratios) == 1
        births = sum(float(row["annual_births"]) for row in after)
        mean = sum(float(row["annual_births"]) * float(row["baseline_mmr"]) for row in after) / births
        assert abs(mean - float(estimate["horizon_mmr"])) < 1e-8
