# Informe breve: correcciones del motor y resultados nuevos

Fecha de ejecución: 2026-10-26, Lima (2026-10-27 UTC). Código ejecutado: snapshot de trabajo basado en HEAD `e87c4d2b629b29de1a7039942a4345b4a640ac94`, rama `main`, con modificaciones locales preexistentes. El diff específico está en `code_changes.diff`; hashes del código e insumos ejecutados, en `source_snapshot_sha256.json`. Entorno exacto y marcas de tiempo: `run_metadata.json`. Comando: `python articulo/repro_corregida_20261026/run_analysis.py`. La ruta se ejecutó desde CSV versionados copiados al snapshot; no usó base de datos ni API. Logs: `logs/run.log`.

## Hallazgos y correcciones justificadas

1. **Equidad de Garissa: defecto de implementación corregido, inferencia empírica aún limitada.** Antes, `_equity()` modificaba cobertura ANC1/parto institucional por quintil, pero simulaba todos los quintiles con la misma `baseline_mmr` territorial. La entrada que se mostraba como MMR de quintil (Q1=890, Q5=340) no se aplicaba al factor de calibración. Por ello, la ejecución previa producía baseline simulado Q1=438,46 y Q5=443,21, una inversión causada por la calibración común y diferencias en cobertura. Ahora cada simulación quintílica calibra con su propio anclaje de entrada MMR; se agrega una prueba de ordenamiento basada en los anclajes reales, sin fijar un resultado numérico esperado. La RMM referencia de quintil está clasificada `MODEL_INPUT`, no deriva directamente de DHS. Coberturas quintílicas de Garissa son `EMPIRICAL_DHS_STRATIFIED`, derivadas de tasas nacionales estratificadas escaladas por tasas distritales. Así, corregir el uso de datos no convierte la salida en evidencia observacional ni causal.

2. **Congestión/capacidad: error dimensional corregido.** D y C son stocks en mujeres; capacidad efectiva está en mujeres/mes. El cociente directo mujeres ÷ (mujeres/mes) tiene unidades de meses y no puede interpretarse como índice adimensional. El motor ahora calcula la carga como flujo: `L = D/τD + 1,8·C/τC`, con `τD=0,1 mes` y `τC=0,15 mes`, y congestión `min(2,5, L/capacidad_efectiva)`. L y la capacidad están ambos en mujeres/mes; el cociente sí es adimensional. Se reutilizan los tiempos de residencia ya aplicados en las ecuaciones de stock, no se introduce un nuevo valor epidemiológico.

3. **Balance de stocks: flujo de complicaciones mal dimensionalizado y destinos incompletos, corregidos.** Previamente se restaba `unreferred/0,15` de C pese a que `unreferred` ya era un flujo, y no se registraba la recuperación desde C ni la muerte en hogar como transferencias/salidas coherentes. Ahora, con nacimientos mensuales `B`, flujos de parto `F`, referencias `R`, complicaciones no referidas `U`, muerte domiciliaria `H`, muerte en tránsito `T`, muerte en centro `V`, recuperación `C/τC` y salida posparto `P/τP`:

   - `W' = 1,05B − ANC1/3,5 − ANC1/7,5`
   - `A' = ANC1/3,5 − ANC1/4,5`
   - `D' = F_inst + R − D/τD`
   - `C' = U − H − C/τC`
   - `P' = (F_home − H) + (D/τD − T − V) + C/τC − P/τP`

   Por tanto `W'+A'+D'+C'+P' = 1,05B − H − T − V − P/τP`. Los flujos internos se cancelan; las únicas pérdidas del sistema son las tres mortalidades modeladas y el egreso posparto. Ese egreso es frontera/fin de seguimiento, no una muerte. Se añadió una prueba de esta identidad de flujos.

4. **Validación e intervalos: rotulado aclarado.** OMS/MMEIG sigue siendo anclaje de calibración, por tanto métricas MMR respecto a ese valor no son validación independiente. P2,5–P97,5 se rotula como percentiles de incertidumbre paramétrica por distribuciones uniformes independientes en rangos documentados, con clipping de dominio; no son IC estadísticos ni intervalo predictivo. No se cambió ningún supuesto paramétrico para perseguir las cifras antiguas.

## Nueva ejecución y comparación con los resultados publicados

Valores globales agregados por nacidos vivos (RMM = muertes/nacidos vivos ×100.000). La diferencia es nueva menos antiguo; los antiguos se leen de `data/results/final_global_results.csv`, copiados/contrastados por `results/previous_global_csv_comparison.csv`. Desglose por los 125 pares territorio/escenario: `results/previous_territory_csv_comparison.csv`.

