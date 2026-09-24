# Despliegue gratuito

Este proyecto se puede publicar con una cuenta gratuita usando dos servicios Docker en Render y una base PostgreSQL/PostGIS en Supabase:

- **Render Web Service `maternal-health-api`**: FastAPI + motor RK4.
- **Render Web Service `maternal-health-web`**: Express + React/Vite + proxy `/api`.
- **Supabase Free**: PostgreSQL + PostGIS.
- **Redis**: no es obligatorio actualmente. El código desplegable no usa `REDIS_URL` en ninguna ruta activa. Si se incorpora caché o colas más adelante, se puede añadir Upstash Redis o Render Key Value.

> Esta configuración es gratuita para pruebas, demostraciones y un proyecto académico. No debe considerarse una garantía de disponibilidad para producción clínica.

## Límites importantes

- Los servicios web **Free de Render se duermen después de 15 minutos sin tráfico** y pueden tardar alrededor de un minuto en despertar.
- Render ofrece 750 horas gratuitas mensuales por workspace para servicios Free.
- El filesystem de Render es efímero: no guardes archivos subidos ni bases SQLite allí.
- No uses Render Postgres Free para este proyecto como solución permanente: la documentación actual indica que expira a los 30 días.
- Supabase Free incluye 500 MB de base de datos y pausa proyectos después de una semana de inactividad.
- Supabase Free no sustituye un sistema de backups de producción.
- Guarda los datos sensibles sólo como variables protegidas de Render. No subas `.env` ni contraseñas al repositorio.

Referencias oficiales:

