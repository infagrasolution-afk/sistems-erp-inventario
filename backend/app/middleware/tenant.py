from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from contextvars import ContextVar
from jose import jwt, JWTError
from app.core.config import settings

# ContextVar global para almacenar el ID de la empresa en la solicitud actual
# Esto nos permite acceder a la empresa sin tener que pasar el ID manualmente por todas las funciones.
tenant_id: ContextVar[int] = ContextVar("tenant_id", default=None)
is_superuser_ctx: ContextVar[bool] = ContextVar("is_superuser", default=False)

class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Excluir rutas públicas como login/registro o docs
        public_paths = ["/docs", "/openapi.json", "/api/auth/login", "/api/auth/register"]
        if any(request.url.path.startswith(path) for path in public_paths):
            return await call_next(request)

        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
                empresa_id = payload.get("empresa_id")
                is_superuser = payload.get("is_superuser", False)
                
                if empresa_id is not None:
                    # Inyectar el empresa_id en el contexto asíncrono
                    tenant_id.set(empresa_id)
                    is_superuser_ctx.set(is_superuser)
            except JWTError:
                # Si el token es inválido, FastAPI lo manejará después en Depends(get_current_user)
                pass
                
        response = await call_next(request)
        return response
