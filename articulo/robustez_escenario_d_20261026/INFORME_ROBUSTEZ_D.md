# Informe: robustez del escenario D ante menor preparación

Ejecución: 2026-10-26 23:32 Lima (2026-10-27 04:32 UTC), 36 meses, RK4, `dt=0.1`, capacidad `spa_247`. Comando y versiones en `run_metadata.json`; script: `run_stress_analysis.py`; log: `logs/run.log`. Código e insumos son copias de la ejecución corregida bajo commit base `e87c4d2b629b29de1a7039942a4345b4a640ac94`, identificadas por SHA-256. El árbol original ya tenía cambios locales; no se hicieron pull, push, checkout ni commit.

## Qué significa preparación en el motor

En `source_snapshot/backend/services/system_dynamics.py`:

- Líneas 52 y 55: D se define como paquete A+B+C más una cobertura supuesta de 95% para personal 24/7, sangre y uterotónicos; la capacidad fuera de 24/7 relativa se fija en 0,33.
- Líneas 74 y 108–115: el personal efectivo se calcula como `a = s247 + (1−s247)·0,33`. Capacidad nominal = `nacimientos_mensuales × 0,12 × densidad_personal/10.000 ÷ 1,5`; capacidad efectiva = capacidad nominal × `a`. La calidad usa personal, sangre y disponibilidad de medicamentos con ponderaciones 0,4/0,3/0,3 y una penalización por congestión. La demora clínica agrega las brechas de sangre y medicamentos, déficit de `a` y congestión.
- Líneas 130 y 200: esos índices alimentan flujos de muertes en tránsito/centro y la calibración basal.
- `model_inputs.py`, líneas 62–67: las entradas de CSV cargan densidad, cobertura 24/7, sangre y disponibilidad de medicamentos. El cargador asigna `essential_drugs_availability` al parámetro usado como proxy de oxitocina/misoprostol.

Los insumos no equivalen a observaciones territoriales recientes de capacidad. La procedencia en `source_snapshot/data/model_inputs/input_provenance.csv` clasifica para Garissa personal 24/7 (0,46), sangre (0,14) y medicamentos esenciales (0,71) como `SPA_NATIONAL_PROXY`: agregados KSPA 2010 asignados a los cinco territorios de Kenya. Su densidad de personal (1,1 por 10.000) es `MODEL_INPUT`, no directamente derivada de DHS. En los 25 territorios, los insumos de base varían entre 0,30–0,85 para personal 24/7, 0,05–0,15 para sangre y 0,71–0,92 para medicamentos esenciales. D reemplaza esos valores por 0,95. Por eso el 95% de D es un supuesto del escenario, no un valor empírico.

## Matriz fijada antes de ejecutar

| Variante | Personal 24/7 | Sangre | Uterotónicos | Interpretación |
|---|---:|---:|---:|---|
| D corregido | 95% | 95% | 95% | Definición de D en el motor corregido |
| D estrés moderado | 75% | 75% | 75% | −20 puntos porcentuales respecto al supuesto D |
| D estrés severo | 50% | 50% | 50% | −45 puntos porcentuales; disponibilidad parcial de la mitad |

La matriz no se ajustó a resultados ni se atribuye a datos empíricos. 75% es una perturbación moderada y 50% un estrés severo escogidos para exponer dependencia del supuesto 95%; no hay datos que permitan decir que esas sean preparaciones reales, probables o representativas. Se sustituyeron temporalmente esas tres reglas en memoria para las variantes; se conservaron intactos el motor en disco, los insumos y las demás reglas D. Las variantes se identifican como sensibilidades de D, no como D original. El detalle está en `stress_matrix.json` y `STRESS_DESIGN.md`.

## Resultados globales simulados (25 territorios, 36 meses)

RMM = muertes maternas modeladas / nacidos vivos modelados ×100.000. Reducción de muertes = (muertes baseline − muertes del escenario) / muertes baseline. Reducción de RMM usa RMM baseline y RMM del escenario; se conserva como columna separada. Los resultados completos están en `results/global_results.csv`; diferencias contra D corregido, en `global_stress_differences_vs_D.csv`.

