from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class TransactionTypeEnum(str, Enum):
    IN = "ENTRADA"
    OUT = "SALIDA"
    TRANSFER_OUT = "TRASLADO_SALIDA"
    TRANSFER_IN = "TRASLADO_ENTRADA"
    RETURN_CLIENT = "DEVOLUCION_CLIENTE"
    RETURN_PROVIDER = "DEVOLUCION_PROVEEDOR"
    SHRINKAGE = "MERMA"

class TransferStatusEnum(str, Enum):
    PENDING = "PENDIENTE"
    COMPLETED = "COMPLETADO"
    CANCELLED = "CANCELADO"

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class WarehouseCreate(BaseModel):
    name: str
    location: Optional[str] = None

class ProductCreate(BaseModel):
    sku: str
    name: str
    price: float = Field(ge=0.0)
    category_id: Optional[int] = None

class InventoryMovementCreate(BaseModel):
    product_id: int
    warehouse_id: int
    type: TransactionTypeEnum
    quantity: float = Field(gt=0.0, description="Cantidad a mover (siempre positivo en el request)")
    unit_cost: float = Field(default=0.0, ge=0.0)
    reference: Optional[str] = None

class TransferCreate(BaseModel):
    product_id: int
    source_warehouse_id: int
    destination_warehouse_id: int
    quantity: float = Field(gt=0.0)
    reference: Optional[str] = None

# ---- Response Models ----

class CategoryResponse(CategoryCreate):
    id: int
    
    class Config:
        from_attributes = True

class WarehouseResponse(WarehouseCreate):
    id: int
    
    class Config:
        from_attributes = True

class ProductResponse(ProductCreate):
    id: int
    category: Optional[CategoryResponse] = None
    total_stock: float = 0.0

    class Config:
        from_attributes = True

class DashboardMetricsResponse(BaseModel):
    total_products: int
    entries_month: float
    exits_month: float
    total_transactions: int

class UserBasic(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class TransactionResponse(BaseModel):
    id: int
    product: ProductResponse
    warehouse: WarehouseResponse
    user: UserBasic
    type: str
    quantity: float
    unit_cost: float
    reference: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class TransferResponse(BaseModel):
    id: int
    product: ProductResponse
    source_warehouse: WarehouseResponse
    destination_warehouse: WarehouseResponse
    quantity: float
    status: str
    reference: Optional[str] = None
    created_by_user: UserBasic
    created_at: datetime
    
    class Config:
        from_attributes = True
