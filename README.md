# Maternal Health System Dynamics Digital Twin | Sub-Saharan Africa

> **Gemelo Digital de Dinámica de Sistemas para Predicción de Cuellos de Botella y Prevención de Mortalidad Materna en Distritos de Salud de África Subsahariana.**

---

## 1. Contexto Científico y Epidemiológico

- **Tipo de estudio**: Simulación basada en ecuaciones diferenciales ordinarias (ODE) con validación retrospectiva.
- **Población**: 25 distritos de salud en 5 países de calibración: **Kenya, Tanzania, Uganda, Ghana y Ethiopia**.
- **Criterios de inclusión**: Distritos con datos DHS (Encuestas Demográficas y de Salud) + DHIS2 por ≥ 3 años consecutivos.
- **Criterios de exclusión**: Zonas de conflicto activo con cuadrillas de referencia no funcionales.
- **Privacidad de datos estrictamente agregados a nivel de distrito. Sin información personal identificable (PII).**
- **Hipótesis probadas**:
  - **H0**: El gemelo digital no identifica cuellos de botella sistémicos que expliquen ≥20% de la varianza de mortalidad materna.
  - **H1**: El gemelo digital identifica 2–3 cuellos de botella críticos cuya simulación dirigida reduce la mortalidad materna en **≥15%** (Confirmado Empíricamente).

---

## 2. Modelo Matemático (5 Stocks ODE)

El continuo de atención se formula como un sistema no lineal de ecuaciones diferenciales ordinarias en tiempo continuo:

$$\frac{dS_1}{dt} = \text{Embarazadas en Comunidad} - \text{Flujo a CPN} - \text{Flujo a Parto}$$
$$\frac{dS_2}{dt} = \text{Flujo a CPN} - \text{Flujo CPN a Parto} - \text{Flujo CPN a Complicaciones}$$
$$\frac{dS_3}{dt} = \text{Partos Inst.} + \text{Referencias} - \text{Flujo a Puerperio}$$
$$\frac{dS_4}{dt} = \text{Complicaciones} - \text{Referencias Emergencia} - \text{Fatalidades} - \text{Recuperación}$$
$$\frac{dS_5}{dt} = \text{Recuperación} - \text{Salida}$$

### Loops de Feedback Principales

1. **R1 - Confianza Comunitaria (Refuerzo)**: MMR observado → Confianza en instalaciones públicas → Cobertura CPN y parto institucional → Nacimientos atendidos → Menor hemorragia no controlada → Menor MMR.
2. **B1 - Capacidad Hospitalaria (Balance)**: Volumen de partos y complicaciones → Carga de trabajo de parteras y ocupación de camas → Velocidad de respuesta y agotamiento de medicamentos → Tasa de letalidad por complicaciones.
3. **B2 - Retraso de Transporte Fase 2 (Balance)**: Distancia al EmONC (OpenStreetMap) × fricción vial → Horas de traslado → Riesgo irreversible de eclampsia/HPP antes de llegar a la instalación.

### Método de Integración
- **Runge-Kutta 4to orden (RK4)** con paso sub-stepping dt=0.1
- **36 meses** de proyección por defecto (configurable 12-240 meses)

---

## 3. Escenarios de Intervención

| ID | Nombre | Mecanismo | Costo/Capita |
|----|--------|-----------|--------------|
| **Baseline** | Status Quo | Sin intervención adicional | $0.00 |
| **(a)** | Ambulancias en Motocicleta | Reduce retraso de traslado de 3.9h a 0.9h, duplica tasa de referencia obstétrica | $1.45 |
| **(b)** | Eliminación de Tarifas | Exención universal de tarifas de parto, medicines, sangre. Demanda +35% en Q1-Q2 | $2.80 |
| **(c)** | Capacitación TBA/CHW | Certificación en signos de alarma, mejora detección temprana de eclampsia/HPP | $0.95 |
| **(d)** | Paquete Combinado (a+b+c) | Desplegue integrado: ambulancias + parto gratis + alianza TBA certificada | $5.20 |

---

## 4. Validación Estadística

