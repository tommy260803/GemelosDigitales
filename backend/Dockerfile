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
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

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

# Copy application code
COPY . .

# Environment
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Create __init__.py files for proper Python imports
RUN touch services/__init__.py

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
