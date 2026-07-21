from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from typing import List
from datetime import datetime, timedelta
from app.core.db import get_db
from app.models.inventory import Category, Warehouse, Product, ProductWarehouse, InventoryTransaction, InventoryTransfer
from app.schemas.inventory import (
    CategoryCreate, WarehouseCreate, ProductCreate, InventoryMovementCreate, TransactionTypeEnum,
    CategoryResponse, WarehouseResponse, ProductResponse, DashboardMetricsResponse, TransactionResponse,
    TransferCreate, TransferResponse, TransferStatusEnum
)
from app.api.deps import get_current_user_id

router = APIRouter(prefix="/api/inventory", tags=["inventory"])

@router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(InventoryTransaction)
        .options(
            selectinload(InventoryTransaction.product),
            selectinload(InventoryTransaction.warehouse),
            selectinload(InventoryTransaction.user)
        )
        .order_by(InventoryTransaction.created_at.desc())
        .limit(100) # Devolvemos las últimas 100 para MVP
    )
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category))
    return result.scalars().all()

@router.get("/warehouses", response_model=List[WarehouseResponse])
async def get_warehouses(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Warehouse))
    return result.scalars().all()

@router.get("/products", response_model=List[ProductResponse])
async def get_products(db: AsyncSession = Depends(get_db)):
    # Traer productos con sus categorías y stock sumado
    stmt = select(Product).options(selectinload(Product.category), selectinload(Product.stocks))
    result = await db.execute(stmt)
    products = result.scalars().all()
    
    response = []
    for p in products:
        total_stock = sum(stock.current_stock for stock in p.stocks)
        p_dict = {
            "id": p.id,
            "sku": p.sku,
            "name": p.name,
            "price": p.price,
            "category_id": p.category_id,
            "category": p.category,
            "total_stock": total_stock
        }
        response.append(p_dict)
    return response

@router.get("/metrics", response_model=DashboardMetricsResponse)
async def get_dashboard_metrics(db: AsyncSession = Depends(get_db)):
    # 1. Total Productos
    total_products = await db.scalar(select(func.count(Product.id)))
    
    # 2. Movimientos del último mes
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    # Entradas
    entries = await db.scalar(
        select(func.sum(InventoryTransaction.quantity))
        .where(InventoryTransaction.type == TransactionTypeEnum.IN.value)
        .where(InventoryTransaction.created_at >= thirty_days_ago)
    )
    
    # Salidas
    exits = await db.scalar(
        select(func.sum(InventoryTransaction.quantity))
        .where(InventoryTransaction.type == TransactionTypeEnum.OUT.value)
        .where(InventoryTransaction.created_at >= thirty_days_ago)
    )
    
    # Total Transacciones
    total_tx = await db.scalar(select(func.count(InventoryTransaction.id)))
    
    return {
        "total_products": total_products or 0,
        "entries_month": entries or 0,
        "exits_month": abs(exits or 0),
        "total_transactions": total_tx or 0
    }

@router.post("/categories")
async def create_category(req: CategoryCreate, db: AsyncSession = Depends(get_db)):
    db_cat = Category(name=req.name, description=req.description)
    db.add(db_cat)
    await db.commit()
    return {"message": "Categoría creada", "id": db_cat.id}

@router.post("/warehouses")
async def create_warehouse(req: WarehouseCreate, db: AsyncSession = Depends(get_db)):
    db_wh = Warehouse(name=req.name, location=req.location)
    db.add(db_wh)
    await db.commit()
    return {"message": "Almacén creado", "id": db_wh.id}

@router.post("/products")
async def create_product(req: ProductCreate, db: AsyncSession = Depends(get_db)):
    db_prod = Product(sku=req.sku, name=req.name, price=req.price, category_id=req.category_id)
    db.add(db_prod)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Error de integridad, posible SKU duplicado.")
    return {"message": "Producto creado", "id": db_prod.id}

