from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class Empresa(Base, TimestampMixin):
    """
    Tabla maestra del esquema Multi-Tenant.
    Cada empresa es un inquilino (tenant) independiente.
    """
    __tablename__ = "empresas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    rut_o_nit = Column(String(50), unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True)

    # Relaciones
    usuarios = relationship("User", back_populates="empresa")

class User(Base, TimestampMixin):
    """
    Tabla de usuarios. A diferencia de las tablas transaccionales, 
    esta NO usa TenantMixin porque la columna empresa_id es su ForeignKey directa.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    is_superuser = Column(Boolean, default=False)
    
    # La clave foránea que ata al usuario a una empresa específica
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False, index=True)

    # Relaciones
    empresa = relationship("Empresa", back_populates="usuarios")
