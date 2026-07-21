from sqlalchemy.orm import declarative_base, declared_attr
from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.sql import func
from app.middleware.tenant import tenant_id

Base = declarative_base()

class TenantMixin:
    """
    Mixin que se añadirá a todas las tablas que requieran aislamiento por empresa.
    Inyecta automáticamente la columna empresa_id.
    """
    @declared_attr
    def empresa_id(cls):
        # Index=True es crucial para búsquedas multi-tenant eficientes
        return Column(Integer, index=True, nullable=False, default=lambda: tenant_id.get())

class TimestampMixin:
    """
    Mixin estándar para auditoría de tiempo.
    """
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
