from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
from app.database import get_supabase
from app.services.ai_service import AIAnalysisService
from app.models import AIAnalysisRequest

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post("")
async def analyze_expenses(user_id: str, request: AIAnalysisRequest):
    """Get AI-powered analysis of expenses."""
    supabase = get_supabase()
    ai_service = AIAnalysisService()

    # Calculate date range based on timeframe
    now = datetime.now()
    if request.timeframe == "week":
        start_date = now - timedelta(days=7)
    elif request.timeframe == "month":
        start_date = now - timedelta(days=30)
    elif request.timeframe == "quarter":
        start_date = now - timedelta(days=90)
    elif request.timeframe == "year":
        start_date = now - timedelta(days=365)
    else:
        start_date = now - timedelta(days=30)

    # Get user's expenses
    user_expenses = supabase.table("expenses").select(
        "*, categories(name)"
    ).eq("user_id", user_id).gte("date", start_date.isoformat()).execute()

    expenses = []
    for e in user_expenses.data or []:
        expenses.append({
            "amount": e["amount"],
            "description": e["description"],
            "category": e.get("categories", {}).get("name", "Other") if e.get("categories") else "Other",
            "date": e["date"],
            "merchant": e.get("merchant"),
        })

    # Get partner's expenses if requested
    partner_expenses = []
    if request.include_partner:
        profile = supabase.table("profiles").select("partner_id").eq("id", user_id).single().execute()
        partner_id = profile.data.get("partner_id") if profile.data else None

        if partner_id:
            partner_result = supabase.table("expenses").select(
                "*, categories(name)"
            ).eq("user_id", partner_id).gte("date", start_date.isoformat()).execute()

            for e in partner_result.data or []:
                partner_expenses.append({
                    "amount": e["amount"],
                    "description": e["description"],
                    "category": e.get("categories", {}).get("name", "Other") if e.get("categories") else "Other",
                    "date": e["date"],
                    "merchant": e.get("merchant"),
                })

    if not expenses and not partner_expenses:
        return {
            "summary": "No expenses found for the selected timeframe.",
            "insights": [],
            "recommendations": ["Start tracking your expenses to get personalized insights."],
            "spending_by_category": {},
            "trends": [],
        }

    # Run AI analysis
    analysis = await ai_service.analyze_expenses(
        expenses=expenses,
        timeframe=request.timeframe,
        include_partner_expenses=request.include_partner,
        partner_expenses=partner_expenses if request.include_partner else None,
    )

    return analysis


@router.get("/comparison")
async def compare_with_partner(user_id: str, timeframe: str = "month"):
    """Compare spending between user and partner."""
    supabase = get_supabase()

    # Get partner ID
    profile = supabase.table("profiles").select("partner_id").eq("id", user_id).single().execute()
    partner_id = profile.data.get("partner_id") if profile.data else None

    if not partner_id:
        raise HTTPException(status_code=400, detail="No partner linked")

    # Calculate date range
    now = datetime.now()
    if timeframe == "week":
        start_date = now - timedelta(days=7)
    elif timeframe == "month":
        start_date = now - timedelta(days=30)
    elif timeframe == "quarter":
        start_date = now - timedelta(days=90)
    else:
        start_date = now - timedelta(days=30)

    # Get both users' expenses
    user_expenses = supabase.table("expenses").select(
        "amount, categories(name)"
    ).eq("user_id", user_id).gte("date", start_date.isoformat()).execute()

    partner_expenses = supabase.table("expenses").select(
        "amount, categories(name)"
    ).eq("user_id", partner_id).gte("date", start_date.isoformat()).execute()

    # Calculate totals and by category
    def calculate_breakdown(expenses):
        total = 0
        by_category = {}
        for e in expenses or []:
            amount = e["amount"]
            total += amount
            cat = e.get("categories", {}).get("name", "Other") if e.get("categories") else "Other"
            by_category[cat] = by_category.get(cat, 0) + amount
        return {"total": total, "by_category": by_category}

    user_breakdown = calculate_breakdown(user_expenses.data)
    partner_breakdown = calculate_breakdown(partner_expenses.data)

    combined_total = user_breakdown["total"] + partner_breakdown["total"]

    return {
        "user": {
            "total": user_breakdown["total"],
            "percentage": (user_breakdown["total"] / combined_total * 100) if combined_total > 0 else 0,
            "by_category": user_breakdown["by_category"],
        },
        "partner": {
            "total": partner_breakdown["total"],
            "percentage": (partner_breakdown["total"] / combined_total * 100) if combined_total > 0 else 0,
            "by_category": partner_breakdown["by_category"],
        },
        "combined": {
            "total": combined_total,
            "by_category": {
                cat: user_breakdown["by_category"].get(cat, 0) + partner_breakdown["by_category"].get(cat, 0)
                for cat in set(user_breakdown["by_category"]) | set(partner_breakdown["by_category"])
            },
        },
    }
