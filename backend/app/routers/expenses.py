from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timedelta
from typing import Optional
from app.models import ExpenseCreate, ExpenseUpdate, Expense
from app.database import get_supabase
from app.services.ai_service import AIAnalysisService

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("")
async def get_expenses(
    user_id: str,
    include_partner: bool = False,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    category: Optional[str] = None,
    limit: int = Query(default=100, le=500),
    offset: int = 0,
):
    """Get expenses for a user, optionally including partner's expenses."""
    supabase = get_supabase()

    # Start query
    query = supabase.table("expenses").select(
        "*, categories(name, color, icon)"
    )

    # Build user filter
    if include_partner:
        # Get partner ID
        profile = supabase.table("profiles").select("partner_id").eq("id", user_id).single().execute()
        partner_id = profile.data.get("partner_id") if profile.data else None

        if partner_id:
            query = query.in_("user_id", [user_id, partner_id])
        else:
            query = query.eq("user_id", user_id)
    else:
        query = query.eq("user_id", user_id)

    # Apply filters
    if start_date:
        query = query.gte("date", start_date.isoformat())
    if end_date:
        query = query.lte("date", end_date.isoformat())
    if category:
        # Need to filter by category name through join
        query = query.eq("categories.name", category)

    # Order and paginate
    query = query.order("date", desc=True).range(offset, offset + limit - 1)

    result = query.execute()
    return result.data


@router.post("")
async def create_expense(expense: ExpenseCreate, user_id: str):
    """Create a new expense."""
    supabase = get_supabase()

    # Get category ID if category name provided
    category_id = None
    if expense.category:
        cat_result = supabase.table("categories").select("id").eq("name", expense.category).limit(1).execute()
        if cat_result.data:
            category_id = cat_result.data[0]["id"]

    # If no category, use AI to suggest one
    if not category_id and expense.description:
        ai_service = AIAnalysisService()
        suggested_category = await ai_service.categorize_expense(
            expense.description, expense.merchant
        )
        cat_result = supabase.table("categories").select("id").eq("name", suggested_category).limit(1).execute()
        if cat_result.data:
            category_id = cat_result.data[0]["id"]

    data = {
        "user_id": user_id,
        "amount": expense.amount,
        "description": expense.description,
        "category_id": category_id,
        "merchant": expense.merchant,
        "date": (expense.date or datetime.now()).isoformat(),
        "source": expense.source.value,
        "email_id": expense.email_id,
    }

    result = supabase.table("expenses").insert(data).execute()
    return result.data[0] if result.data else None


@router.put("/{expense_id}")
async def update_expense(expense_id: str, expense: ExpenseUpdate, user_id: str):
    """Update an expense."""
    supabase = get_supabase()

    # Verify ownership
    existing = supabase.table("expenses").select("user_id").eq("id", expense_id).single().execute()
    if not existing.data or existing.data["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Expense not found")

    update_data = expense.model_dump(exclude_unset=True)

    # Handle category update
    if "category" in update_data:
        category_name = update_data.pop("category")
        if category_name:
            cat_result = supabase.table("categories").select("id").eq("name", category_name).limit(1).execute()
            if cat_result.data:
                update_data["category_id"] = cat_result.data[0]["id"]

    if "date" in update_data and update_data["date"]:
        update_data["date"] = update_data["date"].isoformat()

    update_data["updated_at"] = datetime.now().isoformat()

    result = supabase.table("expenses").update(update_data).eq("id", expense_id).execute()
    return result.data[0] if result.data else None


@router.delete("/{expense_id}")
async def delete_expense(expense_id: str, user_id: str):
    """Delete an expense."""
    supabase = get_supabase()

    # Verify ownership
    existing = supabase.table("expenses").select("user_id").eq("id", expense_id).single().execute()
    if not existing.data or existing.data["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Expense not found")

    supabase.table("expenses").delete().eq("id", expense_id).execute()
    return {"message": "Expense deleted"}


@router.get("/stats")
async def get_expense_stats(
    user_id: str,
    include_partner: bool = False,
    timeframe: str = "month",
):
    """Get expense statistics for dashboard."""
    supabase = get_supabase()

    # Calculate date range
    now = datetime.now()
    if timeframe == "week":
        start_date = now - timedelta(days=7)
    elif timeframe == "month":
        start_date = now - timedelta(days=30)
    elif timeframe == "quarter":
        start_date = now - timedelta(days=90)
    elif timeframe == "year":
        start_date = now - timedelta(days=365)
    else:
        start_date = now - timedelta(days=30)

    # Get expenses
    query = supabase.table("expenses").select(
        "*, categories(name, color)"
    ).gte("date", start_date.isoformat())

    if include_partner:
        profile = supabase.table("profiles").select("partner_id").eq("id", user_id).single().execute()
        partner_id = profile.data.get("partner_id") if profile.data else None
        if partner_id:
            query = query.in_("user_id", [user_id, partner_id])
        else:
            query = query.eq("user_id", user_id)
    else:
        query = query.eq("user_id", user_id)

    result = query.execute()
    expenses = result.data or []

    # Calculate stats
    total_spent = sum(e["amount"] for e in expenses)
    days_in_range = (now - start_date).days or 1
    average_daily = total_spent / days_in_range

    # Get this month's spending
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    this_month = sum(
        e["amount"] for e in expenses
        if datetime.fromisoformat(e["date"].replace("Z", "+00:00")) >= month_start
    )

    # Top categories
    category_totals = {}
    for e in expenses:
        cat = e.get("categories", {})
        cat_name = cat.get("name", "Other") if cat else "Other"
        cat_color = cat.get("color", "#64748b") if cat else "#64748b"
        if cat_name not in category_totals:
            category_totals[cat_name] = {"name": cat_name, "color": cat_color, "amount": 0}
        category_totals[cat_name]["amount"] += e["amount"]

    top_categories = sorted(
        category_totals.values(), key=lambda x: x["amount"], reverse=True
    )[:5]

    # Monthly trend (last 6 months)
    monthly_trend = []
    for i in range(5, -1, -1):
        month_date = now - timedelta(days=30 * i)
        month_key = month_date.strftime("%Y-%m")
        month_total = sum(
            e["amount"] for e in expenses
            if e["date"].startswith(month_key)
        )
        monthly_trend.append({
            "month": month_date.strftime("%b"),
            "amount": month_total,
        })

    return {
        "total_spent": total_spent,
        "total_this_month": this_month,
        "average_daily": average_daily,
        "top_categories": top_categories,
        "recent_expenses": expenses[:10],
        "monthly_trend": monthly_trend,
    }
