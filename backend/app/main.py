from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import update
from app.core.config import settings
from app.middleware.tenant import TenantMiddleware
from app.api import auth, inventory, admin

app = FastAPI(title=settings.PROJECT_NAME)

@app.on_event("startup")
async def startup_event():
    from app.core.db import AsyncSessionLocal
    from app.models.user import User
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(update(User).where(User.username == 'admin').values(is_superuser=True))
            await session.commit()
    except Exception as e:
        print("Error during startup superuser check:", e)

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
