import base64
import re
from datetime import datetime
from typing import Optional
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from app.config import get_settings
from app.models import ExpenseCreate, ExpenseSource

settings = get_settings()


class GmailService:
    """Service for interacting with Gmail API to extract expenses from emails."""

    SCOPES = [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.labels",
    ]

    def __init__(self, refresh_token: str):
        self.credentials = Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.google_client_id,
            client_secret=settings.google_client_secret,
            scopes=self.SCOPES,
        )
        if self.credentials.expired or not self.credentials.token:
            self.credentials.refresh(Request())

        self.service = build("gmail", "v1", credentials=self.credentials)

    def get_or_create_expense_label(self) -> str:
        """Get or create the expense tracking label."""
        label_name = settings.expense_email_label

        # Check if label exists
        results = self.service.users().labels().list(userId="me").execute()
        labels = results.get("labels", [])

        for label in labels:
            if label["name"].lower() == label_name.lower():
                return label["id"]

        # Create the label if it doesn't exist
        label_body = {
            "name": label_name,
            "labelListVisibility": "labelShow",
            "messageListVisibility": "show",
        }
        created_label = (
            self.service.users().labels().create(userId="me", body=label_body).execute()
        )
        return created_label["id"]

    def get_labeled_emails(
        self, label_id: str, after_date: Optional[datetime] = None
    ) -> list[dict]:
        """Fetch emails with the expense label."""
        query = f"label:{settings.expense_email_label}"
        if after_date:
            query += f" after:{after_date.strftime('%Y/%m/%d')}"

        results = (
            self.service.users()
            .messages()
            .list(userId="me", q=query, maxResults=100)
            .execute()
        )

        messages = results.get("messages", [])
        emails = []

        for msg in messages:
            email_data = (
                self.service.users()
                .messages()
                .get(userId="me", id=msg["id"], format="full")
                .execute()
            )
            emails.append(self._parse_email(email_data))

        return emails

    def _parse_email(self, email_data: dict) -> dict:
        """Parse email data into a structured format."""
        headers = email_data.get("payload", {}).get("headers", [])

        subject = ""
        from_email = ""
        date_str = ""

        for header in headers:
            name = header.get("name", "").lower()
            if name == "subject":
                subject = header.get("value", "")
            elif name == "from":
                from_email = header.get("value", "")
            elif name == "date":
                date_str = header.get("value", "")

        # Get email body
        body = self._get_email_body(email_data.get("payload", {}))

        return {
            "id": email_data["id"],
            "subject": subject,
            "from": from_email,
            "date": date_str,
            "body": body,
            "snippet": email_data.get("snippet", ""),
        }

    def _get_email_body(self, payload: dict) -> str:
        """Extract the text body from email payload."""
        body = ""

        if "body" in payload and payload["body"].get("data"):
            body = base64.urlsafe_b64decode(payload["body"]["data"]).decode("utf-8")
        elif "parts" in payload:
            for part in payload["parts"]:
                if part.get("mimeType") == "text/plain":
                    if part.get("body", {}).get("data"):
                        body = base64.urlsafe_b64decode(part["body"]["data"]).decode(
                            "utf-8"
                        )
                        break
                elif part.get("mimeType") == "text/html" and not body:
                    if part.get("body", {}).get("data"):
                        body = base64.urlsafe_b64decode(part["body"]["data"]).decode(
                            "utf-8"
                        )

        return body


class ExpenseExtractor:
    """Extract expense information from email content."""

    # Common patterns for amounts in various currencies
    AMOUNT_PATTERNS = [
        r"\$\s*([\d,]+\.?\d*)",  # $123.45 or $ 123.45
        r"([\d,]+\.?\d*)\s*(?:USD|usd)",  # 123.45 USD
        r"(?:Total|Amount|Charged|Payment|Price)[\s:]*\$?\s*([\d,]+\.?\d*)",
        r"€\s*([\d,]+\.?\d*)",  # Euro
        r"£\s*([\d,]+\.?\d*)",  # GBP
    ]

    # Patterns for merchants
    MERCHANT_PATTERNS = [
        r"(?:from|at|to)\s+([A-Z][A-Za-z0-9\s&']+?)(?:\s+for|\s+on|\s*$)",
        r"(?:Purchase at|Payment to|Transaction at)\s+([A-Za-z0-9\s&']+)",
    ]

    @classmethod
    def extract_expense(cls, email: dict) -> Optional[ExpenseCreate]:
        """Extract expense information from an email."""
        subject = email.get("subject", "")
        body = email.get("body", "")
        snippet = email.get("snippet", "")
        combined_text = f"{subject} {snippet} {body}"

        # Try to extract amount
        amount = cls._extract_amount(combined_text)
        if amount is None:
            return None

        # Extract merchant
        merchant = cls._extract_merchant(combined_text, email.get("from", ""))

        # Parse date
        date = cls._parse_date(email.get("date", ""))

        return ExpenseCreate(
            amount=amount,
            description=subject or snippet[:100],
            merchant=merchant,
            date=date,
            source=ExpenseSource.GMAIL,
            email_id=email.get("id"),
        )

    @classmethod
    def _extract_amount(cls, text: str) -> Optional[float]:
        """Extract monetary amount from text."""
        for pattern in cls.AMOUNT_PATTERNS:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                # Take the first match and clean it
                amount_str = matches[0].replace(",", "")
                try:
                    amount = float(amount_str)
                    if 0 < amount < 1000000:  # Sanity check
                        return amount
                except ValueError:
                    continue
        return None

    @classmethod
    def _extract_merchant(cls, text: str, from_email: str) -> Optional[str]:
        """Extract merchant name from text or email sender."""
        # Try patterns first
        for pattern in cls.MERCHANT_PATTERNS:
            match = re.search(pattern, text)
            if match:
                return match.group(1).strip()

        # Fall back to email sender domain
        if from_email:
            # Extract name from "Name <email@domain.com>" format
            name_match = re.match(r"([^<]+)", from_email)
            if name_match:
                name = name_match.group(1).strip()
                if name and name.lower() not in ["no-reply", "noreply", "notifications"]:
                    return name

        return None

    @classmethod
    def _parse_date(cls, date_str: str) -> Optional[datetime]:
        """Parse email date string to datetime."""
        # Common email date formats
        formats = [
            "%a, %d %b %Y %H:%M:%S %z",
            "%d %b %Y %H:%M:%S %z",
            "%a, %d %b %Y %H:%M:%S",
        ]

        # Remove timezone abbreviations that Python doesn't handle well
        date_str = re.sub(r"\s*\([A-Z]+\)\s*$", "", date_str)

        for fmt in formats:
            try:
                return datetime.strptime(date_str.strip(), fmt)
            except ValueError:
                continue

        return datetime.now()
