"""Exports corrected simulated metrics without statistical/economic claims."""
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table
from openpyxl import Workbook
from services.system_dynamics import SimulationResult

class ReportGenerationPy:
    @staticmethod
    def generate_pdf_bytes(result: SimulationResult) -> bytes:
        b=BytesIO(); doc=SimpleDocTemplate(b,pagesize=letter); styles=getSampleStyleSheet(); s=result.summary
        rows=[['Metric','Simulated value'],['Cumulative births',f'{s.total_births:.2f}'],['Cumulative maternal deaths',f'{s.total_maternal_deaths:.4f}'],['Horizon MMR',f'{s.horizon_mmr:.2f}'],['Deaths avoided vs paired baseline',f'{s.deaths_avoided:.4f}'],['Mortality reduction (%)',f'{s.mortality_reduction_percent:.2f}'],['Configured intervention cost (USD)',f'{s.total_cost_usd:.2f}'],['Cost per death avoided (USD)', 'N/A' if s.cost_per_death_avoided_usd is None else f'{s.cost_per_death_avoided_usd:.2f}']]
        doc.build([Paragraph(f'Simulated maternal-health scenario: {result.district_name}',styles['Title']),Paragraph('Outputs are deterministic model outputs; they are not empirical estimates or formal cost-effectiveness results.',styles['BodyText']),Spacer(1,12),Table(rows)]); return b.getvalue()
    @staticmethod
    def generate_excel_bytes(result: SimulationResult) -> bytes:
        wb=Workbook(); ws=wb.active; ws.title='Summary'; s=result.summary
        for row in [('Metric','Value'),('District',result.district_name),('Country',result.country),('Scenario',result.scenario_name),('Integrator',s.integrator),('dt months',s.dt_months),('Cumulative births',s.total_births),('Cumulative maternal deaths',s.total_maternal_deaths),('Horizon MMR',s.horizon_mmr),('Deaths avoided vs paired baseline',s.deaths_avoided),('Mortality reduction %',s.mortality_reduction_percent),('Configured intervention cost USD',s.total_cost_usd),('Cost per death avoided USD',s.cost_per_death_avoided_usd)]: ws.append(row)
        t=wb.create_sheet('Trajectories'); headers=list(result.trajectories[0].__dataclass_fields__) if result.trajectories else []; t.append(headers)
        for x in result.trajectories: t.append([getattr(x,h) for h in headers])
        b=BytesIO(); wb.save(b); return b.getvalue()
