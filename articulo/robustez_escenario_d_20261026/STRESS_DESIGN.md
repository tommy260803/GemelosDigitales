# Diseño de sensibilidad fijado antes de ejecutar

D corregido fija la disponibilidad de personal 24/7, sangre y oxitocina/misoprostol en 95%. Se compararán tres niveles para esos componentes:

| Variante | Personal 24/7 | Sangre | Uterotónicos | Definición |
|---|---:|---:|---:|---|
| D corregido | 95% | 95% | 95% | Reglas originales del D corregido |
| D estrés moderado | 75% | 75% | 75% | Reducción de 20 puntos porcentuales |
| D estrés severo | 50% | 50% | 50% | Reducción de 45 puntos porcentuales |

Los puntos 75% y 50% son una perturbación analítica moderada y otra severa sobre el 95% supuesto por el escenario. **No se han estimado a partir de datos de los territorios** y no representan probabilidades ni estados reales de preparación. Se eligen para medir cuánto depende el resultado del supuesto optimista, con una caída moderada y una reducción a disponibilidad parcial de la mitad.

La misma línea base por territorio se reutiliza en cada variante y para A, B y C. El motor, los insumos y las demás reglas D (acceso, costos/seguro, comunidad, confianza, protocolo) permanecen iguales. El motor deja explícito que estos son reemplazos temporales de reglas de escenario en el análisis de sensibilidad: las variantes no se denominan ni publican como el D original.

Variables del motor relacionadas:

- `staff_247_availability_rate`: transforma la capacidad por `staff_247 + (1−staff_247)×non247_relative_capacity`; el parámetro `non247_relative_capacity=0.33` es un supuesto interno del modelo.
- capacidad efectiva: `births_mes × 0.12 × skilled_staff_ratio / 1.5 × disponibilidad_efectiva`.
- calidad: combina personal, sangre y uterotónicos con pesos internos 0,4/0,3/0,3, y resta una penalización por congestión.
- demora clínica: incluye déficits de sangre, uterotónicos y disponibilidad efectiva de personal, además de congestión.
- `skilled_staff_ratio` por 10.000 habitantes no cambia entre variantes; D no modela una intervención de aumento de densidad de personal.

Las entradas por territorio se conservan junto con los valores transformados efectivos. Los valores 95/75/50 de las variantes son supuestos del ejercicio; el CSV sólo aporta los valores de base, que D sustituye.
