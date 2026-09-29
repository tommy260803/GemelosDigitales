"""Exports corrected simulated metrics without statistical/economic claims."""
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table
from openpyxl import Workbook
from services.system_dynamics import SimulationResult


def _r4(val):
    """Round float to at most 4 decimals; leaves None or other types intact."""
    if val is None:
        return 'N/A'
    if isinstance(val, float):
        return round(val, 4)
    return val


class ReportGenerationPy:
    @staticmethod
    def generate_pdf_bytes(result: SimulationResult) -> bytes:
        b = BytesIO()
        doc = SimpleDocTemplate(b, pagesize=letter)
        styles = getSampleStyleSheet()
        s = result.summary
        rows = [
            ['Métrica', 'Valor Simulado'],
            ['Nacimientos acumulados', f'{round(s.total_births, 4):g}'],
            ['Muertes maternas acumuladas', f'{round(s.total_maternal_deaths, 4):g}'],
            ['MMR al horizonte (muertes/100k)', f'{round(s.horizon_mmr, 4):g}'],
            ['Muertes evitadas vs línea base', f'{round(s.deaths_avoided, 4):g}'],
            ['Reducción de mortalidad (%)', f'{round(s.mortality_reduction_percent, 4):g}%'],
            ['Costo total intervención (USD)', f'${round(s.total_cost_usd, 4):g}'],
            ['Costo por muerte evitada (USD)', 'N/A' if s.cost_per_death_avoided_usd is None else f'${round(s.cost_per_death_avoided_usd, 4):g}'],
        ]
        doc.build([
            Paragraph(f'Simulación de Gemelo Digital Materno: {result.district_name}', styles['Title']),
            Paragraph('Resultados deterministas del motor de dinámica de sistemas (RK4, dt=0.05 meses). No representan estimaciones empíricas directas.', styles['BodyText']),
            Spacer(1, 12),
            Table(rows),
        ])
        return b.getvalue()

    @staticmethod
    def generate_excel_bytes(result: SimulationResult) -> bytes:
        wb = Workbook()
        ws = wb.active
        ws.title = 'Resumen'
        s = result.summary
        for row in [
            ('Métrica', 'Valor'),
            ('Distrito', result.district_name),
            ('País', result.country),
            ('Escenario', result.scenario_name),
            ('Integrador', s.integrator),
            ('Paso temporal dt (meses)', _r4(s.dt_months)),
            ('Nacimientos acumulados', _r4(s.total_births)),
            ('Muertes maternas acumuladas', _r4(s.total_maternal_deaths)),
            ('MMR horizonte (muertes/100k)', _r4(s.horizon_mmr)),
            ('Muertes evitadas vs línea base', _r4(s.deaths_avoided)),
            ('Reducción de mortalidad %', _r4(s.mortality_reduction_percent)),
            ('Costo intervención USD', _r4(s.total_cost_usd)),
            ('Costo por muerte evitada USD', _r4(s.cost_per_death_avoided_usd)),
        ]:
            ws.append(row)

        t = wb.create_sheet('Trayectorias')
        headers = list(result.trajectories[0].__dataclass_fields__) if result.trajectories else []
        t.append(headers)
        for x in result.trajectories:
            t.append([_r4(getattr(x, h)) for h in headers])

        b = BytesIO()
        wb.save(b)
        return b.getvalue()