@router.post("/movement")
async def register_movement(
    req: InventoryMovementCreate, 
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """
    Registra un movimiento de inventario (Entrada/Salida) usando transacciones ACID.
    Bloquea la fila del caché de inventario (ProductWarehouse) para evitar saldos negativos por concurrencia.
    """
    if req.type in [TransactionTypeEnum.IN, TransactionTypeEnum.RETURN_CLIENT, TransactionTypeEnum.TRANSFER_IN]:
        quantity = req.quantity
    else:
        quantity = -req.quantity

    # 1. Bloqueo Pesimista (SELECT FOR UPDATE)
    stmt = select(ProductWarehouse).where(
        ProductWarehouse.product_id == req.product_id,
        ProductWarehouse.warehouse_id == req.warehouse_id
    ).with_for_update() # ¡Crucial para alta concurrencia!

    result = await db.execute(stmt)
    stock_record = result.scalar_one_or_none()

    if not stock_record:
        # Si no existe caché previo en este almacén, lo creamos si es ENTRADA
        if req.type not in [TransactionTypeEnum.IN, TransactionTypeEnum.RETURN_CLIENT, TransactionTypeEnum.TRANSFER_IN]:
            raise HTTPException(status_code=400, detail="Stock insuficiente (No existe registro en este almacén).")
        
        stock_record = ProductWarehouse(
            product_id=req.product_id, 
            warehouse_id=req.warehouse_id, 
            current_stock=0.0
        )
        db.add(stock_record)
        await db.flush() # Guardar en memoria para usarlo

    # 2. Validar Stock Negativo
    if stock_record.current_stock + quantity < 0:
        raise HTTPException(status_code=400, detail="Stock insuficiente para realizar la salida.")

    # 3. Actualizar Caché de Stock
    stock_record.current_stock += quantity

    # 4. Registrar en el Kardex (Inmutable)
    transaction = InventoryTransaction(
        product_id=req.product_id,
        warehouse_id=req.warehouse_id,
        user_id=user_id,
        type=req.type.value,
        quantity=quantity,
        unit_cost=req.unit_cost,
        reference=req.reference
    )
    db.add(transaction)

    # 5. Commit de la Transacción Atómica
    await db.commit()

    return {
        "message": "Movimiento registrado exitosamente", 
        "new_stock": stock_record.current_stock
    }

@router.post("/transfers", response_model=TransferResponse)
async def create_transfer(
    req: TransferCreate, 
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """
    Inicia un traslado de inventario (Emisión). Descuenta del almacén de origen
    y crea un registro en estado PENDIENTE.
    """
    if req.source_warehouse_id == req.destination_warehouse_id:
        raise HTTPException(status_code=400, detail="El almacén de origen y destino no pueden ser el mismo.")

    # 1. Bloqueo Pesimista del Origen
    stmt = select(ProductWarehouse).where(
        ProductWarehouse.product_id == req.product_id,
        ProductWarehouse.warehouse_id == req.source_warehouse_id
    ).with_for_update()
    
    result = await db.execute(stmt)
    stock_origen = result.scalar_one_or_none()

    if not stock_origen or stock_origen.current_stock < req.quantity:
        raise HTTPException(status_code=400, detail="Stock insuficiente en el almacén de origen.")

    # 2. Descontar del origen
    stock_origen.current_stock -= req.quantity

    # 3. Registrar Salida en Kardex
    tx_out = InventoryTransaction(
        product_id=req.product_id,
        warehouse_id=req.source_warehouse_id,
        user_id=user_id,
        type=TransactionTypeEnum.TRANSFER_OUT.value,
        quantity=-req.quantity,
        reference=req.reference
    )
    db.add(tx_out)

    # 4. Crear el registro de Transferencia (En Tránsito)
    transfer = InventoryTransfer(
        product_id=req.product_id,
        source_warehouse_id=req.source_warehouse_id,
        destination_warehouse_id=req.destination_warehouse_id,
        quantity=req.quantity,
        status=TransferStatusEnum.PENDING.value,
        reference=req.reference,
        created_by=user_id
    )
    db.add(transfer)
    await db.commit()
    await db.refresh(transfer)
    
    # Cargar relaciones para la respuesta
    await db.refresh(transfer, ['product', 'source_warehouse', 'destination_warehouse', 'created_by_user'])

    return transfer

@router.get("/transfers/pending", response_model=List[TransferResponse])
async def get_pending_transfers(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(InventoryTransfer)
        .where(InventoryTransfer.status == TransferStatusEnum.PENDING.value)
        .options(
            selectinload(InventoryTransfer.product),
            selectinload(InventoryTransfer.source_warehouse),
            selectinload(InventoryTransfer.destination_warehouse),
            selectinload(InventoryTransfer.created_by_user)
        )
    )
    result = await db.execute(stmt)
    return result.scalars().all()

@router.put("/transfers/{transfer_id}/receive")
async def receive_transfer(
    transfer_id: int, 
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """
    Recibe un traslado. Cambia el estado a COMPLETADO y suma el stock al almacén de destino.
    """
    # 1. Obtener la transferencia
    stmt = select(InventoryTransfer).where(InventoryTransfer.id == transfer_id).with_for_update()
    result = await db.execute(stmt)
    transfer = result.scalar_one_or_none()

    if not transfer:
        raise HTTPException(status_code=404, detail="Traslado no encontrado.")
    
    if transfer.status != TransferStatusEnum.PENDING.value:
        raise HTTPException(status_code=400, detail="Este traslado ya no está pendiente.")

    # 2. Bloqueo Pesimista del Destino
    stmt_dest = select(ProductWarehouse).where(
        ProductWarehouse.product_id == transfer.product_id,
        ProductWarehouse.warehouse_id == transfer.destination_warehouse_id
    ).with_for_update()
    result_dest = await db.execute(stmt_dest)
    stock_destino = result_dest.scalar_one_or_none()

    if not stock_destino:
        stock_destino = ProductWarehouse(
            product_id=transfer.product_id, 
            warehouse_id=transfer.destination_warehouse_id, 
            current_stock=0.0
        )
        db.add(stock_destino)
        await db.flush()

    # 3. Sumar al destino
    stock_destino.current_stock += transfer.quantity

    # 4. Registrar Entrada en Kardex
    tx_in = InventoryTransaction(
        product_id=transfer.product_id,
        warehouse_id=transfer.destination_warehouse_id,
        user_id=user_id,
        type=TransactionTypeEnum.TRANSFER_IN.value,
        quantity=transfer.quantity,
        reference=transfer.reference
    )
    db.add(tx_in)

    # 5. Marcar como completado
    transfer.status = TransferStatusEnum.COMPLETED.value
    transfer.received_by = user_id

    await db.commit()

    return {"message": "Traslado recibido exitosamente"}
