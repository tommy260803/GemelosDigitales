import pytest
from services.validation import StatisticalValidationPy, ScientificProcedureUnavailable

@pytest.mark.parametrize('method,args',[('kolmogorov_smirnov',()),('sobol_sensitivity',()),('bootstrap_confidence_intervals',()),('external_validation',())])
def test_unimplemented_scientific_procedures_do_not_return_mock_results(garissa_district,method,args):
    with pytest.raises(ScientificProcedureUnavailable):
        getattr(StatisticalValidationPy,method)(garissa_district,*args)
