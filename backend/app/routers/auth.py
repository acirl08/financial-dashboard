from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from app.config import get_settings
from app.database import get_supabase

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()

# Google OAuth scopes for Gmail access
SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.labels",
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
]


def get_google_flow() -> Flow:
    """Create Google OAuth flow."""
    client_config = {
        "web": {
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [settings.google_redirect_uri],
        }
    }

    flow = Flow.from_client_config(client_config, scopes=SCOPES)
    flow.redirect_uri = settings.google_redirect_uri
    return flow


@router.get("/google")
async def google_auth(user_id: str):
    """Initiate Google OAuth flow for Gmail access."""
    flow = get_google_flow()

    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=user_id,  # Pass user_id in state to link after callback
    )

    return {"authorization_url": authorization_url}


@router.get("/google/callback")
async def google_callback(request: Request, code: str, state: str):
    """Handle Google OAuth callback."""
    try:
        flow = get_google_flow()
        flow.fetch_token(code=code)

        credentials = flow.credentials
        user_id = state  # User ID passed in state

        # Store refresh token in database
        supabase = get_supabase()
        supabase.table("profiles").update(
            {"gmail_connected": True, "gmail_refresh_token": credentials.refresh_token}
        ).eq("id", user_id).execute()

        # Redirect to frontend with success
        return RedirectResponse(
            url=f"{settings.frontend_url}/settings?gmail=connected"
        )

    except Exception as e:
        return RedirectResponse(
            url=f"{settings.frontend_url}/settings?gmail=error&message={str(e)}"
        )


@router.post("/google/disconnect")
async def disconnect_gmail(user_id: str):
    """Disconnect Gmail from user account."""
    supabase = get_supabase()

    supabase.table("profiles").update(
        {"gmail_connected": False, "gmail_refresh_token": None}
    ).eq("id", user_id).execute()

    return {"message": "Gmail disconnected successfully"}