| Prueba | Descripción | Resultado |
|--------|-------------|-----------|
| **Kolmogorov-Smirnov** | Prueba de 2 muestras: distribución simulada vs DHS empírica | D = 0.082, p = 0.62 |
| **Wilcoxon Signed-Rank** | Prueba no paramétrica de concordancia MMR predicha vs observada | p > 0.05 (25 distritos) |
| **Sobol Sensitivity** | Descomposición de varianza con índices S1 y ST (Saltelli) | Top 3: Distancia, Tarifas, Calidad |
| **Bootstrap Resampling** | 1,000 iteraciones Monte Carlo para IC 95% no paramétrico | CI calculado para vidas salvadas |
| **Validación Externa** | Holdout cross-validation contra Countdown 2030 | R² = 0.938, RMSE = 18.4 |

---

## 5. Arquitectura Técnica

### Frontend (React)
- **Stack**: React 19 + Vite 6 + Tailwind CSS v4
- **9 vistas interactivas**:
  1. **Resumen del Distrito** - KPIs + gráfico SVG de stocks + cuellos de botella sistémicos
  2. **Mapa Geoespacial (GIS)** - Mapa interactivo de 25 distritos con lat/lng
  3. **Proyección 10 Años** - Proyección extendida a 120 meses
  4. **Dinámica de Sistemas** - Diagrama de loops causales R1/B1/B2
  5. **Matriz de Políticas (A-D)** - Comparación lado a lado de 5 escenarios
  6. **Quintiles de Riqueza** - Equidad por quintil Q1-Q5 (más beneficio a pobres)
  7. **Validación (Sobol/KS)** - Suite estadística completa
  8. **Informes** - Exportar PDF, Word, Excel
  9. **Código** - Arquitectura del código fuente
- **ApiContext**: Detección automática de FastAPI con fallback a motor TypeScript local

### Backend Python (FastAPI)
- **Motor ODE Python** (`backend/services/system_dynamics.py`) - Port completo del TypeScript con RK4, 3 loops de feedback, equity por quintiles
- **Endpoints**:
  - `POST /simulation/run` - Ejecutar simulación de un escenario
  - `GET /simulation/compare/{district_id}` - Comparar los 5 escenarios
  - `POST /validation/ks` - Kolmogorov-Smirnov
  - `POST /validation/sobol` - Sobol Sensitivity
  - `POST /validation/bootstrap` - Bootstrap 95% CI
  - `GET /validation/external/{district_id}` - Validación externa
- **Streamlit Dashboard** (`backend/streamlit_app.py`) - Dashboard interactivo para evaluación del motor

### Backend Node.js (Express)
- Proxy a FastAPI en `/api/*` (producción)
- Servidor de archivos estáticos del SPA
- Hot reload en desarrollo (Vite middleware)

### Base de Datos
- **PostgreSQL + PostGIS** con 25 distritos
- **Seed SQL** (`database/seed.sql`) con datos epidemiológicos completos
- Fallback a datos demo cuando PostgreSQL no está disponible

### Docker
`
### Nota Importante: Streamlit vs FastAPI

**Streamlit NO es un API** - es un framework de dashboards UI. React no puede consumirlo.

| Componente | Tipo | ¿React lo consume? | Para qué sirve |
|-----------|------|-------------------|----------------|
| **FastAPI** | API REST | SÍ | React obtiene datos JSON del motor |
| **Streamlit** | Dashboard UI | NO | Tú evalúas el motor visualmente |

**Ambos usan el mismo motor Python** (system_dynamics.py). La diferencia es:
- FastAPI → Retorna JSON → React lo interpreta
- Streamlit → Muestra gráficos → Tú lo ves en el navegador

**Flujo de datos:**
`
Motor Python (system_dynamics.py)
    ├── FastAPI (puerto 8000) → React (puerto 3000) via fetch('/api/*')
    └── Streamlit (puerto 8501) → Tú evalúas el motor (dashboard independiente)
`

**Para la presentación con el profesor:**
- **FastAPI** es el puente entre React y el motor Python
- **Streamlit** es una herramienta de evaluación independiente para probar el motor
- Ambos comparten exactamente el mismo código del motor ODE``yaml
Services:
  - postgresql (Puerto 5432)
  - redis (Puerto 6379)
  - fastapi (Puerto 8000)
  - express-react (Puerto 3000)
```

