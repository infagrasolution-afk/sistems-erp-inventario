from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.db import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User, Empresa
from app.schemas.user import Token, UserLogin, RegistrationRequest
from datetime import timedelta

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=Token)
async def register(req: RegistrationRequest, db: AsyncSession = Depends(get_db)):
    # 1. Verificar si la empresa (rut) o el usuario ya existen
    result_empresa = await db.execute(select(Empresa).where(Empresa.rut_o_nit == req.empresa.rut_o_nit))
    if result_empresa.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Ya existe una empresa con este RUT/NIT.")
        
    result_user = await db.execute(select(User).where(User.username == req.admin_user.username))
    if result_user.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está registrado.")

    # 2. Crear la Empresa
    new_empresa = Empresa(nombre=req.empresa.nombre, rut_o_nit=req.empresa.rut_o_nit)
    db.add(new_empresa)
    await db.flush() # Para obtener el ID de la empresa inmediatamente
    
    # 3. Crear el Usuario Administrador atado a esa empresa
    hashed_pw = get_password_hash(req.admin_user.password)
    new_user = User(
        username=req.admin_user.username,
        hashed_password=hashed_pw,
        full_name=req.admin_user.full_name,
        is_admin=True,
        empresa_id=new_empresa.id
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # 4. Generar el JWT
    access_token = create_access_token(subject=new_user.id, empresa_id=new_empresa.id, is_superuser=new_user.is_superuser)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == credentials.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Usuario inactivo.")

    access_token = create_access_token(subject=user.id, empresa_id=user.empresa_id, is_superuser=user.is_superuser)
    return {"access_token": access_token, "token_type": "bearer"}
