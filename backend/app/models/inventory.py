from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base, TimestampMixin, TenantMixin
import enum

class TransactionType(str, enum.Enum):
    IN = "ENTRADA"
    OUT = "SALIDA"
    TRANSFER = "TRANSFERENCIA"

class Category(Base, TimestampMixin, TenantMixin):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255))
    
    products = relationship("Product", back_populates="category")

class Warehouse(Base, TimestampMixin, TenantMixin):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    location = Column(String(255))
    
    stocks = relationship("ProductWarehouse", back_populates="warehouse")
    transactions = relationship("InventoryTransaction", back_populates="warehouse")

class Product(Base, TimestampMixin, TenantMixin):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    price = Column(Float, nullable=False, default=0.0)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)

    category = relationship("Category", back_populates="products")
    stocks = relationship("ProductWarehouse", back_populates="product")
    transactions = relationship("InventoryTransaction", back_populates="product")

class ProductWarehouse(Base, TimestampMixin, TenantMixin):
    """
    Tabla caché que mantiene el stock actualizado por almacén.
    Se utiliza SELECT FOR UPDATE sobre esta tabla para prevenir saldos negativos.
    """
    __tablename__ = "product_warehouses"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    current_stock = Column(Float, nullable=False, default=0.0)

    product = relationship("Product", back_populates="stocks")
    warehouse = relationship("Warehouse", back_populates="stocks")

class InventoryTransaction(Base, TimestampMixin, TenantMixin):
    """
    El Libro Mayor o Kardex. Esta tabla es INMUTABLE.
    Ningún update o delete debería ejecutarse jamás aquí en el código.
    """
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    type = Column(String(50), nullable=False) # ENTRADA, SALIDA, TRANSFERENCIA
    quantity = Column(Float, nullable=False) # Positivo para entradas, Negativo para salidas
    unit_cost = Column(Float, nullable=False, default=0.0) # Costo en el momento de la transacción
    reference = Column(String(100)) # Referencia a Factura o Guía

    product = relationship("Product", back_populates="transactions")
    warehouse = relationship("Warehouse", back_populates="transactions")
    user = relationship("User")

class InventoryTransfer(Base, TimestampMixin, TenantMixin):
    __tablename__ = "inventory_transfers"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    source_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    destination_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    status = Column(String(50), nullable=False, default="PENDIENTE") # PENDIENTE, COMPLETADO, CANCELADO
    reference = Column(String(255))
    
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    received_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    product = relationship("Product")
    source_warehouse = relationship("Warehouse", foreign_keys=[source_warehouse_id])
    destination_warehouse = relationship("Warehouse", foreign_keys=[destination_warehouse_id])
    created_by_user = relationship("User", foreign_keys=[created_by])
    received_by_user = relationship("User", foreign_keys=[received_by])