| Variante | Nacidos vivos | Muertes modeladas | RMM | Muertes evitadas | Reducción muertes | Reducción RMM |
|---|---:|---:|---:|---:|---:|---:|
| D corregido (95%) | 3.299.590,49 | 3.292,37 | 99,78 | 5.330,47 | 61,82% | 61,84% |
| D estrés moderado (75%) | 3.299.582,68 | 3.837,21 | 116,29 | 4.785,63 | 55,50% | 55,53% |
| D estrés severo (50%) | 3.299.578,65 | 4.280,09 | 129,72 | 4.342,75 | 50,36% | 50,40% |

Frente a D corregido, el estrés moderado suma 544,84 muertes modeladas (+16,51 en RMM) y reduce las muertes evitadas en 544,84 (−6,32 puntos porcentuales de reducción de muertes; 10,22% menos muertes evitadas). El estrés severo suma 987,72 muertes (+29,94 en RMM) y reduce las muertes evitadas en 987,72 (−11,45 puntos porcentuales; 18,53% menos muertes evitadas).

## D frente a A, B y C

| D variante | Comparador | Ventaja de D en muertes evitadas | RMM D frente al comparador |
|---|---|---:|---:|
| D corregido | A | +4.095,31 | 99,78 vs 224,04 |
| D corregido | B | +3.298,36 | 99,78 vs 199,78 |
| D corregido | C | +4.051,95 | 99,78 vs 222,67 |
| D estrés moderado | A | +3.550,46 | 116,29 vs 224,04 |
| D estrés moderado | B | +2.753,52 | 116,29 vs 199,78 |
| D estrés moderado | C | +3.507,11 | 116,29 vs 222,67 |
| D estrés severo | A | +3.107,59 | 129,72 vs 224,04 |
| D estrés severo | B | +2.310,64 | 129,72 vs 199,78 |
| D estrés severo | C | +3.064,23 | 129,72 vs 222,67 |

En este modelo D mantiene más muertes evitadas y menor RMM que A, B y C en los 25/25 territorios y los 5/5 países, en ambas sensibilidades. Son comparaciones de salidas modeladas bajo supuestos compartidos, no prueba de eficacia real. No se interpreta como dominancia de costo-efectividad.

## Reproducibilidad y verificaciones

El análisis ejecutó baseline una vez por territorio y reutilizó el mismo resultado para A, B, C y cada variante D. El CSV `reference_corrected_comparison.csv` demuestra que baseline, A, B, C y D original reproducen las cifras de `repro_corregida_20261026/results/global_results.csv` con tolerancia absoluta de 1e-9. El script afirma exactamente 25 IDs únicos para cada variante, igualdad de los tres valores de la baseline emparejada, y agregaciones nacionales y globales iguales a las sumas territoriales. `run_metadata.json` registra esas verificaciones como exitosas. Resultados y parámetros están en `results/`; no se modificó ninguna carpeta anterior. El ZIP incluye el snapshot mínimo del motor e insumos; no incluye microdatos DHS.

## Equidad y análisis de incertidumbre

Las variantes cambian los resultados del modelo, por lo que los análisis previos de Garissa, Sobol y Monte Carlo corresponden únicamente al D corregido de 95%; no describen las variantes 75% ni 50%. No se repitieron esos análisis en esta tarea. Para afirmar cómo cambia la brecha de equidad se debe volver a ejecutar la equidad con la variante seleccionada y los mismos anclajes quintílicos, aclarando que su RMM es `MODEL_INPUT`. Para afirmar índices Sobol o percentiles de incertidumbre bajo esos supuestos reducidos también se deben repetir Sobol/Monte Carlo con los valores de preparación de cada variante, pues cambiaría el punto nominal y la propagación de parámetros. No se necesita recalcularlos para limitar el artículo a esta comparación determinística global, territorial y nacional.

## Frase propuesta para Resultados/Discusión

> «En un análisis de sensibilidad determinístico, al reducir conjuntamente los supuestos de disponibilidad de personal 24/7, sangre y medicamentos de 95% a 75% y 50%, la RMM simulada del escenario D aumentó de 99,78 a 116,29 y 129,72 por 100.000 nacidos vivos, mientras que las muertes modeladas como evitadas disminuyeron de 5.330,47 a 4.785,63 y 4.342,75; D mantuvo una mayor reducción modelada de muertes que A, B y C en los territorios estudiados bajo estos supuestos. Estos son resultados de sensibilidad del modelo, no eficacia observada ni predicción validada.»

Esta frase debe contextualizar los setpoints 75%/50% como analíticos, no observados. No se editó el manuscrito ni las figuras.
