"""Export final 36-month RK4 simulation results from the FastAPI runtime API."""
from __future__ import annotations
import argparse, csv, json
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "results"
SCENARIOS = ("baseline", "scenario_a", "scenario_b", "scenario_c", "scenario_d")

def request(url: str, payload: dict | None = None):
    body = json.dumps(payload).encode() if payload is not None else None
    headers = {"Content-Type": "application/json"} if body else {}
    with urlopen(Request(url, data=body, headers=headers), timeout=60) as response:
        return json.load(response)

def write(path: Path, rows: list[dict]):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0])); writer.writeheader(); writer.writerows(rows)

def main(base_url: str):
    districts = request(f"{base_url}/districts")
    territorial = []
    for district in districts:
        for scenario in SCENARIOS:
            run = request(f"{base_url}/simulation/run", {"district_id": district["id"], "scenario_id": scenario, "months": 36})
            summary, last = run["summary"], run["trajectories"][-1]
            territorial.append({
                "territory_id": district["id"], "territory_name": district["name"], "country": district["country"], "scenario": scenario,
                "cumulative_births": summary["total_births"], "cumulative_maternal_deaths": summary["total_maternal_deaths"], "horizon_mmr": summary["horizon_mmr"],
                "deaths_avoided": summary["deaths_avoided"], "mortality_reduction_percent": summary["mortality_reduction_percent"], "anc_coverage_final": summary["anc_coverage_final"],
                "facility_delivery_rate_final": summary["facility_delivery_rate_final"], "delay_2_hours": last["phase2_delay_hours"], "facility_delay_index": last["facility_delay_index"],
                "complications": last["total_complications"], "referrals": last["emergency_referrals"], "unreferred_complications": last["unreferred_complications"],
                "deaths_home": last["maternal_deaths_home"], "deaths_transit": last["maternal_deaths_transit"], "deaths_facility": last["maternal_deaths_facility"],
                "quality_factor": last["quality_factor"], "congestion": last["facility_congestion_index"], "total_cost_usd": summary["total_cost_usd"],
                "incremental_cost_usd": summary["incremental_cost_usd"], "cost_per_death_avoided_usd": summary["cost_per_death_avoided_usd"],
            })
    write(OUT / "final_simulation_results.csv", territorial)
    aggregate = []
    for key in sorted({(row["country"], row["scenario"]) for row in territorial}):
        rows = [row for row in territorial if (row["country"], row["scenario"]) == key]
        births, deaths = sum(row["cumulative_births"] for row in rows), sum(row["cumulative_maternal_deaths"] for row in rows)
        aggregate.append({"country": key[0], "scenario": key[1], "cumulative_births": births, "cumulative_maternal_deaths": deaths, "horizon_mmr": deaths / births * 100000, "deaths_avoided": sum(row["deaths_avoided"] for row in rows), "total_cost_usd": sum(row["total_cost_usd"] for row in rows), "incremental_cost_usd": sum(row["incremental_cost_usd"] for row in rows)})
    write(OUT / "final_country_results.csv", aggregate)
    global_rows = []
    for scenario in SCENARIOS:
        rows = [row for row in territorial if row["scenario"] == scenario]
        births, deaths = sum(row["cumulative_births"] for row in rows), sum(row["cumulative_maternal_deaths"] for row in rows)
        global_rows.append({"scenario": scenario, "cumulative_births": births, "cumulative_maternal_deaths": deaths, "horizon_mmr": deaths / births * 100000, "deaths_avoided": sum(row["deaths_avoided"] for row in rows), "mortality_reduction_percent": 0 if scenario == "baseline" else (1 - deaths / global_rows[0]["cumulative_maternal_deaths"]) * 100, "total_cost_usd": sum(row["total_cost_usd"] for row in rows), "incremental_cost_usd": sum(row["incremental_cost_usd"] for row in rows)})
    write(OUT / "final_global_results.csv", global_rows)
    print(f"Exported {len(territorial)} territorial, {len(aggregate)} country and {len(global_rows)} global result rows.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(); parser.add_argument("--base-url", default="http://localhost:8000")
    main(parser.parse_args().base_url.rstrip("/"))
