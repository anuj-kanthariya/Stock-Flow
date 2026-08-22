"""enforce rls

Revision ID: a1b2c3d4e5f6
Revises: 8e892b0451d8
Create Date: 2026-08-22 13:17:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '8e892b0451d8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enable RLS on tables
    tables = [
        "profiles", 
        "google_connections", 
        "categories", 
        "products", 
        "customers", 
        "invoices", 
        "invoice_items", 
        "stock_transactions"
    ]
    
    for table in tables:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")
    
    # 2. Create policies
    
    # profiles: users can only see their own profile
    op.execute("""
    CREATE POLICY "User Isolation" ON profiles 
    FOR ALL TO authenticated 
    USING (id = auth.uid());
    """)
    
    # google_connections
    op.execute("""
    CREATE POLICY "User Isolation" ON google_connections 
    FOR ALL TO authenticated 
    USING (user_id = auth.uid());
    """)

    # categories
    op.execute("""
    CREATE POLICY "User Isolation" ON categories 
    FOR ALL TO authenticated 
    USING (owner_id = auth.uid());
    """)
    
    # products
    op.execute("""
    CREATE POLICY "User Isolation" ON products 
    FOR ALL TO authenticated 
    USING (owner_id = auth.uid());
    """)
    
    # customers
    op.execute("""
    CREATE POLICY "User Isolation" ON customers 
    FOR ALL TO authenticated 
    USING (owner_id = auth.uid());
    """)
    
    # invoices
    op.execute("""
    CREATE POLICY "User Isolation" ON invoices 
    FOR ALL TO authenticated 
    USING (created_by = auth.uid());
    """)
    
    # stock_transactions
    op.execute("""
    CREATE POLICY "User Isolation" ON stock_transactions 
    FOR ALL TO authenticated 
    USING (created_by = auth.uid());
    """)

    # invoice_items: requires join
    op.execute("""
    CREATE POLICY "User Isolation" ON invoice_items 
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND invoices.created_by = auth.uid()
        )
    );
    """)

def downgrade() -> None:
    # Drop policies
    tables = [
        "profiles", 
        "google_connections", 
        "categories", 
        "products", 
        "customers", 
        "invoices", 
        "invoice_items", 
        "stock_transactions"
    ]
    
    for table in tables:
        op.execute(f"DROP POLICY IF EXISTS \"User Isolation\" ON {table};")
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;")