- [Render: despliegue gratuito](https://render.com/docs/free)
- [Render: servicios Docker](https://render.com/docs/docker)
- [Supabase: planes](https://supabase.com/pricing)
- [Supabase: PostGIS](https://supabase.com/docs/guides/database/extensions/postgis)
- [Supabase: conexiones PostgreSQL](https://supabase.com/docs/guides/database/connecting-to-postgres)

## 1. Preparar el repositorio

1. Sube el repositorio a GitHub.
2. Comprueba localmente que el build funciona:

```powershell
npm install
npm run lint
npm run build
docker compose up --build -d
docker compose ps
```

3. Comprueba que el frontend local responde en `http://localhost:3000` y que `http://localhost:3000/api/health` devuelve HTTP 200.

El archivo [`render.yaml`](render.yaml) ya contiene la definición de los dos servicios Docker.

## 2. Crear PostgreSQL/PostGIS en Supabase

1. Crea un proyecto gratuito en [Supabase](https://supabase.com/dashboard).
2. Abre **Database > Extensions**.
3. Activa `postgis` y `pg_trgm`.
4. Abre **SQL Editor** y ejecuta, en este orden:

```text
database/schema.sql
database/seed.sql
```

5. En Supabase, abre **Connect** y selecciona **Session pooler**. Copia la cadena PostgreSQL completa.
6. Añade `?sslmode=require` si la cadena no incluye ya el modo SSL. Ejemplo de forma:

```text
postgresql://postgres.PROJECT_REF:CONTRASEÑA@POOLER_HOST:5432/postgres?sslmode=require
```

Usa la cadena del panel de Supabase, no sustituyas manualmente el host del pooler. Si la contraseña contiene `@`, `#`, `?`, `&` o espacios, codifícala en URL.

El backend también ejecuta automáticamente:

```text
scripts/load_model_inputs.py
```

al iniciar. Ese paso valida y actualiza los 25 territorios desde `data/model_inputs`.

## 3. Crear los servicios en Render

### Opción recomendada: Blueprint

1. Entra en [Render Dashboard](https://dashboard.render.com/).
2. Selecciona **New > Blueprint**.
3. Conecta el repositorio de GitHub.
4. Render detectará [`render.yaml`](render.yaml).
5. Confirma la creación de `maternal-health-api` y `maternal-health-web` con plan **Free**.
6. En el servicio `maternal-health-api`, añade:

```text
DATABASE_URL=<cadena de Supabase Session pooler>
GEMINI_API_KEY=<opcional>
```

7. En el servicio `maternal-health-web`, verifica:

```text
NODE_ENV=production
BACKEND_URL=http://maternal-health-api:8000
API_URL=http://maternal-health-api:8000
```

Si Render asigna un hostname interno distinto, reemplaza ambas variables por la dirección privada que aparece en **Connect** del servicio FastAPI.

### Opción manual

Si no quieres usar Blueprint, crea dos **Web Services** desde el mismo repositorio.

**Importante para el servicio FastAPI:** deja **Root Directory vacío** o escribe `.`. No uses `backend` como Root Directory. El Dockerfile necesita acceder a `backend/`, `data/model_inputs/` y `scripts/` desde la raíz del repositorio. En Render, configura:

```text
Dockerfile Path: backend/Dockerfile
Docker Context: .
Root Directory: .
```

#### Servicio FastAPI

- Name: `maternal-health-api`
- Runtime: Docker
- Dockerfile: `backend/Dockerfile`
- Docker context: raíz del repositorio
- Root Directory: `.` (no `backend`)
- Plan: Free
- Health check path: `/health`
- Variable obligatoria: `DATABASE_URL`
- Variable opcional: `GEMINI_API_KEY`

#### Servicio Express/React

- Name: `maternal-health-web`
- Runtime: Docker
- Dockerfile: `Dockerfile.frontend`
- Docker context: raíz del repositorio
- Plan: Free
- Health check path: `/api/health`
- `NODE_ENV=production`
- `BACKEND_URL=http://maternal-health-api:8000`
- `API_URL=http://maternal-health-api:8000`

Mantén ambos servicios en la misma región de Render, preferiblemente `Oregon`, para usar la red privada y reducir latencia.

## 4. Verificar el despliegue

Cuando los dos servicios estén activos:

1. Abre la URL pública de `maternal-health-web`.
2. Comprueba:

```text
https://TU_FRONTEND.onrender.com/api/health
https://TU_API.onrender.com/health
https://TU_FRONTEND.onrender.com/api/districts
```

3. La aplicación debe cargar distritos, ejecutar simulaciones y mostrar el mapa.
4. Abre los logs de ambos servicios si el dashboard muestra `Backend no disponible`.

La aplicación React no necesita conocer directamente la URL pública de FastAPI: Express reenvía `/api/*` al backend usando `BACKEND_URL`.

## 5. Diagnóstico rápido

### El frontend devuelve `Backend no disponible`

- Revisa que `maternal-health-api` esté **Live**.
- Revisa `BACKEND_URL` en el servicio web.
- Usa el hostname interno de Render, no `localhost`.
- Espera el despertar del servicio Free y recarga la página.

### FastAPI se reinicia durante el arranque

- Revisa que `DATABASE_URL` exista y sea válida.
- Comprueba que Supabase esté activo y que PostGIS esté habilitado.
- Revisa los logs de `scripts/load_model_inputs.py`.
- Usa la conexión **Session pooler** de Supabase desde Render IPv4.

### La base está vacía

- Ejecuta `database/schema.sql` antes de `database/seed.sql`.
- Comprueba que `scripts/load_model_inputs.py` termine con `Upserted 25 territories`.

### Gemini no responde

`GEMINI_API_KEY` es opcional. El dashboard funciona sin ella, pero las funciones que dependen de Gemini no estarán disponibles.

### Redis

No configures Redis para el primer despliegue: no es una dependencia activa del backend actual. Si se añade código que lo requiera, crea una instancia gratuita en [Upstash Redis](https://console.upstash.com/) y define `REDIS_URL` en FastAPI. Recuerda que el plan gratuito de Redis es efímero o limitado y no debe contener datos críticos.

## 6. Actualizaciones posteriores

Cada push a la rama conectada de GitHub dispara un nuevo despliegue en Render.

Antes de hacer push:

```powershell
npm run lint
npm run build
```

No subas nunca:

```text
.env
.env.local
.env.production
*.pem
*.key
```

## Arquitectura resultante

```mermaid
flowchart LR
  U[Usuario] --> WEB[Render Free<br/>maternal-health-web]
  WEB -->|/api proxy| API[Render Free<br/>maternal-health-api]
  API --> DB[Supabase Free<br/>PostgreSQL + PostGIS]
  API -. opcional .-> REDIS[Upstash Redis<br/>futuro caché]
```
