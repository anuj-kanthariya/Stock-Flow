"""Add cascade delete and invoice item product name

Revision ID: a646af8b4d40
Revises: 79a4588b01bd
Create Date: 2026-08-22 18:58:08.225968

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a646af8b4d40'
down_revision: Union[str, None] = '79a4588b01bd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add product_name column to invoice_items
    op.add_column('invoice_items', sa.Column('product_name', sa.String(length=200), nullable=True))
    
    # Backfill product_name
    op.execute(
        "UPDATE invoice_items "
        "SET product_name = products.name "
        "FROM products "
        "WHERE invoice_items.product_id = products.id"
    )

    # 2. Update InvoiceItems FK to SET NULL
    op.drop_constraint('invoice_items_product_id_fkey', 'invoice_items', type_='foreignkey')
    op.alter_column('invoice_items', 'product_id', existing_type=sa.String(length=36), nullable=True)
    op.create_foreign_key('invoice_items_product_id_fkey', 'invoice_items', 'products', ['product_id'], ['id'], ondelete='SET NULL')

    # 3. Update StockTransactions FK to CASCADE
    op.drop_constraint('stock_transactions_product_id_fkey', 'stock_transactions', type_='foreignkey')
    op.create_foreign_key('stock_transactions_product_id_fkey', 'stock_transactions', 'products', ['product_id'], ['id'], ondelete='CASCADE')

    # 4. Update Products FK to CASCADE
    op.drop_constraint('products_category_id_fkey', 'products', type_='foreignkey')
    op.create_foreign_key('products_category_id_fkey', 'products', 'categories', ['category_id'], ['id'], ondelete='CASCADE')


def downgrade() -> None:
    # Products FK
    op.drop_constraint('products_category_id_fkey', 'products', type_='foreignkey')
    op.create_foreign_key('products_category_id_fkey', 'products', 'categories', ['category_id'], ['id'])
    
    # StockTransactions FK
    op.drop_constraint('stock_transactions_product_id_fkey', 'stock_transactions', type_='foreignkey')
    op.create_foreign_key('stock_transactions_product_id_fkey', 'stock_transactions', 'products', ['product_id'], ['id'])
    
    # InvoiceItems FK
    op.drop_constraint('invoice_items_product_id_fkey', 'invoice_items', type_='foreignkey')
    op.alter_column('invoice_items', 'product_id', existing_type=sa.String(length=36), nullable=False)
    op.create_foreign_key('invoice_items_product_id_fkey', 'invoice_items', 'products', ['product_id'], ['id'])
    
    op.drop_column('invoice_items', 'product_name')
