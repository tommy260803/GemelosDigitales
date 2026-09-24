# =========================================================
# MATERNAL HEALTH DIGITAL TWIN: PYTHON BACKEND (FastAPI)
# Python 3.11 Slim with Scientific Computing Stack
# =========================================================

FROM python:3.11-slim AS builder

WORKDIR /app

# Install system dependencies for scipy, numpy, and report generation
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    gfortran \
    libpq-dev \
    libblas-dev \
    liblapack-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install Python dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# ---------- STAGE 2: Production ----------
FROM python:3.11-slim AS production

WORKDIR /app

# Install runtime dependencies only (no build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libblas3 \
    liblapack3 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy backend, versioned inputs, and validated loader from repository root.
COPY backend ./backend
COPY data/model_inputs ./data/model_inputs
COPY scripts/load_model_inputs.py ./scripts/load_model_inputs.py

# Environment
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import os, urllib.request; urllib.request.urlopen('http://localhost:' + os.environ.get('PORT', '8000') + '/health')"

# Create __init__.py files for proper Python imports
RUN touch backend/services/__init__.py

WORKDIR /app/backend
CMD ["sh", "-c", "python ../scripts/load_model_inputs.py && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
