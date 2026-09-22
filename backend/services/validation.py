"""Validation capability registry.

No synthetic samples, fixed Sobol indices, heuristic confidence intervals, or
hard-coded external-validation statistics are produced by this project.
"""
class ScientificProcedureUnavailable(RuntimeError): pass
class StatisticalValidationPy:
    @staticmethod
    def unavailable(procedure):
        raise ScientificProcedureUnavailable(f'{procedure} is unavailable until independent data and a documented method are configured.')
    kolmogorov_smirnov=staticmethod(lambda *a,**k: StatisticalValidationPy.unavailable('KS validation'))
    wilcoxon_signed_rank=staticmethod(lambda *a,**k: StatisticalValidationPy.unavailable('Wilcoxon validation'))
    sobol_sensitivity=staticmethod(lambda *a,**k: StatisticalValidationPy.unavailable('Sobol sensitivity'))
    bootstrap_confidence_intervals=staticmethod(lambda *a,**k: StatisticalValidationPy.unavailable('bootstrap uncertainty'))
    external_validation=staticmethod(lambda *a,**k: StatisticalValidationPy.unavailable('external validation'))
