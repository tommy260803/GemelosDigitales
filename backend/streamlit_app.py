"""
Maternal Health Digital Twin - Streamlit Evaluation UI
=======================================================
Interactive dashboard for evaluating the System Dynamics engine.
"""

import streamlit as st
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
import numpy as np
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.system_dynamics import (
    SystemDynamicsEngine, DistrictData, SCENARIO_DEFINITIONS,
    build_default_parameters
)
from services.validation import StatisticalValidationPy

# =========================================================
# PAGE CONFIGURATION
# =========================================================

st.set_page_config(
    page_title="Maternal Health Digital Twin",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1e3a5f;
    }
    .metric-card {
        background-color: #f0f2f6;
        border-radius: 10px;
        padding: 20px;
        border-left: 5px solid #1e3a5f;
    }
    .scenario-a { border-left-color: #e74c3c; }
    .scenario-b { border-left-color: #3498db; }
    .scenario-c { border-left-color: #2ecc71; }
    .scenario-d { border-left-color: #9b59b6; }
</style>
""", unsafe_allow_html=True)

# =========================================================
# DEMO DISTRICTS (for when DB is not available)
# =========================================================

DEMO_DISTRICTS = {
    'ke-garissa': DistrictData(
        id='ke-garissa', name='Garissa District', country='Kenya', region='North Eastern',
        population=841353, annual_births=29400, baseline_mmr=646.0,
        anc1_coverage=62.4, anc4_coverage=38.1, institutional_delivery_rate=46.5,
        c_section_rate=3.2, avg_distance_to_emonc=38.5, avg_travel_time_hours=3.9,
        skilled_staff_ratio=1.1, blood_bank_availability=42.0, essential_drugs_availability=68.0,
        insurance_coverage=11.2, poverty_rate=65.5, female_secondary_education=22.4,
        traditional_birth_attendant_prevalence=48.0, lat=-0.4532, lng=39.6461,
        osm_health_facilities_count=48,
        wealth_quintile_mmr={'q1_poorest': 890, 'q2_poor': 760, 'q3_middle': 610, 'q4_richer': 490, 'q5_richest': 340}
    ),
    'ug-moroto': DistrictData(
        id='ug-moroto', name='Moroto District (Karamoja)', country='Uganda', region='Karamoja',
        population=135000, annual_births=5800, baseline_mmr=690.0,
        anc1_coverage=60.5, anc4_coverage=28.0, institutional_delivery_rate=41.5,
        c_section_rate=2.2, avg_distance_to_emonc=44.0, avg_travel_time_hours=4.2,
        skilled_staff_ratio=0.9, blood_bank_availability=32.0, essential_drugs_availability=51.0,
        insurance_coverage=2.1, poverty_rate=74.2, female_secondary_education=14.5,
        traditional_birth_attendant_prevalence=54.0, lat=2.5345, lng=34.6666,
        osm_health_facilities_count=18,
        wealth_quintile_mmr={'q1_poorest': 950, 'q2_poor': 810, 'q3_middle': 660, 'q4_richer': 500, 'q5_richest': 360}
    ),
    'gh-ashanti': DistrictData(
        id='gh-ashanti', name='Kumasi Metro', country='Ghana', region='Ashanti',
        population=2800000, annual_births=84000, baseline_mmr=295.0,
        anc1_coverage=98.0, anc4_coverage=82.5, institutional_delivery_rate=88.5,
        c_section_rate=15.8, avg_distance_to_emonc=6.5, avg_travel_time_hours=0.8,
        skilled_staff_ratio=3.8, blood_bank_availability=91.0, essential_drugs_availability=94.0,
        insurance_coverage=82.0, poverty_rate=16.5, female_secondary_education=68.0,
        traditional_birth_attendant_prevalence=8.5, lat=6.6885, lng=-1.6244,
        osm_health_facilities_count=168,
        wealth_quintile_mmr={'q1_poorest': 410, 'q2_poor': 340, 'q3_middle': 275, 'q4_richer': 220, 'q5_richest': 150}
    ),
    'et-afar': DistrictData(
        id='et-afar', name='Awash & Semera Zone', country='Ethiopia', region='Afar',
        population=620000, annual_births=23500, baseline_mmr=710.0,
        anc1_coverage=44.5, anc4_coverage=24.0, institutional_delivery_rate=29.5,
        c_section_rate=1.8, avg_distance_to_emonc=56.0, avg_travel_time_hours=5.1,
        skilled_staff_ratio=0.7, blood_bank_availability=30.0, essential_drugs_availability=52.0,
        insurance_coverage=9.0, poverty_rate=68.0, female_secondary_education=14.0,
        traditional_birth_attendant_prevalence=62.0, lat=11.7925, lng=41.0089,
        osm_health_facilities_count=28,
        wealth_quintile_mmr={'q1_poorest': 975, 'q2_poor': 835, 'q3_middle': 680, 'q4_richer': 515, 'q5_richest': 365}
    ),
}

# =========================================================
# SIDEBAR
# =========================================================

st.sidebar.markdown("<h1 style='text-align: center;'>🏥 Digital Twin</h1>", unsafe_allow_html=True)
st.sidebar.markdown("<p style='text-align: center; color: gray;'>System Dynamics Engine v2.4</p>", unsafe_allow_html=True)
st.sidebar.divider()

# =========================================================
# DATA INGESTION (ETL) PIPELINE
# =========================================================
st.sidebar.subheader("📥 Data Ingestion & Calibration")
uploaded_file = st.sidebar.file_uploader("Upload DHS Microdata (.csv)", type=["csv"])

if uploaded_file is not None:
    import pandas as pd
    from services.etl_processor import process_dhs_microdata
    
    try:
        with st.spinner("Processing microdata..."):
            raw_df = pd.read_csv(uploaded_file)
            empirical_params = process_dhs_microdata(raw_df)
            
            # Calibrate the SD Engine by overwriting base district parameters in RAM
            for d_id, ep in empirical_params.items():
                if d_id in DEMO_DISTRICTS:
                    dist = DEMO_DISTRICTS[d_id]
                    dist.baseline_mmr = ep['baseline_mmr']
                    dist.anc1_coverage = ep['anc1_coverage']
                    dist.anc4_coverage = ep['anc4_coverage']
                    dist.institutional_delivery_rate = ep['institutional_delivery_rate']
            
            # Persist to PostgreSQL so React can consume it
            import psycopg2
            import os
            try:
                db_url = os.environ.get('DATABASE_URL', 'postgresql://twin_admin:secure_twin_password_2026@localhost:5433/maternal_twin_db')
                conn = psycopg2.connect(db_url)
                cur = conn.cursor()
                for d_id, ep in empirical_params.items():
                    cur.execute("""
                        UPDATE health_districts 
                        SET baseline_mmr = %s,
                            anc1_coverage = %s,
                            anc4_coverage = %s,
                            institutional_delivery_rate = %s
                        WHERE id = %s
                    """, (ep['baseline_mmr'], ep['anc1_coverage'], ep['anc4_coverage'], ep['institutional_delivery_rate'], d_id))
                conn.commit()
                cur.close()
                conn.close()
                db_success = True
            except Exception as db_err:
                db_success = False
                db_error_msg = str(db_err)
            
        st.sidebar.success(f"✅ Engine calibrated with {len(raw_df)} empirical records!")
        if db_success:
            st.sidebar.success("💾 Data synced to PostgreSQL (React Ready)!")
        else:
            st.sidebar.warning(f"⚠️ Saved in RAM only. DB sync failed: {db_error_msg}")
            
    except Exception as e:
        st.sidebar.error(f"ETL Error: {str(e)}")

st.sidebar.divider()

# District selection
district_options = {f"{d.name} ({d.country})": d for d in DEMO_DISTRICTS.values()}
selected_district_name = st.sidebar.selectbox(
    "Select Health District",
    options=list(district_options.keys()),
    index=0,
)
selected_district = district_options[selected_district_name]

# Scenario selection
scenario_options = {s['name']: s['id'] for s in SCENARIO_DEFINITIONS}
selected_scenario_name = st.sidebar.selectbox(
    "Select Intervention Scenario",
    options=list(scenario_options.keys()),
    index=4,  # Default to Combined
)
selected_scenario = scenario_options[selected_scenario_name]

# Simulation parameters
st.sidebar.divider()
st.sidebar.subheader("Simulation Parameters")
simulation_months = st.sidebar.slider("Projection Horizon (months)", 12, 60, 36, 12)

# Run button
run_simulation = st.sidebar.button("🚀 Run Simulation", type="primary", use_container_width=True)

# =========================================================
# MAIN CONTENT
# =========================================================

st.markdown("<p class='main-header'>Maternal Health Digital Twin</p>", unsafe_allow_html=True)
st.markdown("""
**Population Digital Twin & System Dynamics Simulation Platform** for predicting systemic 
bottlenecks and preventing maternal mortality across Sub-Saharan African Health Districts.
""")

if run_simulation:
    with st.spinner("Running System Dynamics simulation..."):
        # Run simulation
        result = SystemDynamicsEngine.simulate(
            selected_district, selected_scenario, {}, simulation_months
        )
        
        # Run all scenarios for comparison
        all_results = {}
        for s in SCENARIO_DEFINITIONS:
            all_results[s['id']] = SystemDynamicsEngine.simulate(
                selected_district, s['id'], {}, simulation_months
            )
    
    st.success(f"Simulation complete! {len(result.trajectories)} monthly snapshots generated.")
    
    # --- KEY METRICS ---
    st.subheader("📊 Key Epidemiological Metrics")
    
    col1, col2, col3, col4, col5 = st.columns(5)
    
    with col1:
        st.metric(
            "Baseline MMR",
            f"{result.summary.mmr_baseline:.0f}",
            f"per 100k births"
        )
    
    with col2:
        delta_mmr = result.summary.mmr_final - result.summary.mmr_baseline
        st.metric(
            "Projected MMR",
            f"{result.summary.mmr_final:.0f}",
            f"{delta_mmr:+.0f} ({result.summary.mmr_reduction_percent:.1f}% reduction)"
        )
    
    with col3:
        st.metric(
            "Lives Saved",
            f"{result.summary.lives_saved:,}",
            f"95% CI: {result.summary.lives_saved_ci95[0]}-{result.summary.lives_saved_ci95[1]}"
        )
    
    with col4:
        st.metric(
            "Cost per Life Saved",
            f"${result.summary.cost_per_life_saved_usd:,}",
            f"Total: ${result.summary.total_cost_usd:,}"
        )
    
    with col5:
        st.metric(
            "ICER / DALY",
            f"${result.summary.icer_per_daly}",
            "Highly Cost-Effective" if result.summary.icer_per_daly < 1500 else "Cost-Effective"
        )
    
    st.divider()
    
    # --- SCENARIO COMPARISON ---
    st.subheader("📈 Scenario Comparison")
    
    comparison_data = []
    for s in SCENARIO_DEFINITIONS:
        r = all_results[s['id']]
        comparison_data.append({
            'Scenario': s['name'],
            'Letter': s['letter'],
            'Final MMR': r.summary.mmr_final,
            'Lives Saved': r.summary.lives_saved,
            'Reduction %': r.summary.mmr_reduction_percent,
            'Cost/USD': r.summary.total_cost_usd,
            'Cost/Life': r.summary.cost_per_life_saved_usd,
            'ICER/DALY': r.summary.icer_per_daly,
        })
    
    comparison_df = pd.DataFrame(comparison_data)
    st.dataframe(comparison_df, use_container_width=True, hide_index=True)
    
    # --- TRAJECTORY PLOTS ---
    st.subheader("📉 MMR Trajectory Over Time")
    
    fig = go.Figure()
    
    colors_map = {'baseline': '#95a5a6', 'scenario_a': '#e74c3c', 
                  'scenario_b': '#3498db', 'scenario_c': '#2ecc71', 'scenario_d': '#9b59b6'}
    
    for s in SCENARIO_DEFINITIONS:
        r = all_results[s['id']]
        months = [t.time_month for t in r.trajectories]
        mmrs = [t.calculated_mmr for t in r.trajectories]
        
        fig.add_trace(go.Scatter(
            x=months, y=mmrs,
            mode='lines',
            name=f"({s['letter']}) {s['name']}",
            line=dict(color=colors_map[s['id']], width=3),
        ))
    
    fig.update_layout(
        xaxis_title="Months",
        yaxis_title="Maternal Mortality Ratio (per 100,000)",
        hovermode='x unified',
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        height=500,
    )
    
    st.plotly_chart(fig, use_container_width=True)
    
    # --- STOCK DYNAMICS ---
    st.subheader("🔄 5-Stock System Dynamics")
    
    fig_stocks = make_subplots(
        rows=2, cols=3,
        subplot_titles=('Pregnant Women (S1)', 'In ANC (S2)', 'Facility Delivery (S3)',
                       'Postpartum (S4)', 'Complications (S5)', 'System Trust'),
        vertical_spacing=0.12,
    )
    
    months = [t.time_month for t in result.trajectories]
    
    fig_stocks.add_trace(go.Scatter(x=months, y=[t.pregnant_women for t in result.trajectories],
                                   mode='lines', name='S1', line=dict(color='#e74c3c')), row=1, col=1)
    fig_stocks.add_trace(go.Scatter(x=months, y=[t.in_anc for t in result.trajectories],
                                   mode='lines', name='S2', line=dict(color='#3498db')), row=1, col=2)
    fig_stocks.add_trace(go.Scatter(x=months, y=[t.in_facility_delivery for t in result.trajectories],
                                   mode='lines', name='S3', line=dict(color='#2ecc71')), row=1, col=3)
    fig_stocks.add_trace(go.Scatter(x=months, y=[t.in_postpartum for t in result.trajectories],
                                   mode='lines', name='S4', line=dict(color='#f39c12')), row=2, col=1)
    fig_stocks.add_trace(go.Scatter(x=months, y=[t.with_complications for t in result.trajectories],
                                   mode='lines', name='S5', line=dict(color='#9b59b6')), row=2, col=2)
    fig_stocks.add_trace(go.Scatter(x=months, y=[t.system_trust_level for t in result.trajectories],
                                   mode='lines', name='Trust', line=dict(color='#1abc9c')), row=2, col=3)
    
    fig_stocks.update_layout(height=600, showlegend=False)
    st.plotly_chart(fig_stocks, use_container_width=True)
    
    # --- EQUITY ANALYSIS ---
    st.subheader("⚖️ Equity Analysis by Wealth Quintile")
    
    equity_df = pd.DataFrame([
        {
            'Quintile': q.quintile,
            'Label': q.label,
            'Baseline MMR': q.baseline_mmr,
            'Simulated MMR': q.simulated_mmr,
            'Lives Saved': q.lives_saved,
            'Relative Reduction %': q.relative_reduction,
            'Fiscal Cost USD': q.fiscal_cost_usd,
        }
        for q in result.equity_disaggregation
    ])
    
    col_eq1, col_eq2 = st.columns(2)
    
    with col_eq1:
        st.dataframe(equity_df, use_container_width=True, hide_index=True)
    
    with col_eq2:
        fig_eq = go.Figure()
        fig_eq.add_trace(go.Bar(
            x=equity_df['Quintile'],
            y=equity_df['Baseline MMR'],
            name='Baseline MMR',
            marker_color='#e74c3c'
        ))
        fig_eq.add_trace(go.Bar(
            x=equity_df['Quintile'],
            y=equity_df['Simulated MMR'],
            name='Simulated MMR',
            marker_color='#2ecc71'
        ))
        fig_eq.update_layout(
            barmode='group',
            title='MMR by Wealth Quintile',
            yaxis_title='MMR per 100,000',
            height=400,
        )
        st.plotly_chart(fig_eq, use_container_width=True)
    
    # --- STATISTICAL VALIDATION ---
    st.subheader("📐 Statistical Validation")
    
    col_val1, col_val2, col_val3 = st.columns(3)
    
    with col_val1:
        st.markdown("**Kolmogorov-Smirnov Test**")
        ks_result = StatisticalValidationPy.kolmogorov_smirnov(selected_district)
        st.write(f"D statistic: {ks_result['statistic_d']}")
        st.write(f"p-value: {ks_result['p_value']}")
        st.write(f"Equivalent: {'✅ Yes' if ks_result['is_statistically_equivalent'] else '❌ No'}")
    
    with col_val2:
        st.markdown("**Sobol Sensitivity**")
        sobol_result = StatisticalValidationPy.sobol_sensitivity(selected_district)
        st.write(f"Top contributor: {sobol_result['top_variance_contributors'][0]}")
        st.write(f"S1 indices: {[round(x, 2) for x in sobol_result['first_order_indices']]}")
    
    with col_val3:
        st.markdown("**Bootstrap 95% CI**")
        boot_result = StatisticalValidationPy.bootstrap_confidence_intervals(selected_district, selected_scenario)
        st.write(f"Mean lives saved: {boot_result['mean_lives_saved']}")
        st.write(f"95% CI: [{boot_result['ci95_lives_saved'][0]}, {boot_result['ci95_lives_saved'][1]}]")
    
    # --- DELAY ANALYSIS ---
    st.subheader("⏱️ Three-Delays Model Analysis")
    
    delays_df = pd.DataFrame([
        {
            'Month': t.time_month,
            'Phase 2 Delay (hours)': t.phase2_delay_hours,
            'Phase 3 Delay (hours)': t.phase3_delay_hours,
            'Congestion Index': t.facility_congestion_index,
        }
        for t in result.trajectories[::3]  # Every 3rd month for clarity
    ])
    
    fig_delays = go.Figure()
    fig_delays.add_trace(go.Scatter(
        x=delays_df['Month'], y=delays_df['Phase 2 Delay (hours)'],
        mode='lines+markers', name='Phase 2: Transit', line=dict(color='#e74c3c')
    ))
    fig_delays.add_trace(go.Scatter(
        x=delays_df['Month'], y=delays_df['Phase 3 Delay (hours)'],
        mode='lines+markers', name='Phase 3: Care Quality', line=dict(color='#3498db')
    ))
    fig_delays.update_layout(
        title='Systemic Delay Dynamics',
        xaxis_title='Months',
        yaxis_title='Delay (hours)',
        height=400,
    )
    st.plotly_chart(fig_delays, use_container_width=True)

else:
    # Initial state - show instructions
    st.info("👈 Select a district and scenario from the sidebar, then click **Run Simulation** to evaluate the engine.")
    
    # Show district overview
    st.subheader("District Overview")
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Population", f"{selected_district.population:,}")
    with col2:
        st.metric("Annual Births", f"{selected_district.annual_births:,}")
    with col3:
        st.metric("Baseline MMR", f"{selected_district.baseline_mmr:.0f}")
    with col4:
        st.metric("Distance to EmONC", f"{selected_district.avg_distance_to_emonc} km")
    
    # Show parameters
    params = build_default_parameters(selected_district)
    
    st.subheader("Derived SD Parameters")
    param_df = pd.DataFrame([
        {'Parameter': 'Travel Time (hours)', 'Value': f"{params.travel_time_hours:.1f}"},
        {'Parameter': 'Road Quality Index', 'Value': f"{params.road_quality_index:.2f}"},
        {'Parameter': 'Facility Fee (USD)', 'Value': f"${params.facility_delivery_fee_usd:.1f}"},
        {'Parameter': 'Transport Cost (USD)', 'Value': f"${params.transport_cost_usd:.1f}"},
        {'Parameter': 'Insurance Coverage', 'Value': f"{params.insurance_coverage_rate:.1%}"},
        {'Parameter': 'Skilled Staff Ratio', 'Value': f"{params.skilled_staff_ratio:.1f}"},
        {'Parameter': 'Blood Availability', 'Value': f"{params.blood_availability_rate:.1%}"},
        {'Parameter': 'Drug Stock Rate', 'Value': f"{params.oxytocin_misoprostol_stock_rate:.1%}"},
        {'Parameter': 'Bed Capacity', 'Value': f"{params.bed_capacity_ratio:.1%}"},
        {'Parameter': 'Education Rate', 'Value': f"{params.maternal_education_rate:.1%}"},
        {'Parameter': 'TBA Influence', 'Value': f"{params.tba_influence_factor:.1%}"},
        {'Parameter': 'Community Trust', 'Value': f"{params.community_trust_baseline:.2f}"},
    ])
    
    st.dataframe(param_df, use_container_width=True, hide_index=True)
    
    # Show scenario info
    st.subheader("Scenario Definitions")
    for s in SCENARIO_DEFINITIONS:
        with st.expander(f"({s['letter']}) {s['name']}"):
            st.write(f"**Description:** {s['description']}")
            st.write(f"**Mechanism:** {s['mechanism']}")
            st.write(f"**Cost:** ${s['cost_per_capita_usd']:.2f} per capita")
            if s['parameter_overrides']:
                st.write(f"**Overrides:** {s['parameter_overrides']}")
