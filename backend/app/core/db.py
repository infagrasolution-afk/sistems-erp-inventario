from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import event
from sqlalchemy.orm import ORMExecuteState
from app.core.config import settings
from app.middleware.tenant import tenant_id, is_superuser_ctx

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

@event.listens_for(AsyncSessionLocal.sync_session_class, "do_orm_execute")
def receive_do_orm_execute(orm_execute_state: ORMExecuteState):
    """
    Filtro Global Multi-Tenant.
    Intercepta TODAS las consultas y añade automáticamente WHERE empresa_id = X
    Solo se ignora si el usuario es Super Admin.
    """
    if orm_execute_state.is_select or orm_execute_state.is_update or orm_execute_state.is_delete:
        # Import local para evitar referencias circulares
        from app.models.base import TenantMixin
        
        # Ignorar si es superusuario
        if is_superuser_ctx.get():
            return
            
        current_tenant = tenant_id.get()
        if current_tenant:
            # Obtener los modelos involucrados en la consulta
            for mapper in orm_execute_state.statement.column_descriptions:
                entity = mapper.get("entity")
                # Si el modelo hereda de TenantMixin, inyectamos el filtro
                if entity and issubclass(entity, TenantMixin):
                    orm_execute_state.statement = orm_execute_state.statement.where(
                        entity.empresa_id == current_tenant
                    )

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
