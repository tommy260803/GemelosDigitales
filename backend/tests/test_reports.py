"""
Tests for Report Generation (PDF and Excel).
"""

from services.system_dynamics import SystemDynamicsEngine
from services.reports import ReportGenerationPy


class TestPdfGeneration:
    """Tests for PDF report generation."""

    def test_pdf_generation(self, garissa_district):
        result = SystemDynamicsEngine.simulate(garissa_district, 'scenario_d')
        pdf_bytes = ReportGenerationPy.generate_pdf_bytes(result)
        assert isinstance(pdf_bytes, bytes)
        assert len(pdf_bytes) > 1000

    def test_pdf_starts_with_pdf_header(self, garissa_district):
        result = SystemDynamicsEngine.simulate(garissa_district, 'baseline')
        pdf_bytes = ReportGenerationPy.generate_pdf_bytes(result)
        assert pdf_bytes[:5] == b'%PDF-'


class TestExcelGeneration:
    """Tests for Excel report generation."""

    def test_excel_generation(self, garissa_district):
        result = SystemDynamicsEngine.simulate(garissa_district, 'scenario_d')
        excel_bytes = ReportGenerationPy.generate_excel_bytes(result)
        assert isinstance(excel_bytes, bytes)
        assert len(excel_bytes) > 1000

    def test_excel_is_valid_xlsx(self, garissa_district):
        result = SystemDynamicsEngine.simulate(garissa_district, 'baseline')
        excel_bytes = ReportGenerationPy.generate_excel_bytes(result)
        assert excel_bytes[:2] == b'PK'

    def test_excel_multiple_scenarios(self, ashanti_district):
        for scenario_id in ['baseline', 'scenario_a', 'scenario_d']:
            result = SystemDynamicsEngine.simulate(ashanti_district, scenario_id)
            excel_bytes = ReportGenerationPy.generate_excel_bytes(result)
            assert len(excel_bytes) > 1000
