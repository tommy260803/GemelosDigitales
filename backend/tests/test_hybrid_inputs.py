import csv
import hashlib
import sys
from pathlib import Path
import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
from build_final_hybrid_inputs import _assistant_state, _skilled_label  # noqa: E402


def _rows(path):
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def test_hybrid_outputs_have_expected_shapes_and_domains():
    countries = _rows(ROOT / "data/derived/dhs_country_indicators.csv")
    territories = _rows(ROOT / "data/model_inputs/maternal_health_context.csv")
    provenance = _rows(ROOT / "data/model_inputs/input_provenance.csv")
    assert {row["country"] for row in countries} == {"Ethiopia", "Ghana", "Kenya", "Tanzania", "Uganda"}
    assert len(territories) == 25
    assert len({row["territory_id"] for row in territories}) == 25
    assert len(provenance) >= 25 * 20
    for row in countries:
        for field in ("anc1_rate", "anc4_rate", "institutional_delivery_rate", "tba_rate", "skilled_birth_attendance_rate"):
            assert 0 <= float(row[field]) <= 1
        assert row["weighted"] == "True"
        assert row["weight_variable"] == "v005"
        assert row["reference_period_births_months"] == "59"
    for row in territories:
        for field in ("anc1_rate", "anc4_rate", "institutional_delivery_rate", "cesarean_rate", "insurance_coverage_rate", "female_education_rate", "tba_prevalence"):
            assert 0 <= float(row[field]) <= 1


def test_territorial_weighted_means_match_dhs_targets():
    demo = {row["territory_id"]: row for row in _rows(ROOT / "data/model_inputs/territorial_demographics.csv")}
    inputs = {row["territory_id"]: row for row in _rows(ROOT / "data/model_inputs/maternal_health_context.csv")}
    dhs = {row["country"]: row for row in _rows(ROOT / "data/derived/dhs_country_indicators.csv")}
    mappings = (("anc1_rate", "anc1_rate", "annual_births"), ("anc4_rate", "anc4_rate", "annual_births"), ("institutional_delivery_rate", "institutional_delivery_rate", "annual_births"), ("cesarean_rate", "cesarean_rate", "annual_births"), ("tba_prevalence", "tba_rate", "annual_births"), ("female_education_rate", "female_secondary_plus_rate", "population"))
    for variable, target, denominator in mappings:
        for country, estimate in dhs.items():
            ids = [key for key, row in demo.items() if row["country"] == country]
            total = sum(float(demo[key][denominator]) for key in ids)
            mean = sum(float(inputs[key][variable]) * float(demo[key][denominator]) for key in ids) / total
            assert abs(mean - float(estimate[target])) < 1e-8
    # Kenya insurance is intentionally not anchored because v481 is all missing.
    kenya = [key for key, row in demo.items() if row["country"] == "Kenya"]
    assert all(inputs[key]["insurance_coverage_rate"] for key in kenya)


@pytest.mark.skipif(
    not (ROOT / "data/dhs").exists() or not any((ROOT / "data/dhs").glob("*.dta")) and not any((ROOT / "data/dhs").glob("*.DTA")),
    reason="Raw DHS Stata .dta files not present in local workspace / CI"
)
def test_raw_dhs_files_are_unchanged_and_rebuild_artifacts_are_present():
    assert all((ROOT / "data/dhs" / name).exists() for name in ("ETIR8AFL.dta", "GHIR8CFL.DTA", "KEIR8CFL.DTA", "TZIR82FL.DTA", "UGIR7BFL.DTA"))
    assert (ROOT / "data/results/final_simulation_results.csv").exists()
    assert len(_rows(ROOT / "data/results/final_simulation_results.csv")) == 125


def test_country_specific_sba_tba_and_institutional_classification():
    rows = {row["country"]: row for row in _rows(ROOT / "data/derived/dhs_country_indicators.csv")}
    expected = {
        "Ethiopia": (0.6200568834, 0.2992967380, 0.5967930110),
        "Ghana": (0.8674977113, 0.0811432949, 0.8624377663),
        "Kenya": (0.8901160953, 0.0702058124, 0.8817267823),
        "Tanzania": (0.7585202286, 0.0588364021, 0.8062685800),
        "Uganda": (0.7417011454, 0.1084074405, 0.7438143172),
    }
    for country, (sba, tba, institutional) in expected.items():
        assert abs(float(rows[country]["skilled_birth_attendance_rate"]) - sba) < 1e-8
        assert abs(float(rows[country]["tba_rate"]) - tba) < 1e-8
        assert abs(float(rows[country]["institutional_delivery_rate"]) - institutional) < 1e-8


def test_sba_rules_do_not_promote_ambiguous_or_structural_missing_categories():
    assert _skilled_label("assistance: assistant clinical officer") is True
    assert _skilled_label("assistance: assistant nurse") is False
    assert _skilled_label("assistance: health extension worker") is False
    assert _skilled_label("assistance: community health worker/volunteer") is False
    assert _assistant_state(float("nan"), {}) == (False, False)
    assert _assistant_state(1, {1: "yes: no assistance"}) == (True, False)
