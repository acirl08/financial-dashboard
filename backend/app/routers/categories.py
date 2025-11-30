from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database import get_supabase

router = APIRouter(prefix="/categories", tags=["categories"])


class CategoryCreate(BaseModel):
    name: str
    color: str = "#6366f1"
    icon: Optional[str] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None


@router.get("")
async def get_categories(user_id: str):
    """Get all categories (default + user custom)."""
    supabase = get_supabase()

    # Get default categories (user_id is null) and user's custom categories
    result = supabase.table("categories").select("*").or_(
        f"user_id.is.null,user_id.eq.{user_id}"
    ).order("name").execute()

    return result.data or []


@router.post("")
async def create_category(category: CategoryCreate, user_id: str):
    """Create a custom category."""
    supabase = get_supabase()

    # Check if category with same name exists for this user
    existing = supabase.table("categories").select("id").eq("name", category.name).or_(
        f"user_id.is.null,user_id.eq.{user_id}"
    ).execute()

    if existing.data:
        raise HTTPException(status_code=400, detail="Category with this name already exists")

    result = supabase.table("categories").insert({
        "name": category.name,
        "color": category.color,
        "icon": category.icon,
        "user_id": user_id,
    }).execute()

    return result.data[0] if result.data else None


@router.put("/{category_id}")
async def update_category(category_id: str, category: CategoryUpdate, user_id: str):
    """Update a custom category (only user's own categories)."""
    supabase = get_supabase()

    # Verify ownership (can only update own categories, not defaults)
    existing = supabase.table("categories").select("user_id").eq("id", category_id).single().execute()

    if not existing.data:
        raise HTTPException(status_code=404, detail="Category not found")

    if existing.data.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Cannot modify this category")

    update_data = category.model_dump(exclude_unset=True)

    result = supabase.table("categories").update(update_data).eq("id", category_id).execute()
    return result.data[0] if result.data else None


@router.delete("/{category_id}")
async def delete_category(category_id: str, user_id: str):
    """Delete a custom category."""
    supabase = get_supabase()

    # Verify ownership
    existing = supabase.table("categories").select("user_id").eq("id", category_id).single().execute()

    if not existing.data:
        raise HTTPException(status_code=404, detail="Category not found")

    if existing.data.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Cannot delete this category")

    # Set expenses with this category to null
    supabase.table("expenses").update({"category_id": None}).eq("category_id", category_id).execute()

    # Delete the category
    supabase.table("categories").delete().eq("id", category_id).execute()

    return {"message": "Category deleted"}
