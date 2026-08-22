"""Invoices router stubs."""
from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from fastapi.responses import StreamingResponse
from app.utils.pdf_generator import generate_invoice_pdf

from app.database.database import get_db
from app.schemas.schemas import InvoiceCreate, InvoiceUpdate, InvoiceResponse, InvoiceListResponse
from app.core.dependencies import get_current_active_user
from app.models.models import User, Customer, Product, Invoice, InvoiceItem, StockTransaction

router = APIRouter()


@router.get("/", response_model=InvoiceListResponse)
async def list_invoices(
    page: int = Query(1, ge=1),
    limit: int = Query(20),
    status: str = Query(""),
    customer_id: str = Query(""),
    search: str = Query(""),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Invoice).where(Invoice.created_by == current_user.id)
    
    if status and status != "all":
        query = query.where(Invoice.status == status)
        
    if customer_id:
        query = query.where(Invoice.customer_id == customer_id)
        
    if search:
        # Search by invoice number or related customer name
        query = query.join(Customer).where(
            (Invoice.invoice_number.ilike(f"%{search}%")) |
            (Customer.name.ilike(f"%{search}%"))
        )
        
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0
    
    # Paginate and load relationships
    query = query.options(
        selectinload(Invoice.customer),
        selectinload(Invoice.items).selectinload(InvoiceItem.product)
    ).order_by(Invoice.created_at.desc()).offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    invoices = result.scalars().all()
    
    total_pages = (total + limit - 1) // limit
    
    return {
        "data": invoices,
        "meta": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
        }
    }


@router.post("/", response_model=InvoiceResponse, status_code=201)
async def create_invoice(
    data: InvoiceCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    max_retries = 3
    for attempt in range(max_retries):
        try:
            # Verify customer
            customer = await db.scalar(select(Customer).where(Customer.id == data.customer_id, Customer.owner_id == current_user.id))
            if not customer:
                raise HTTPException(status_code=404, detail="Customer not found")

            # Verify products
            product_ids = [item.product_id for item in data.items]
            products_result = await db.execute(select(Product).where(Product.id.in_(product_ids), Product.owner_id == current_user.id))
            products = {p.id: p for p in products_result.scalars().all()}

            # Generate invoice number securely using isolated sequence
            from sqlalchemy.dialects.postgresql import insert as pg_insert
            from app.models.models import InvoiceSequence
            
            today = datetime.now()
            date_str = today.strftime('%y%m%d')
            prefix = f"INV-{date_str}"
            
            stmt = pg_insert(InvoiceSequence).values(
                user_id=current_user.id,
                invoice_date=date_str,
                last_number=1
            ).on_conflict_do_update(
                index_elements=["user_id", "invoice_date"],
                set_={"last_number": InvoiceSequence.last_number + 1}
            ).returning(InvoiceSequence.last_number)
            
            last_seq = await db.scalar(stmt)
            invoice_number = f"{prefix}-{last_seq:04d}"

            subtotal = Decimal("0")
            invoice_items = []
            stock_transactions = []
            
            for item in data.items:
                if item.product_id not in products:
                    raise HTTPException(status_code=404, detail=f"Product not found: {item.product_id}")
                product = products[item.product_id]
                
                # Verify stock if not draft
                if data.status != "draft" and (product.stock_quantity or 0) < item.quantity:
                    raise HTTPException(status_code=400, detail=f"Insufficient stock for product: {product.name}. Only {product.stock_quantity} available.")
                    
                unit_price = product.selling_price
                line_discount = item.discount
                line_total = (unit_price * item.quantity) * (1 - line_discount / Decimal("100"))
                subtotal += line_total
                
                invoice_items.append(
                    InvoiceItem(
                        product_id=product.id,
                        product_name=product.name,
                        quantity=item.quantity,
                        unit_price=unit_price,
                        discount=line_discount,
                        total=line_total
                    )
                )
                
                # Deduct stock and record transaction if not draft
                if data.status != "draft":
                    product.stock_quantity = (product.stock_quantity or 0) - item.quantity
                    stock_transactions.append(
                        StockTransaction(
                            product_id=product.id,
                            type="sale",
                            quantity=-item.quantity,
                            created_by=current_user.id,
                            reference=invoice_number,
                            notes=f"Sale for invoice {invoice_number}"
                        )
                    )

            tax_amount = subtotal * (data.tax_rate / Decimal("100"))
            total = subtotal + tax_amount - data.discount_amount
            
            invoice = Invoice(
                invoice_number=invoice_number,
                customer_id=customer.id,
                created_by=current_user.id,
                subtotal=subtotal,
                tax_rate=data.tax_rate,
                tax_amount=tax_amount,
                discount_amount=data.discount_amount,
                total=total,
                status=data.status or "pending",
                due_date=data.due_date,
                notes=data.notes,
                items=invoice_items
            )
            
            db.add(invoice)
            db.add_all(stock_transactions)
            await db.commit()
            
            stmt = (
                select(Invoice)
                .options(
                    selectinload(Invoice.customer),
                    selectinload(Invoice.items).selectinload(InvoiceItem.product)
                )
                .where(Invoice.id == invoice.id)
            )
            result = await db.execute(stmt)
            return result.scalar_one()

        except IntegrityError as e:
            await db.rollback()
            if "invoice_number" in str(e).lower() and attempt < max_retries - 1:
                continue
            raise HTTPException(
                status_code=400, 
                detail="Failed to generate a unique invoice number. Please try again."
            )
        except HTTPException:
            await db.rollback()
            raise
        except Exception as e:
            await db.rollback()
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail="An unexpected error occurred while saving the invoice.")


