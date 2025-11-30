from fastapi import APIRouter, HTTPException
from app.database import get_supabase
from app.models import PartnerInvite

router = APIRouter(prefix="/partners", tags=["partners"])


@router.post("/invite")
async def invite_partner(user_id: str, invite: PartnerInvite):
    """Send a partner invitation."""
    supabase = get_supabase()

    # Check if user already has a partner
    profile = supabase.table("profiles").select("partner_id").eq("id", user_id).single().execute()
    if profile.data and profile.data.get("partner_id"):
        raise HTTPException(status_code=400, detail="You already have a partner linked")

    # Check if invite already exists
    existing = supabase.table("partner_invites").select("id").eq("inviter_id", user_id).eq("invitee_email", invite.email).eq("status", "pending").execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Invite already sent to this email")

    # Create invite
    result = supabase.table("partner_invites").insert({
        "inviter_id": user_id,
        "invitee_email": invite.email,
        "status": "pending",
    }).execute()

    return {"message": "Invite sent", "invite_id": result.data[0]["id"] if result.data else None}


@router.get("/invites")
async def get_invites(user_id: str):
    """Get pending invites for a user (both sent and received)."""
    supabase = get_supabase()

    # Get user's email
    profile = supabase.table("profiles").select("email").eq("id", user_id).single().execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="User not found")

    user_email = profile.data["email"]

    # Get sent invites
    sent = supabase.table("partner_invites").select("*").eq("inviter_id", user_id).eq("status", "pending").execute()

    # Get received invites
    received = supabase.table("partner_invites").select(
        "*, profiles!inviter_id(email, name)"
    ).eq("invitee_email", user_email).eq("status", "pending").execute()

    return {
        "sent": sent.data or [],
        "received": received.data or [],
    }


@router.post("/invites/{invite_id}/accept")
async def accept_invite(invite_id: str, user_id: str):
    """Accept a partner invitation."""
    supabase = get_supabase()

    # Get the invite
    invite = supabase.table("partner_invites").select("*").eq("id", invite_id).single().execute()
    if not invite.data:
        raise HTTPException(status_code=404, detail="Invite not found")

    if invite.data["status"] != "pending":
        raise HTTPException(status_code=400, detail="Invite is no longer pending")

    # Verify the current user is the invitee
    profile = supabase.table("profiles").select("email").eq("id", user_id).single().execute()
    if not profile.data or profile.data["email"] != invite.data["invitee_email"]:
        raise HTTPException(status_code=403, detail="You cannot accept this invite")

    inviter_id = invite.data["inviter_id"]

    # Link the partners (update both profiles)
    supabase.table("profiles").update({"partner_id": inviter_id}).eq("id", user_id).execute()
    supabase.table("profiles").update({"partner_id": user_id}).eq("id", inviter_id).execute()

    # Mark invite as accepted
    supabase.table("partner_invites").update({"status": "accepted"}).eq("id", invite_id).execute()

    return {"message": "Partner linked successfully"}


@router.post("/invites/{invite_id}/decline")
async def decline_invite(invite_id: str, user_id: str):
    """Decline a partner invitation."""
    supabase = get_supabase()

    # Get the invite
    invite = supabase.table("partner_invites").select("*").eq("id", invite_id).single().execute()
    if not invite.data:
        raise HTTPException(status_code=404, detail="Invite not found")

    # Verify the current user is the invitee
    profile = supabase.table("profiles").select("email").eq("id", user_id).single().execute()
    if not profile.data or profile.data["email"] != invite.data["invitee_email"]:
        raise HTTPException(status_code=403, detail="You cannot decline this invite")

    # Mark invite as declined
    supabase.table("partner_invites").update({"status": "declined"}).eq("id", invite_id).execute()

    return {"message": "Invite declined"}


@router.delete("/unlink")
async def unlink_partner(user_id: str):
    """Unlink from current partner."""
    supabase = get_supabase()

    # Get current partner
    profile = supabase.table("profiles").select("partner_id").eq("id", user_id).single().execute()
    if not profile.data or not profile.data.get("partner_id"):
        raise HTTPException(status_code=400, detail="No partner to unlink")

    partner_id = profile.data["partner_id"]

    # Unlink both users
    supabase.table("profiles").update({"partner_id": None}).eq("id", user_id).execute()
    supabase.table("profiles").update({"partner_id": None}).eq("id", partner_id).execute()

    return {"message": "Partner unlinked successfully"}


@router.get("/status")
async def get_partner_status(user_id: str):
    """Get partner linking status."""
    supabase = get_supabase()

    profile = supabase.table("profiles").select(
        "partner_id, profiles!partner_id(id, email, name)"
    ).eq("id", user_id).single().execute()

    if not profile.data:
        raise HTTPException(status_code=404, detail="User not found")

    partner_data = profile.data.get("profiles")

    return {
        "has_partner": profile.data.get("partner_id") is not None,
        "partner": partner_data if partner_data else None,
    }
