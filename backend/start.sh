#!/bin/bash
# Ejecutar migraciones de base de datos
python -m alembic upgrade head

# Arrancar el servidor web
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
