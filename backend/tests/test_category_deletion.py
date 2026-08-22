import pytest
import uuid
from decimal import Decimal
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import Category, Product, Invoice, InvoiceItem, StockTransaction

@pytest.mark.asyncio
async def test_category_deletion_cascades_to_products(
    authenticated_client: AsyncClient,
    db_session: AsyncSession,
    test_user
):
    # 1. Create a category
    cat_res = await authenticated_client.post(
        "/api/v1/categories/",
        json={"name": "Delete Me", "color": "#000000"}
    )
    assert cat_res.status_code == 201
    cat_id = cat_res.json()["id"]

    # 2. Create products in category
    p1_res = await authenticated_client.post(
        "/api/v1/products/",
        json={
            "name": "Prod 1",
            "category_id": cat_id,
            "selling_price": 100,
            "stock_quantity": 50,
            "unit": "pcs"
        }
    )
    p2_res = await authenticated_client.post(
        "/api/v1/products/",
        json={
            "name": "Prod 2",
            "category_id": cat_id,
            "selling_price": 200,
            "stock_quantity": 30,
            "unit": "pcs"
        }
    )
    assert p1_res.status_code == 201
    assert p2_res.status_code == 201
    p1_id = p1_res.json()["id"]
    p2_id = p2_res.json()["id"]

    # 3. Create a customer
    cust_res = await authenticated_client.post(
        "/api/v1/customers/",
        json={"name": "Test Cust", "phone": "9999999999"}
    )
    cust_id = cust_res.json()["id"]

    # 4. Create an invoice with these products
    inv_res = await authenticated_client.post(
        "/api/v1/invoices/",
        json={
            "customer_id": cust_id,
            "items": [
                {"product_id": p1_id, "quantity": 1, "unit_price": 100, "discount": 0},
                {"product_id": p2_id, "quantity": 2, "unit_price": 200, "discount": 0}
            ],
            "tax_rate": 0,
            "discount_amount": 0,
            "status": "paid"
        }
    )
    assert inv_res.status_code == 201
    inv_id = inv_res.json()["id"]

    # Verify stock transactions are created
    st_res = await db_session.execute(select(StockTransaction).where(StockTransaction.product_id.in_([p1_id, p2_id])))
    assert len(st_res.scalars().all()) > 0

    # 5. Delete category
    del_res = await authenticated_client.delete(f"/api/v1/categories/{cat_id}")
    assert del_res.status_code == 204

    # 6. Verify category deleted
    c_res = await db_session.execute(select(Category).where(Category.id == cat_id))
    assert c_res.scalar_one_or_none() is None

    # 7. Verify products deleted
    p_res = await db_session.execute(select(Product).where(Product.category_id == cat_id))
    assert len(p_res.scalars().all()) == 0

    # 8. Verify invoice items still exist but product_id is null
    ii_res = await db_session.execute(select(InvoiceItem).where(InvoiceItem.invoice_id == inv_id))
    items = ii_res.scalars().all()
    assert len(items) == 2
    for item in items:
        assert item.product_id is None
        assert item.product_name in ["Prod 1", "Prod 2"]

    # 9. Verify stock transactions deleted
    st_res2 = await db_session.execute(select(StockTransaction).where(StockTransaction.product_id.in_([p1_id, p2_id])))
    assert len(st_res2.scalars().all()) == 0

    # 10. Verify invoice still retrievable
    inv_get = await authenticated_client.get(f"/api/v1/invoices/{inv_id}")
    assert inv_get.status_code == 200
    assert len(inv_get.json()["items"]) == 2
    for item in inv_get.json()["items"]:
        assert item["product_id"] is None
        assert item["product_name"] in ["Prod 1", "Prod 2"]
