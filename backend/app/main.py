from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.middleware.tenant import TenantMiddleware
from app.api import auth, inventory, admin

app = FastAPI(title=settings.PROJECT_NAME)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción, ajustar al dominio de Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Multi-Tenant Context Middleware
app.add_middleware(TenantMiddleware)

# Rutas
app.include_router(auth.router)
app.include_router(inventory.router)
app.include_router(admin.router)

@app.get("/")
def read_root():
    return {"message": "ERP Multi-Tenant API is running"}
