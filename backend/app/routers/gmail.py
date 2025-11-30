from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
from typing import Optional
from app.database import get_supabase
from app.services.gmail_service import GmailService, ExpenseExtractor
from app.services.ai_service import AIAnalysisService

router = APIRouter(prefix="/gmail", tags=["gmail"])


@router.post("/sync")
async def sync_gmail_expenses(
    user_id: str,
    days_back: int = 30,
):
    """Sync expenses from Gmail for a user."""
    supabase = get_supabase()

    # Get user's Gmail refresh token
    profile = supabase.table("profiles").select(
        "gmail_connected, gmail_refresh_token"
    ).eq("id", user_id).single().execute()

    if not profile.data:
        raise HTTPException(status_code=404, detail="User not found")

    if not profile.data.get("gmail_connected") or not profile.data.get("gmail_refresh_token"):
        raise HTTPException(status_code=400, detail="Gmail not connected")

    try:
        # Initialize Gmail service
        gmail_service = GmailService(profile.data["gmail_refresh_token"])
        ai_service = AIAnalysisService()

        # Get or create expense label
        label_id = gmail_service.get_or_create_expense_label()

        # Fetch labeled emails
        after_date = datetime.now() - timedelta(days=days_back)
        emails = gmail_service.get_labeled_emails(label_id, after_date)

        # Get existing email IDs to avoid duplicates
        existing = supabase.table("expenses").select("email_id").eq("user_id", user_id).not_.is_("email_id", "null").execute()
        existing_email_ids = {e["email_id"] for e in existing.data} if existing.data else set()

        # Process emails and extract expenses
        new_expenses = []
        for email in emails:
            if email["id"] in existing_email_ids:
                continue

            expense_data = ExpenseExtractor.extract_expense(email)
            if expense_data:
                # Get AI-suggested category
                category = await ai_service.categorize_expense(
                    expense_data.description,
                    expense_data.merchant
                )

                # Get category ID
                cat_result = supabase.table("categories").select("id").eq("name", category).limit(1).execute()
                category_id = cat_result.data[0]["id"] if cat_result.data else None

                # Insert expense
                expense_record = {
                    "user_id": user_id,
                    "amount": expense_data.amount,
                    "description": expense_data.description,
                    "category_id": category_id,
                    "merchant": expense_data.merchant,
                    "date": expense_data.date.isoformat() if expense_data.date else datetime.now().isoformat(),
                    "source": "gmail",
                    "email_id": email["id"],
                }

                result = supabase.table("expenses").insert(expense_record).execute()
                if result.data:
                    new_expenses.append(result.data[0])

        return {
            "message": f"Synced {len(new_expenses)} new expenses from Gmail",
            "emails_processed": len(emails),
            "new_expenses": len(new_expenses),
            "expenses": new_expenses,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gmail sync failed: {str(e)}")


@router.get("/status")
async def get_gmail_status(user_id: str):
    """Check Gmail connection status for a user."""
    supabase = get_supabase()

    profile = supabase.table("profiles").select(
        "gmail_connected"
    ).eq("id", user_id).single().execute()

    if not profile.data:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "connected": profile.data.get("gmail_connected", False)
    }
