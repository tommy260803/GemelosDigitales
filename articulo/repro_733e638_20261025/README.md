# Reproducción acotada de análisis del artículo

Esta carpeta conserva los resultados de una reproducción del commit Git `733e63816e424bed53f2094646f46f6ca93955e4` y la comparación con las cifras del manuscrito. Los CSV/JSON están en `results/`; el log y la comprobación de disponibilidad de PostgreSQL están en `logs/`. El paquete no duplica el repositorio fuente ni distribuye microdatos DHS.

## Fecha, versión y entorno

- Commit fuente: `733e63816e424bed53f2094646f46f6ca93955e4`, 2026-09-29 10:21:18 -05:00.
- Ejecución de reproducción: 2026-10-25 18:05:26–18:05:38 UTC, registrada en `results/run_metadata.json` y `logs/reproduction.log`.
- Runtime utilizado: Python 3.13.7, SALib 1.6.0, NumPy 2.2.6, SciPy 1.16.2 y pandas 2.3.2.
- El runner obtiene solo los archivos de código e insumos necesarios desde ese commit mediante `git archive`; la carpeta no incluye `source_snapshot.zip` ni una copia íntegra `source/`.
- `run_metadata.json` registra SHA-256 del motor, validación, carga de entradas, archivos de resultados e insumos usados.

La reproducción se ejecutó con:

```powershell
python articulo\repro_733e638_20261025\reproduce.py
python articulo\repro_733e638_20261025\supplementary_comparisons.py
python articulo\repro_733e638_20261025\compare_equity_table.py
```

Para volver a ejecutar sin sobrescribir esta evidencia, usa una copia limpia de la carpeta: el runner se detiene si `results/` o `logs/` ya contienen archivos.

El runner invoca el motor del snapshot para equidad, Sobol y Monte Carlo. Los insumos de quintiles de Garissa se leen desde el CSV versionado en el commit de origen, pero no se vuelven a publicar como un archivo separado en esta carpeta. **No ejecuta** el exportador que sobrescribe `data/results/final_*.csv`; las RMM y nacidos vivos de A/B/C se leen directamente del CSV global versionado en ese commit.

## Datos y redistribución

No se incluyen archivos de microdatos DHS (`.DTA`), ni la extracción local completa del repositorio. Los insumos DHS estratificados se usan desde `data/model_inputs/quintile_coverage_by_district.csv` en el commit fuente indicado arriba; quien vuelva a ejecutar el análisis debe tener acceso autorizado a los insumos aplicables. Esta carpeta contiene resultados agregados de análisis y no pretende conceder permiso para redistribuir los microdatos de origen. La fuente DHS requiere registro y autorización de acceso a sus datasets; véanse los [términos de uso de DHS](https://dhsprogram.com/data/visualizations/) y los términos específicos aceptados para cada dataset.

## Configuración ejecutada

- Equidad: `ke-garissa`, `scenario_d`, 36 meses, `dt=None` (default 0,1 meses), modelo `spa_247`. Determinista, sin semilla.
- Sobol: `ke-garissa`, `scenario_d`, 12 meses, N=64, 640 corridas pareadas, semilla 42, ocho parámetros de `backend/services/validation.py`. Los 640 parámetros transformados y salidas están en `sobol_garissa_scenario_d_12m_model_runs.csv`; índices e intervalos en `sobol_garissa_scenario_d_12m_indices.csv` y `_summary.json`.
- Monte Carlo paramétrico (el método de código se llama bootstrap): `ke-garissa`, `scenario_d`, 36 meses, 200 iteraciones, semilla 42. Las 200 extracciones y resultados pareados están en `monte_carlo_garissa_scenario_d_36m_draws.csv`; resumen en `_summary.json`.
- Insumos: archivos `data/model_inputs/*.csv` del commit de origen, fijados mediante sus hashes en `results/run_metadata.json`.

Código exacto usado en el snapshot: equidad en `backend/services/system_dynamics.py:132-150,156-190`, con carga de distrito/quintiles en `backend/services/model_inputs.py:52-112`; Sobol en `backend/services/validation.py:30-219`; muestreo de parámetros y pares baseline/escenario en `validation.py:61-91`; Monte Carlo paramétrico en `validation.py:221-261`. `run_metadata.json` da hashes SHA-256 de esos archivos y de cada CSV de entrada.

## Cotejo con el manuscrito

- **Monte Carlo:** media de muertes evitadas 173,152143; percentiles 2,5 y 97,5: 135,451253 y 195,626417. Costo medio por muerte evitada: USD 76.844,901414; percentiles: USD 67.092,713322 y USD 96.899,878798. Coinciden con la precisión publicada. El “rango del 95 %” son los percentiles 2,5/97,5 de resultados de simulaciones paramétricas uniformes, no un intervalo de muestreo estimado a partir de observaciones clínicas. Para costos se retienen las iteraciones con muertes evitadas y costo positivos; en esta reproducción las 200 fueron positivas.
- **Brecha de equidad:** Q1 MMR simulada = 169,388402; Q5 = 174,630257. Q1−Q5 = −5,241856 muertes/100 000 nacidos vivos; la magnitud absoluta es 5,241856, publicada como 5,24. La brecha corresponde a comparar MMR simuladas finales, no las referencias por quintil de 890 y 340.
- **Sobol:** los ocho parámetros, S1, ST y sus confianzas coinciden con `ARTICLE_UPDATE_PACKAGE.md` a la precisión publicada. Personal cualificado ST=0,954581245; sangre ST=0,054978875.
- **Tabla de equidad:** los 40 valores comparados (ocho columnas × cinco quintiles) coinciden a la precisión publicada.
- **RMM/nacidos vivos para A/B/C, 36 meses:** están copiados sin simulación nueva de `data/results/final_global_results.csv` del commit de origen a `results/scenarios_A_B_C_global_36m_from_commit.csv`.

| Escenario | Nacidos vivos acumulados | RMM de horizonte por 100 000 |
|---|---:|---:|
| A | 3 297 531,964556 | 225,288639 |
| B | 3 298 959,662947 | 198,755817 |
| C | 3 298 369,026598 | 222,957839 |

La comparación no ajustó salidas para igualarlas. Diferencias por debajo del redondeo publicado permanecen en los CSV/JSON con precisión completa.

## Búsqueda de resultados originales antes de reproducir

No se encontraron salidas originales de Garissa/Sobol/Monte Carlo en `data/results/`, en rutas rastreadas por el historial Git consultable ni en el contenido del artículo (solo las cifras resumidas). PostgreSQL no estaba accesible; véase `logs/database_check.txt`. Hay directorios locales de pruebas preexistentes sin permiso de lectura, registrados en el mismo archivo, por lo que no fue posible descartar artefactos dentro de ellos. El código declara tablas para ejecuciones, pero en el código consultado no hay escrituras a ellas.

**La fecha exacta de las ejecuciones originales del manuscrito sigue siendo no encontrada.** Solo la fecha del commit de datos/código se conoce. La fecha de reproducción de esta carpeta sí está registrada.
