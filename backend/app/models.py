from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class ExpenseSource(str, Enum):
    GMAIL = "gmail"
    MANUAL = "manual"


class ExpenseCreate(BaseModel):
    amount: float
    description: str
    category: Optional[str] = None
    date: Optional[datetime] = None
    merchant: Optional[str] = None
    source: ExpenseSource = ExpenseSource.MANUAL
    email_id: Optional[str] = None  # Gmail message ID if from email


class Expense(ExpenseCreate):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime


class ExpenseUpdate(BaseModel):
    amount: Optional[float] = None
    description: Optional[str] = None
    category: Optional[str] = None
    date: Optional[datetime] = None
    merchant: Optional[str] = None


class Category(BaseModel):
    id: str
    name: str
    color: str
    icon: Optional[str] = None
    user_id: Optional[str] = None  # None = shared category


class User(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    partner_id: Optional[str] = None  # Link to partner for shared dashboard
    gmail_connected: bool = False
    created_at: datetime


class PartnerInvite(BaseModel):
    email: str


class AIAnalysisRequest(BaseModel):
    timeframe: str = "month"  # week, month, quarter, year
    include_partner: bool = False


class AIAnalysisResponse(BaseModel):
    summary: str
    insights: list[str]
    recommendations: list[str]
    spending_by_category: dict[str, float]
    trends: list[dict]


class DashboardStats(BaseModel):
    total_spent: float
    total_this_month: float
    average_daily: float
    top_categories: list[dict]
    recent_expenses: list[Expense]
    monthly_trend: list[dict]
