# Reproducción corregida: auditoría de modelo materno

Esta carpeta contiene una ejecución nueva del motor corregido. No es la reproducción de la ejecución original del artículo. La causa de las diferencias históricas sigue sin poder determinarse, como documenta `../auditoria_motor_tabla3_20261026/INFORME_INVESTIGACION_CAUSA_TABLA3.md`.

## Repetir

Desde la raíz del repositorio, con Python 3.13.7 y las dependencias listadas en `run_metadata.json`:

```powershell
python articulo/repro_corregida_20261026/run_analysis.py
```

El script cambia internamente el directorio de trabajo a `source_snapshot`, carga exclusivamente los archivos CSV que están en `source_snapshot/data/model_inputs/` y no accede a PostgreSQL ni a la API. Para una repetición conservada sin reemplazar esta salida, copie esta carpeta a un nuevo directorio de ejecución antes de lanzar el comando. El log original está en `logs/run.log`.

## Alcance y artefactos

- 25 territorios × baseline y escenarios A–D × 36 meses; integrador RK4 con `dt=0.1` mes; capacidad clínica `spa_247`.
- `results/territory_scenario_results.csv`, `country_results.csv`, `global_results.csv`: resultados; la reducción de muertes es conteo emparejado contra baseline, separada de la reducción de RMM.
- `effective_inputs_by_territory_scenario.csv` y `effective_parameters.csv`: insumos versionados y parámetros transformados para cada combinación.
- `scenario_d_monthly_trajectories.csv`: trayectorias mensuales guardadas para D.
- Garissa: equidad D/36 meses, Sobol D/12 meses (N=64, semilla 42; 640 evaluaciones del modelo), Monte Carlo paramétrico D/36 meses (200 extracciones, semilla 42).
- `source_snapshot/` guarda la copia efectiva del motor, el cargador, el módulo de validación, la prueba nueva y los insumos CSV. No incluye microdatos DHS.
- `code_changes.diff` registra las diferencias entre HEAD inicial y los archivos modificados de motor, validación, API, Streamlit y prueba. El commit inicial era `e87c4d2b629b29de1a7039942a4345b4a640ac94`; el árbol ya tenía cambios locales. No se hizo commit.
- `source_snapshot_sha256.json` identifica por SHA-256 cada archivo de código e insumo del snapshot.

## Límites

Los quintiles de RMM de Garissa (890, 760, 610, 490, 340 por 100.000 nacidos vivos) son anclajes etiquetados `MODEL_INPUT`; no son estimaciones directas de DHS. Los indicadores de cobertura quintílica sí están etiquetados como `EMPIRICAL_DHS_STRATIFIED`, pero se derivan de tasas nacionales estratificadas y tasas territoriales de entrada, no de microdatos representativos de Garissa. Los resultados de equidad son condicionales a esos insumos.

Los percentiles P2,5–P97,5 de Monte Carlo describen incertidumbre paramétrica propagada bajo extracciones uniformes independientes y truncamiento al dominio. No son intervalos de confianza por muestreo, intervalos predictivos ni validación. La RMM OMS/MMEIG usada como anclaje no constituye una validación independiente.