| Escenario | RMM antigua → nueva | Muertes evitadas antigua → nueva | Reducción de muertes antigua → nueva |
|---|---:|---:|---:|
| Base | 262,61 → 261,50 | 0,00 → 0,00 | 0,00% → 0,00% |
| A | 225,29 → 224,04 | 1.230,43 → 1.235,16 | 14,21% → 14,32% |
| B | 198,76 → 199,78 | 2.102,52 → 2.032,11 | 24,28% → 23,57% |
| C | 222,96 → 222,67 | 1.305,42 → 1.278,52 | 15,08% → 14,83% |
| D | 83,02 → 99,78 | 5.920,07 → 5.330,47 | 68,37% → 61,82% |

La población agregada antigua reporta 3.297.468,90 nacidos vivos; la nueva 3.299.590,49 en D. El cambio de resultados refleja ecuaciones corregidas y agregación de nacidos vivos simulados por escenario. Los CSV nuevos mantienen separados `death_reduction_percent` (conteo de muertes) y `mmr_reduction_percent` (RMM); no deben intercambiarse.

## Garissa y robustez recalculadas

- **Equidad D, 36 meses:** Q1 anclaje 890; RMM baseline simulada 891,77 y D 418,75. Q5 anclaje 340; baseline simulada 341,84 y D 162,25. Brecha firmada D `Q1−Q5 = +256,50` muertes por 100.000 nacidos vivos (positiva: Q1 mayor). Baseline firmado = +549,93. La afirmación previa «brecha <6» no se sostiene y debe reemplazarse; no se debe describir el gradiente como observado.
- **Sobol, D/12 meses, N=64, semilla 42:** 640 evaluaciones del output emparejado de muertes evitadas. Los mayores índices totales nuevos son `road_quality_index` ST=0,7266 (IC bootstrap interno SALib ±0,1936), `travel_time_hours` ST=0,1340 (±0,0482), `community_trust_baseline` ST=0,1488 (±0,0497) y `skilled_staff_ratio` ST=0,1329 (±0,3024). No coincide con la afirmación antigua de que staff explicaba ~95,5% de la varianza; actualizar índices y texto. Todas las filas e índices están en `results/garissa_sobol_draws.csv` y `garissa_sobol_indices.csv`. `S1_conf`/`ST_conf` de SALib describen dispersión de estimación por diseño; no son incertidumbre epidemiológica.
- **Monte Carlo paramétrico, D/36 meses, 200, semilla 42:** muertes evitadas media=132,46; P2,5=130,01; P97,5=135,03. Costo por muerte evitada media=$99.098,91; P2,5=$97.198,35; P97,5=$100.956,06. Sustituye los antiguos valores media 173,15 [135,45;195,63] y costo medio $76.845 [67.093;96.900]. No llamar “IC 95%”; describirlo como rango central de incertidumbre paramétrica bajo los supuestos anteriores.

## Pruebas, manuscrito y límites pendientes

Pruebas dirigidas ejecutadas: `python -m pytest backend/tests/test_model_integrity_corrections.py backend/tests/test_validation.py -q`, **14 passed**, resultado en `logs/targeted_tests.log`; incluyen anclaje de quintil real, requerimiento de anclaje, dimensiones de congestión, balance de stocks e interpretación de percentiles. La suite completa `python -m pytest backend/tests -q` había terminado previamente con **65 passed, 1 warning** (deprecación de PyPDF2), según el registro de esta auditoría; el intento de repetirla durante esta etapa no produjo salida y fue detenido, por lo que no se considera un nuevo resultado exitoso. Ninguna prueba valida predicción MMR independiente.

Actualizar en el artículo: Tabla 3 (todas las filas de muertes/RMM y porcentajes A–D); resumen/abstract y conclusiones con RMM basal y D, muertes evitadas y eficacia porcentual; figura de resultados A–D y cualquier leyenda/tabla territorial que use el CSV antiguo; afirmación de Sobol; resultado de brecha Garissa; media y percentiles de Monte Carlo junto con su rótulo; cifras derivadas como costos por muerte evitada. Las tablas de DHS/SPA y la figura de accesibilidad no son resultados de estas ecuaciones y no se han vuelto a calcular. **No se modificaron Word ni figuras.**

No se determina la causa de diferencias entre los CSV publicados y la ejecución histórica. Esta corrida usa los CSV versionados actuales en una copia autocontenida, no el PostgreSQL histórico ausente. Tampoco puede validarse la validez epidemiológica de los anclajes de MMR por quintil con microdatos distritales representativos: hace falta una fuente válida de RMM estratificada para Garissa o justificación externa verificable de esos valores. El modelo no prueba efectos causales, cobertura clínica de emergencia real, sincronización en tiempo real ni desempeño predictivo independiente.
