"""
Report Generation Module
========================
PDF, Excel, and Word report generation for simulation results.
"""

from typing import Dict, List, Any
from io import BytesIO

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from openpyxl import Workbook

from services.system_dynamics import SimulationResult


class ReportGenerationPy:
    """Generates executive reports in PDF and Excel formats."""

    @staticmethod
    def generate_pdf_bytes(result: SimulationResult) -> bytes:
        """Generate a comprehensive PDF report."""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter,
                                rightMargin=72, leftMargin=72,
                                topMargin=72, bottomMargin=18)
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#1e3a5f'),
            spaceAfter=30,
        )
        
        story = []
        
        # Title
        story.append(Paragraph(
            f"Maternal Health Digital Twin Report<br/>{result.district_name}, {result.country}",
            title_style
        ))
        story.append(Spacer(1, 12))
        
        # Executive Summary
        story.append(Paragraph("Executive Summary", styles['Heading2']))
        story.append(Paragraph(
            f"Scenario: {result.scenario_name}<br/>"
            f"Baseline MMR: {result.summary.mmr_baseline} per 100,000 live births<br/>"
            f"Projected MMR: {result.summary.mmr_final} per 100,000 live births<br/>"
            f"Reduction: {result.summary.mmr_reduction_percent}%<br/>"
            f"Lives Saved: {result.summary.lives_saved} (95% CI: {result.summary.lives_saved_ci95[0]}-{result.summary.lives_saved_ci95[1]})<br/>"
            f"Total Cost: ${result.summary.total_cost_usd:,}<br/>"
            f"Cost per Life Saved: ${result.summary.cost_per_life_saved_usd:,}<br/>"
            f"ICER per DALY: ${result.summary.icer_per_daly}",
            styles['BodyText']
        ))
        story.append(Spacer(1, 12))
        
        # Equity Table
        story.append(Paragraph("Equity Analysis by Wealth Quintile", styles['Heading2']))
        
        equity_data = [['Quintile', 'Baseline MMR', 'Simulated MMR', 'Lives Saved', 'Cost per Life']]
        for q in result.equity_disaggregation:
            equity_data.append([
                q.label,
                str(q.baseline_mmr),
                str(q.simulated_mmr),
                str(q.lives_saved),
                f"${q.cost_per_life_saved_in_q:,}" if q.cost_per_life_saved_in_q > 0 else "N/A"
            ])
        
        equity_table = Table(equity_data)
        equity_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        story.append(equity_table)
        
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

    @staticmethod
    def generate_excel_bytes(result: SimulationResult) -> bytes:
        """Generate Excel workbook with simulation data."""
        wb = Workbook()
        
        # Summary sheet
        ws_summary = wb.active
        ws_summary.title = "Summary"
        
        headers = ['Metric', 'Value']
        ws_summary.append(headers)
        
        summary_data = [
            ['District', result.district_name],
            ['Country', result.country],
            ['Scenario', result.scenario_name],
            ['Baseline MMR', result.summary.mmr_baseline],
            ['Final MMR', result.summary.mmr_final],
            ['MMR Reduction %', result.summary.mmr_reduction_percent],
            ['Total Births', result.summary.total_births],
            ['Total Deaths', result.summary.total_maternal_deaths],
            ['Lives Saved', result.summary.lives_saved],
            ['Lives Saved CI95 Lower', result.summary.lives_saved_ci95[0]],
            ['Lives Saved CI95 Upper', result.summary.lives_saved_ci95[1]],
            ['Total Cost USD', result.summary.total_cost_usd],
            ['Cost per Life Saved', result.summary.cost_per_life_saved_usd],
            ['ICER per DALY', result.summary.icer_per_daly],
        ]
        
        for row in summary_data:
            ws_summary.append(row)
        
        # Trajectories sheet
        ws_traj = wb.create_sheet("Trajectories")
        traj_headers = [
            'Month', 'Pregnant Women', 'In ANC', 'In Facility Delivery',
            'In Postpartum', 'With Complications', 'Monthly Births',
            'Monthly Deaths', 'Calculated MMR', 'ANC Coverage %',
            'Facility Delivery %', 'System Trust', 'Congestion Index',
            'Phase 2 Delay (h)', 'Phase 3 Delay (h)'
        ]
        ws_traj.append(traj_headers)
        
        for t in result.trajectories:
            ws_traj.append([
                t.time_month, t.pregnant_women, t.in_anc,
                t.in_facility_delivery, t.in_postpartum, t.with_complications,
                t.monthly_births, t.monthly_maternal_deaths, t.calculated_mmr,
                t.anc_coverage_percent, t.facility_delivery_percent,
                t.system_trust_level, t.facility_congestion_index,
                t.phase2_delay_hours, t.phase3_delay_hours,
            ])
        
        # Equity sheet
        ws_equity = wb.create_sheet("Equity")
        equity_headers = [
            'Quintile', 'Label', 'Population Share', 'Baseline MMR',
            'Simulated MMR', 'Lives Saved', 'Relative Reduction %',
            'Absolute Reduction', 'Fiscal Cost USD', 'Cost per Life', 'Benefit-Cost Ratio'
        ]
        ws_equity.append(equity_headers)
        
        for q in result.equity_disaggregation:
            ws_equity.append([
                q.quintile, q.label, q.population_share, q.baseline_mmr,
                q.simulated_mmr, q.lives_saved, q.relative_reduction,
                q.absolute_reduction, q.fiscal_cost_usd,
                q.cost_per_life_saved_in_q, q.benefit_cost_ratio,
            ])
        
        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        return buffer.getvalue()
