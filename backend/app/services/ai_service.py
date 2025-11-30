import google.generativeai as genai
from datetime import datetime, timedelta
from typing import Optional
from app.config import get_settings
from app.models import AIAnalysisResponse

settings = get_settings()

# Configure Gemini
genai.configure(api_key=settings.gemini_api_key)


class AIAnalysisService:
    """Service for AI-powered expense analysis using Google Gemini."""

    def __init__(self):
        self.model = genai.GenerativeModel("gemini-pro")

    async def analyze_expenses(
        self,
        expenses: list[dict],
        timeframe: str = "month",
        include_partner_expenses: bool = False,
        partner_expenses: Optional[list[dict]] = None,
    ) -> AIAnalysisResponse:
        """Analyze expenses and provide insights."""

        # Calculate spending by category
        spending_by_category = self._calculate_category_spending(expenses)

        # If including partner, merge their expenses too
        all_expenses = expenses.copy()
        if include_partner_expenses and partner_expenses:
            all_expenses.extend(partner_expenses)
            combined_spending = self._calculate_category_spending(all_expenses)
        else:
            combined_spending = spending_by_category

        # Calculate trends
        trends = self._calculate_trends(all_expenses)

        # Generate AI insights
        prompt = self._build_analysis_prompt(
            expenses=all_expenses,
            spending_by_category=combined_spending,
            trends=trends,
            timeframe=timeframe,
            is_combined=include_partner_expenses,
        )

        try:
            response = self.model.generate_content(prompt)
            ai_response = self._parse_ai_response(response.text)
        except Exception as e:
            # Fallback if AI fails
            ai_response = {
                "summary": f"Analyzed {len(all_expenses)} expenses totaling ${sum(e.get('amount', 0) for e in all_expenses):.2f}",
                "insights": [
                    f"Top spending category: {max(combined_spending, key=combined_spending.get) if combined_spending else 'N/A'}"
                ],
                "recommendations": [
                    "Consider reviewing your largest expense categories for potential savings."
                ],
            }

        return AIAnalysisResponse(
            summary=ai_response.get("summary", ""),
            insights=ai_response.get("insights", []),
            recommendations=ai_response.get("recommendations", []),
            spending_by_category=combined_spending,
            trends=trends,
        )

    def _calculate_category_spending(self, expenses: list[dict]) -> dict[str, float]:
        """Calculate total spending per category."""
        spending = {}
        for expense in expenses:
            category = expense.get("category", "Other") or "Other"
            amount = expense.get("amount", 0)
            spending[category] = spending.get(category, 0) + amount
        return spending

    def _calculate_trends(self, expenses: list[dict]) -> list[dict]:
        """Calculate spending trends over time."""
        # Group by week
        weekly_spending = {}

        for expense in expenses:
            date = expense.get("date")
            if isinstance(date, str):
                try:
                    date = datetime.fromisoformat(date.replace("Z", "+00:00"))
                except ValueError:
                    continue
            elif not isinstance(date, datetime):
                continue

            # Get the start of the week
            week_start = date - timedelta(days=date.weekday())
            week_key = week_start.strftime("%Y-%m-%d")

            weekly_spending[week_key] = weekly_spending.get(week_key, 0) + expense.get(
                "amount", 0
            )

        # Convert to list and sort
        trends = [
            {"week": week, "amount": amount}
            for week, amount in sorted(weekly_spending.items())
        ]

        return trends[-12:]  # Last 12 weeks

    def _build_analysis_prompt(
        self,
        expenses: list[dict],
        spending_by_category: dict[str, float],
        trends: list[dict],
        timeframe: str,
        is_combined: bool,
    ) -> str:
        """Build the prompt for AI analysis."""
        total_spent = sum(e.get("amount", 0) for e in expenses)
        expense_count = len(expenses)

        category_breakdown = "\n".join(
            f"- {cat}: ${amt:.2f}" for cat, amt in sorted(spending_by_category.items(), key=lambda x: -x[1])
        )

        trend_summary = ""
        if len(trends) >= 2:
            recent = trends[-1]["amount"] if trends else 0
            previous = trends[-2]["amount"] if len(trends) > 1 else 0
            if previous > 0:
                change = ((recent - previous) / previous) * 100
                trend_summary = f"Weekly spending change: {change:+.1f}%"

        audience = "a household (two partners)" if is_combined else "an individual"

        prompt = f"""Analyze the following expense data for {audience} over the past {timeframe}.

EXPENSE SUMMARY:
- Total expenses: {expense_count}
- Total spent: ${total_spent:.2f}
- {trend_summary}

SPENDING BY CATEGORY:
{category_breakdown}

Please provide:
1. A brief 2-3 sentence summary of the spending patterns
2. 3-4 specific insights about the spending habits (be specific with numbers)
3. 3-4 actionable recommendations to improve financial health

Format your response as:
SUMMARY: [your summary]

INSIGHTS:
- [insight 1]
- [insight 2]
- [insight 3]

RECOMMENDATIONS:
- [recommendation 1]
- [recommendation 2]
- [recommendation 3]

Keep the tone helpful and constructive, not judgmental."""

        return prompt

    def _parse_ai_response(self, response_text: str) -> dict:
        """Parse the AI response into structured data."""
        result = {"summary": "", "insights": [], "recommendations": []}

        lines = response_text.strip().split("\n")
        current_section = None

        for line in lines:
            line = line.strip()
            if not line:
                continue

            if line.startswith("SUMMARY:"):
                result["summary"] = line.replace("SUMMARY:", "").strip()
                current_section = "summary"
            elif line == "INSIGHTS:":
                current_section = "insights"
            elif line == "RECOMMENDATIONS:":
                current_section = "recommendations"
            elif line.startswith("- "):
                content = line[2:].strip()
                if current_section == "insights":
                    result["insights"].append(content)
                elif current_section == "recommendations":
                    result["recommendations"].append(content)
            elif current_section == "summary" and not result["summary"]:
                result["summary"] = line

        return result

    async def categorize_expense(self, description: str, merchant: Optional[str] = None) -> str:
        """Use AI to suggest a category for an expense."""
        prompt = f"""Given this expense:
Description: {description}
Merchant: {merchant or 'Unknown'}

What category does this belong to? Choose from:
- Food & Dining
- Transportation
- Shopping
- Entertainment
- Bills & Utilities
- Healthcare
- Travel
- Groceries
- Subscriptions
- Other

Respond with just the category name, nothing else."""

        try:
            response = self.model.generate_content(prompt)
            category = response.text.strip()
            # Validate it's a known category
            valid_categories = [
                "Food & Dining", "Transportation", "Shopping", "Entertainment",
                "Bills & Utilities", "Healthcare", "Travel", "Groceries",
                "Subscriptions", "Other"
            ]
            if category in valid_categories:
                return category
        except Exception:
            pass

        return "Other"
