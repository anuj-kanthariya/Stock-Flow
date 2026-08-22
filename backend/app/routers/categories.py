from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, desc

from app.schemas.schemas import CategoryCreate, CategoryUpdate, CategoryResponse
from app.models.models import Category, Product
from app.database.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.models import User

router = APIRouter()

@router.get("/", response_model=List[CategoryResponse])
async def list_categories(
    search: str = Query(""),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all categories with product count."""
    product_count_subq = (
        select(Product.category_id, func.count(Product.id).label("p_count"))
        .group_by(Product.category_id)
        .subquery()
    )

    query = (
        select(Category, func.coalesce(product_count_subq.c.p_count, 0).label("product_count"))
        .outerjoin(product_count_subq, Category.id == product_count_subq.c.category_id)
        .where(Category.is_active == True)
        .where(Category.owner_id == current_user.id)
        .order_by(desc(Category.created_at))
    )

    if search:
        query = query.where(Category.name.ilike(f"%{search}%"))

    result = await db.execute(query)
    rows = result.all()
    
    categories = []
    for category_obj, p_count in rows:
        category_dict = {
            "id": category_obj.id,
            "name": category_obj.name,
            "description": category_obj.description,
            "color": category_obj.color,
            "is_active": category_obj.is_active,
            "created_at": category_obj.created_at,
            "product_count": p_count
        }
        categories.append(category_dict)

    return categories


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new category."""
    existing = await db.execute(
        select(Category)
        .where(func.lower(Category.name) == data.name.lower())
        .where(Category.owner_id == current_user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Category with this name already exists")

    new_category = Category(
        name=data.name,
        description=data.description,
        color=data.color,
        owner_id=current_user.id
    )
    db.add(new_category)
    await db.commit()
    await db.refresh(new_category)
    
    category_dict = {
        "id": new_category.id,
        "name": new_category.name,
        "description": new_category.description,
        "color": new_category.color,
        "is_active": new_category.is_active,
        "created_at": new_category.created_at,
        "product_count": 0
    }
    return category_dict


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific category."""
    product_count_subq = (
        select(Product.category_id, func.count(Product.id).label("p_count"))
        .group_by(Product.category_id)
        .subquery()
    )

    query = (
        select(Category, func.coalesce(product_count_subq.c.p_count, 0).label("product_count"))
        .outerjoin(product_count_subq, Category.id == product_count_subq.c.category_id)
        .where(Category.id == category_id)
        .where(Category.owner_id == current_user.id)
    )

    result = await db.execute(query)
    row = result.first()

    if not row:
        raise HTTPException(status_code=404, detail="Category not found")
        
    category_obj, p_count = row
    
    category_dict = {
        "id": category_obj.id,
        "name": category_obj.name,
        "description": category_obj.description,
        "color": category_obj.color,
        "is_active": category_obj.is_active,
        "created_at": category_obj.created_at,
        "product_count": p_count
    }
    return category_dict


@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    data: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a category."""
    result = await db.execute(
        select(Category)
        .where(Category.id == category_id)
        .where(Category.owner_id == current_user.id)
    )
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    if data.name is not None and data.name.lower() != category.name.lower():
        existing = await db.execute(
            select(Category)
            .where(func.lower(Category.name) == data.name.lower())
            .where(Category.owner_id == current_user.id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Category with this name already exists")

    if data.name is not None:
        category.name = data.name
    if data.description is not None:
        category.description = data.description
    if data.color is not None:
        category.color = data.color
    if data.is_active is not None:
        category.is_active = data.is_active

    await db.commit()
    
    return await get_category(category_id, db, current_user)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Soft delete a category."""
    result = await db.execute(
        select(Category)
        .where(Category.id == category_id)
        .where(Category.owner_id == current_user.id)
    )
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    await db.delete(category)
    await db.commit()
    
    return None
