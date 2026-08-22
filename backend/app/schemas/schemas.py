"""
Pydantic schemas for all entities.
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


# ─── Shared ──────────────────────────────────────────────────────────────────
class PaginationMeta(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int


class PaginatedResponse(BaseModel):
    meta: PaginationMeta


# ─── Auth ────────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    mobile_number: str = Field(..., min_length=10, max_length=15)
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class SendOtpRequest(BaseModel):
    mobile_number: str = Field(..., min_length=10, max_length=15)


class VerifyOtpRequest(BaseModel):
    mobile_number: str = Field(..., min_length=10, max_length=15)
    otp: str = Field(..., min_length=6, max_length=6, pattern="^[0-9]+$")


# ─── User ────────────────────────────────────────────────────────────────────
class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    shop_name: Optional[str] = Field(None, max_length=100)
    mobile_number: Optional[str] = Field(None, min_length=10, max_length=15)
    role: str = Field(default="staff", pattern="^(owner|staff)$")


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[str] = None
    company_name: Optional[str] = None
    phone: Optional[str] = None
    gst_number: Optional[str] = None
    business_address: Optional[str] = None
    company_logo_url: Optional[str] = None
    invoice_prefix: Optional[str] = None
    invoice_numbering_preference: Optional[str] = None
    payment_terms: Optional[str] = None
    tax_settings: Optional[str] = None
    website: Optional[str] = None
    upi_id: Optional[str] = None
    bank_details: Optional[str] = None
    mobile_number: Optional[str] = Field(None, min_length=10, max_length=15)
    avatar_url: Optional[str] = None


from uuid import UUID

class UserResponse(UserBase):
    id: UUID
    email: Optional[str] = None
    company_name: Optional[str] = None
    phone: Optional[str] = None
    gst_number: Optional[str] = None
    business_address: Optional[str] = None
    company_logo_url: Optional[str] = None
    profile_completed: bool = False
    invoice_prefix: str
    invoice_numbering_preference: str
    payment_terms: Optional[str] = None
    tax_settings: Optional[str] = None
    website: Optional[str] = None
    upi_id: Optional[str] = None
    bank_details: Optional[str] = None
    avatar_url: Optional[str]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Google Integration ────────────────────────────────────────────────────────
class GoogleSyncTokensRequest(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None

class GoogleContactResponse(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    photo: Optional[str] = None

class GoogleContactsListResponse(BaseModel):
    contacts: List[GoogleContactResponse]

# ─── Category ────────────────────────────────────────────────────────────────
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    color: str = Field(default="#3b82f6", pattern="^#[0-9a-fA-F]{6}$")


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    color: Optional[str] = Field(None, pattern="^#[0-9a-fA-F]{6}$")
    is_active: Optional[bool] = None


class CategoryResponse(CategoryBase):
    id: str
    is_active: bool
    product_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Product ─────────────────────────────────────────────────────────────────
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    sku: Optional[str] = Field(None, max_length=100)
    barcode: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    category_id: str
    purchase_price: Optional[Decimal] = Field(None, gt=0)
    selling_price: Decimal = Field(..., gt=0)
    gst_percentage: Optional[Decimal] = Field(default=Decimal("18.00"), ge=0)
    stock_quantity: Optional[int] = Field(default=0, ge=0)
    minimum_stock: Optional[int] = Field(default=10, ge=0)
    unit: str = Field(default="pcs", max_length=50)
    brand: Optional[str] = Field(None, max_length=100)
    image_url: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    barcode: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    category_id: Optional[str] = None
    purchase_price: Optional[Decimal] = Field(None, gt=0)
    selling_price: Optional[Decimal] = Field(None, gt=0)
    gst_percentage: Optional[Decimal] = Field(None, ge=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    minimum_stock: Optional[int] = Field(None, ge=0)
    unit: Optional[str] = None
    brand: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None



class ProductImportRow(BaseModel):
    row_number: int
    name: str
    sku: Optional[str] = None
    category: str
    selling_price: Decimal
    cost_price: Optional[Decimal] = None
    stock: int
    unit: str
    status: str
    errors: list[str]

class ProductImportPreviewResponse(BaseModel):
    total_rows: int
    valid_rows: int
    invalid_rows: int
    duplicate_rows: int
    new_categories: int
    rows: list[ProductImportRow]

class ProductImportExecuteRequest(BaseModel):
    rows: list[ProductImportRow]

class ProductImportExecuteResponse(BaseModel):
    products_imported: int
    categories_created: int
    products_skipped: int
    products_failed: int

class ProductResponse(ProductBase):
    id: str
    category_name: str = ""
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductListResponse(PaginatedResponse):
    data: List[ProductResponse]


# ─── Customer ────────────────────────────────────────────────────────────────
class CustomerBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    email: Optional[EmailStr] = None
    phone: str = Field(..., min_length=7, max_length=20)
    company: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    gst_number: Optional[str] = Field(None, max_length=20)


class CustomerCreate(CustomerBase):
    show_in_main_list: bool = True


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    gst_number: Optional[str] = None
    show_in_main_list: Optional[bool] = None
    is_active: Optional[bool] = None


class CustomerResponse(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    gst_number: Optional[str] = None
    total_orders: int = 0
    total_spent: Decimal = Decimal("0")
    show_in_main_list: bool = False
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}

class UnifiedCustomerSearchResponse(BaseModel):
    id: str
    type: str  # "customer" or "contact"
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    photo: Optional[str] = None

class UnifiedCustomerSearchListResponse(BaseModel):
    data: List[UnifiedCustomerSearchResponse]


# ─── Invoice ─────────────────────────────────────────────────────────────────
class InvoiceItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(..., gt=0)
    unit_price: Decimal = Field(..., gt=0)
    discount: Decimal = Field(default=0, ge=0, le=100)


class InvoiceItemResponse(BaseModel):
    id: str
    product_id: Optional[str]
    product_name: Optional[str]
    quantity: int
    unit_price: Decimal
    discount: Decimal
    total: Decimal

    @field_validator('product_name', mode='before')
    def validate_product_name(cls, v, info):
        if not v:
            return "Unknown Product"
        return v

    model_config = {"from_attributes": True}


class InvoiceCreate(BaseModel):
    customer_id: str
    items: List[InvoiceItemCreate] = Field(..., min_length=1)
    tax_rate: Decimal = Field(default=Decimal("18"), ge=0)
    discount_amount: Decimal = Field(default=0, ge=0)
    due_date: Optional[datetime] = None
    notes: Optional[str] = None
    status: Optional[str] = Field(
        default="pending",
        pattern="^(draft|pending|paid|overdue|cancelled)$",
    )


class InvoiceUpdate(BaseModel):
    status: Optional[str] = Field(
        None,
        pattern="^(draft|pending|paid|overdue|cancelled)$",
    )
    due_date: Optional[datetime] = None
    notes: Optional[str] = None
    paid_at: Optional[datetime] = None


class InvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    customer_id: str
    customer_name: str
    items: List[InvoiceItemResponse]
    subtotal: Decimal
    tax_rate: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total: Decimal
    status: str
    due_date: Optional[datetime]
    paid_at: Optional[datetime]
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class InvoiceListResponse(PaginatedResponse):
    data: List[InvoiceResponse]


# ─── Stock Transaction ────────────────────────────────────────────────────────
class StockTransactionCreate(BaseModel):
    product_id: str
    type: str = Field(..., pattern="^(purchase|sale|adjustment|return)$")
    quantity: int = Field(..., ne=0)
    reference: Optional[str] = None
    notes: Optional[str] = None


class StockTransactionResponse(BaseModel):
    id: str
    product_id: str
    product_name: str
    type: str
    quantity: int
    reference: Optional[str]
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Settings ────────────────────────────────────────────────────────────────
class AppSettingsUpdate(BaseModel):
    company_name: Optional[str] = None
    company_email: Optional[EmailStr] = None
    company_phone: Optional[str] = None
    company_address: Optional[str] = None
    gst_number: Optional[str] = None
    currency: Optional[str] = None
    tax_rate: Optional[Decimal] = Field(None, ge=0)
    invoice_prefix: Optional[str] = None
    low_stock_threshold: Optional[int] = Field(None, ge=1)
    invoice_footer: Optional[str] = None


class AppSettingsResponse(BaseModel):
    id: int
    company_name: str
    company_email: Optional[str]
    company_phone: Optional[str]
    company_address: Optional[str]
    gst_number: Optional[str]
    currency: str
    tax_rate: Decimal
    invoice_prefix: str
    low_stock_threshold: int
    invoice_footer: Optional[str]
    logo_url: Optional[str]

    model_config = {"from_attributes": True}


# ─── Reports ─────────────────────────────────────────────────────────────────
class DashboardStats(BaseModel):
    total_products: int
    total_categories: int
    total_stock: int
    today_sales: Decimal
    monthly_revenue: Decimal
    low_stock_items: int
    total_customers: int
    pending_invoices: int
    monthly_orders: int