@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Invoice)
        .options(
            selectinload(Invoice.customer),
            selectinload(Invoice.items).selectinload(InvoiceItem.product)
        )
        .where(Invoice.id == invoice_id, Invoice.created_by == current_user.id)
    )
    result = await db.execute(stmt)
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    return invoice


@router.get("/{invoice_id}/pdf")
async def download_invoice_pdf(
    invoice_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Invoice)
        .options(
            selectinload(Invoice.customer),
            selectinload(Invoice.items).selectinload(InvoiceItem.product)
        )
        .where(Invoice.id == invoice_id, Invoice.created_by == current_user.id)
    )
    result = await db.execute(stmt)
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    try:
        pdf_buffer = generate_invoice_pdf(invoice)
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{invoice.invoice_number}.pdf"'
            }
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to generate PDF")


@router.patch("/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(
    invoice_id: str,
    data: InvoiceUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Invoice)
        .options(
            selectinload(Invoice.customer),
            selectinload(Invoice.items).selectinload(InvoiceItem.product)
        )
        .where(Invoice.id == invoice_id, Invoice.created_by == current_user.id)
    )
    result = await db.execute(stmt)
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    if data.status is not None:
        if invoice.status != "paid" and data.status == "paid":
            invoice.paid_at = data.paid_at or datetime.utcnow()
        invoice.status = data.status
        
    if data.due_date is not None:
        invoice.due_date = data.due_date
        
    if data.notes is not None:
        invoice.notes = data.notes
        
    await db.commit()
    return invoice


@router.put("/{invoice_id}", response_model=InvoiceResponse)
async def put_invoice(
    invoice_id: str,
    data: InvoiceCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify invoice exists and is draft
    stmt = (
        select(Invoice)
        .options(selectinload(Invoice.items))
        .where(Invoice.id == invoice_id, Invoice.created_by == current_user.id)
    )
    result = await db.execute(stmt)
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    if invoice.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft invoices can be fully edited.")
        
    # Verify customer
    customer = await db.get(Customer, data.customer_id)
    if not customer or customer.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Fetch products
    product_ids = [item.product_id for item in data.items]
    products_result = await db.execute(select(Product).where(Product.id.in_(product_ids), Product.owner_id == current_user.id))
    products = {p.id: p for p in products_result.scalars().all()}

    subtotal = Decimal("0")
    invoice_items = []
    stock_transactions = []
    
    for item in data.items:
        if item.product_id not in products:
            raise HTTPException(status_code=404, detail=f"Product not found: {item.product_id}")
        product = products[item.product_id]
        
        # Verify stock if moving to pending
        if data.status != "draft" and (product.stock_quantity or 0) < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for product: {product.name}. Only {product.stock_quantity} available.")
            
        unit_price = product.selling_price
        line_discount = item.discount
        line_total = (unit_price * item.quantity) * (1 - line_discount / Decimal("100"))
        subtotal += line_total
        
        invoice_items.append(
            InvoiceItem(
                product_id=product.id,
                product_name=product.name,
                quantity=item.quantity,
                unit_price=unit_price,
                discount=line_discount,
                total=line_total
            )
        )
        
        # Deduct stock and record transaction if not draft
        if data.status != "draft":
            product.stock_quantity = (product.stock_quantity or 0) - item.quantity
            stock_transactions.append(
                StockTransaction(
                    product_id=product.id,
                    type="sale",
                    quantity=-item.quantity,
                    created_by=current_user.id,
                    reference=invoice.invoice_number,
                    notes=f"Sale for invoice {invoice.invoice_number}"
                )
            )

    tax_amount = subtotal * (data.tax_rate / Decimal("100"))
    total = subtotal + tax_amount - data.discount_amount
    
    # Apply updates
    invoice.customer_id = customer.id
    invoice.subtotal = subtotal
    invoice.tax_rate = data.tax_rate
    invoice.tax_amount = tax_amount
    invoice.discount_amount = data.discount_amount
    invoice.total = total
    invoice.status = data.status or "draft"
    invoice.due_date = data.due_date
    invoice.notes = data.notes
    
    # Replace items entirely (cascade handles orphans)
    invoice.items = invoice_items
    
    if stock_transactions:
        db.add_all(stock_transactions)
        
    await db.commit()
    
    # Reload with all relationships for response
    await db.refresh(invoice)
    stmt = (
        select(Invoice)
        .options(
            selectinload(Invoice.customer),
            selectinload(Invoice.items).selectinload(InvoiceItem.product)
        )
        .where(Invoice.id == invoice_id)
    )
    result = await db.execute(stmt)
    return result.scalar_one()


@router.delete("/{invoice_id}", status_code=204)
async def delete_invoice(
    invoice_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Invoice).where(Invoice.id == invoice_id, Invoice.created_by == current_user.id)
    result = await db.execute(stmt)
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    await db.delete(invoice)
    await db.commit()
    return None


@router.get("/{invoice_id}/pdf")
async def download_invoice_pdf(
    invoice_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate and return invoice PDF."""
    stmt = (
        select(Invoice)
        .options(
            selectinload(Invoice.customer),
            selectinload(Invoice.items).selectinload(InvoiceItem.product),
            selectinload(Invoice.created_by_user)
        )
        .where(Invoice.id == invoice_id, Invoice.created_by == current_user.id)
    )
    result = await db.execute(stmt)
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    pdf_buffer = generate_invoice_pdf(invoice)
    pdf_buffer.seek(0)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={invoice.invoice_number}.pdf"}
    )
