from pydantic import BaseModel, EmailStr
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str

class UserLogin(BaseModel):
    username: str
    password: str

class EmpresaCreate(BaseModel):
    nombre: str
    rut_o_nit: str

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str

class RegistrationRequest(BaseModel):
    """
    Payload para cuando una nueva empresa se registra en el SaaS.
    Crea la empresa y su usuario administrador inicial.
    """
    empresa: EmpresaCreate
    admin_user: UserCreate