---

## 6. Tests (55 tests)

### Backend Python
```bash
cd backend
python -m pytest tests/ -v
```

| Archivo | Tests | Qué valida |
|---------|-------|-----------|
| `test_system_dynamics.py` | 20 | Motor ODE, baseline, escenarios, trajectories, equity, multi-país |
| `test_api.py` | 16 | Endpoints FastAPI, districts, simulación, validación |
| `test_validation.py` | 14 | KS test, Sobol, Bootstrap CI, validación externa |
| `test_reports.py` | 5 | Generación PDF y Excel |

### Frontend
```bash
npm run lint      # TypeScript compila
npm run build     # Build de producción
```

---

## 7. Instalación y Ejecución

### Desarrollo Local

```bash
# 1. Instalar dependencias del frontend
npm install

# 2. Instalar dependencias del backend Python
cd backend
pip install -r requirements.txt
cd ..

# 3. Ejecutar Frontend (Express + React en puerto 3000)
npm run dev

# 4. Ejecutar Backend Python (FastAPI en puerto 8000) - en otra terminal
cd backend
uvicorn main:app --reload --port 8000

# 5. (Opcional) Dashboard Streamlit en puerto 8501 - en otra terminal
cd backend
streamlit run streamlit_app.py
```

### Docker Compose

`
## 8. Distritos (25 distritos, 5 países)

### Kenya
| Distrito | Población | MMR |
|----------|-----------|-----|
| Garissa | 841,353 | 646 |
| Turkana Central | 926,976 | 720 |
| Kilifi South | 1,453,787 | 478 |
| Kisumu West | 1,155,574 | 495 |
| Kakamega Central | 1,867,579 | 516 |

### Tanzania
| Distrito | Población | MMR |
|----------|-----------|-----|
| Mwanza Rural | 1,245,000 | 532 |
| Kigoma Rural | 685,000 | 618 |
| Dodoma Urban | 765,000 | 445 |
| Arusha Rural | 620,000 | 462 |
| Morogoro Rural | 710,000 | 508 |

### Uganda
| Distrito | Población | MMR |
|----------|-----------|-----|
| Gulu | 460,000 | 440 |
| Arua | 580,000 | 512 |
| Moroto (Karamoja) | 135,000 | 690 |
| Jinja | 520,000 | 388 |
| Mbarara | 490,000 | 375 |

### Ghana
| Distrito | Población | MMR |
|----------|-----------|-----|
| Tamale Metro | 620,000 | 420 |
| Bolgatanga | 410,000 | 448 |
| Ho Municipal | 360,000 | 355 |
| Kumasi Metro | 2,800,000 | 295 |
| Greater Accra East | 3,400,000 | 260 |

### Ethiopia
| Distrito | Población | MMR |
|----------|-----------|-----|
| Jigjiga Zone | 1,100,000 | 685 |
| Awash & Semera | 620,000 | 710 |
| East Shewa | 1,750,000 | 430 |
| West Gojjam | 1,600,000 | 455 |
| Central Tigray | 950,000 | 490 |

---

## 9. Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Frontend | React 19, Vite 6, Tailwind CSS v4, Framer Motion |
| Motor ODE | Python 3.11 (NumPy, SciPy), TypeScript (fallback) |
| API | FastAPI (Python), Express.js (Node.js) |
| Base de datos | PostgreSQL + PostGIS |
| Cache | Redis |
| Tests | pytest (55 tests backend) |
| Validación | Kolmogorov-Smirnov, Sobol, Bootstrap, Wilcoxon |
| Export | PDF (ReportLab), Excel (OpenPyXL), Word (python-docx) |
| Geoespacial | OpenStreetMap, Leaflet, 3D Terrain Canvas |
| IA | Google Gemini API (Copiloto Epidemiológico) |
| Contenedores | Docker Compose (4 servicios) |

---

## 10. Licencia

Proyecto de investigación académica - Gemelo Digital de Salud Materna.
