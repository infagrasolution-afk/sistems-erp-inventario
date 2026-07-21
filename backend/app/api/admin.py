from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.db import get_db
from app.models.user import Empresa, User
from app.api.deps import get_current_superuser

router = APIRouter(prefix="/api/admin", tags=["super-admin"])

@router.get("/empresas")
async def get_all_empresas(db: AsyncSession = Depends(get_db), superuser: User = Depends(get_current_superuser)):
    """
    Lista todas las empresas registradas en el sistema.
    Solo accesible por el Súper Administrador.
    """
    result = await db.execute(select(Empresa))
    empresas = result.scalars().all()
    
    # Para cada empresa, buscar a su usuario administrador
    empresas_list = []
    for emp in empresas:
        # Buscar el usuario admin de la empresa (is_admin=True)
        user_res = await db.execute(select(User).where(User.empresa_id == emp.id, User.is_admin == True).limit(1))
        admin_user = user_res.scalar_one_or_none()
        
        empresas_list.append({
            "id": emp.id,
            "nombre": emp.nombre,
            "rut_o_nit": emp.rut_o_nit,
            "is_active": emp.is_active,
            "created_at": emp.created_at,
            "admin_username": admin_user.username if admin_user else "N/A"
        })
        
    return empresas_list
