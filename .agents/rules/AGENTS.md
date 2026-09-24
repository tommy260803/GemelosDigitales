# Maternal Health Digital Twin — Agent Guidelines

## 1. Scientific & Epidemiological Standards
- **Three-Delays Framework**: All maternal interventions must explicitly map to:
  - Phase 1: Decision to seek care (Community TBA training, cultural trust).
  - Phase 2: Identifying and reaching medical facility (Moto-ambulance network, geographic transport, road quality).
  - Phase 3: Receiving adequate and timely emergency obstetric care (EmONC staffing, blood bank, surgical supplies).
- **Runge-Kutta Integration (RK4)**:
  - Continuous ODE time-step: $\Delta t = 0.05$ months ($1.5$ days).
  - Numerical convergence must satisfy Cauchy relative error $\epsilon_{rel} < 0.01\%$.
- **Indicators**:
  - Baseline MMR and projected MMR are expressed as deaths per $100,000$ live births.
  - Never sum lives saved across mutually exclusive scenarios (A, B, C); only report Scenario D as the integrated package.

## 2. Technical Stack Rules
- **Backend**: Python 3.11+ / FastAPI. Pure Python differential equation solver (`SystemDynamicsEngine`). Do not add heavy external solvers like SciPy unless explicitly requested.
- **Database**: PostgreSQL 15 + PostGIS 3.3.
- **Frontend**: React 18, TypeScript (strict mode), Tailwind CSS, Lucide icons.
- **Language**: User interface labels, section headers, KPI cards, and tooltips must be presented in Spanish.
