# Sensibilidad de preparación del escenario D

Esta carpeta contiene un análisis nuevo, separado de `articulo/repro_corregida_20261026/`. Las dos variantes estresadas son sensibilidades determinísticas, no cambios al escenario D publicado ni al motor de producción.

## Repetición

Desde la raíz del proyecto, con Python 3.13.7, NumPy 2.2.6, pandas 2.3.2, SciPy 1.16.2 y SALib 1.6.0:

```powershell
python articulo/robustez_escenario_d_20261026/run_stress_analysis.py
```

El script lee código e insumos de su propia carpeta `source_snapshot/`, no usa PostgreSQL y detiene una repetición si ya existen CSV de salida. Para conservar resultados, copie la carpeta a un directorio nuevo antes de ejecutarlo. La ejecución concluida está registrada en `run_metadata.json` y `logs/run.log`.

## Lectura de resultados

- `stress_matrix.json` y `STRESS_DESIGN.md`: supuestos definidos antes de la corrida y su justificación/limitación.
- `results/territory_results.csv`, `country_results.csv`, `global_results.csv`: resultados completos, incluyendo nacidos vivos, muertes, RMM, muertes evitadas y las dos reducciones porcentuales calculadas separadamente.
- `results/*_stress_differences_vs_D.csv`: diferencia de las variantes 75%/50% respecto de D corregido en el nivel territorial, nacional y global.
- `results/*_D_vs_ABC.csv`: comparación de D con A, B y C por territorio, país y global.
- `results/effective_parameters.csv` y `effective_inputs_by_territory_variant.csv`: parámetros efectivos y datos de entrada por ejecución.
- `results/reference_corrected_comparison.csv`: prueba de control; D corregido, línea base, A, B y C coinciden con la reproducción corregida previa con tolerancia absoluta `1e-9`.
- `run_metadata.json`: commit base, hashes SHA-256 de código/insumos, dependencias, fecha, comando, uso de base de datos y comprobaciones.
- `SHA256SUMS.json`: hashes del script, matriz, documentación, código, insumos y resultados entregados.

Los CSV de salud (`staff_247_availability_rate`, `blood_availability`, `essential_drugs_availability`) son los insumos de referencia. En Garissa, por ejemplo, son 0,46, 0,14 y 0,71. El archivo de procedencia los clasifica como proxies nacionales SPA/KSPA 2010 asignados a los territorios de Kenya; la densidad de personal (1,1 por 10.000) es `MODEL_INPUT`. D fuerza los tres componentes clínicos a 0,95. Además, el motor usa `essential_drugs_availability` como proxy del parámetro de disponibilidad de oxitocina/misoprostol: no hay inventario territorial directo de uterotónicos en este set de insumos.

Los setpoints 0,75 y 0,50 son supuestos analíticos explícitos, no estimaciones de preparación real. Los resultados son salidas de un modelo determinístico, no eficacia observada, predicción validada ni intervalo de confianza.
