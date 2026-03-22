from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.person import Person
from app.schemas.invitation import InvitationCreate, InvitationOut, InvitationAccept
from app.services.invitation_service import (
    create_invitation, get_invitation_by_token,
    get_sent_invitations, get_received_invitations,
    accept_invitation, decline_invitation,
    get_linked_trees, revoke_link,
    get_pending_invitation_for_person,
)
from typing import List, Optional

router = APIRouter(prefix="/invitations", tags=["invitations"])


@router.post("/", response_model=InvitationOut)
async def send_invitation(
    data: InvitationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await create_invitation(db, current_user.id, data)


@router.get("/sent", response_model=List[InvitationOut])
async def list_sent(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await get_sent_invitations(db, current_user.id)


@router.get("/received", response_model=List[InvitationOut])
async def list_received(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await get_received_invitations(db, current_user.id)


@router.get("/token/{token}")
async def get_by_token(token: str, db: AsyncSession = Depends(get_db)):
    """
    Public endpoint — returns invitation details + resolved contact_person name
    so the accept page can show 'You are being linked as <name>'.
    """
    inv = await get_invitation_by_token(db, token)
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found")

    # Resolve sender info
    sender = await db.execute(select(User).where(User.id == inv.sender_id))
    sender = sender.scalar_one_or_none()

    # Resolve contact person name
    contact_person_name = None
    if inv.contact_person_id:
        cp = await db.execute(select(Person).where(Person.id == inv.contact_person_id))
        cp = cp.scalar_one_or_none()
        if cp:
            contact_person_name = cp.full_name

    return {
        "id": inv.id,
        "token": inv.token,
        "sender_id": inv.sender_id,
        "sender_name": sender.full_name or sender.username if sender else None,
        "sender_email": sender.email if sender else None,
        "recipient_id": inv.recipient_id,
        "recipient_email": inv.recipient_email,
        "message": inv.message,
        "share_mode": inv.share_mode,
        "contact_person_id": inv.contact_person_id,
        "contact_person_name": contact_person_name,
        "status": inv.status,
        "created_at": inv.created_at,
        "expires_at": inv.expires_at,
    }


@router.get("/check-person/{person_id}", response_model=InvitationOut)
async def check_person_invite(
    person_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = await get_pending_invitation_for_person(db, person_id, current_user.id)
    if not inv:
        raise HTTPException(status_code=404, detail="No pending invitation for this person")
    return inv


@router.post("/accept", response_model=InvitationOut)
async def accept(
    data: InvitationAccept,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = await accept_invitation(db, current_user.id, data.token, data.your_person_id)
    if not inv:
        raise HTTPException(status_code=400, detail="Invalid or expired invitation")
    return inv


@router.post("/decline/{token}", response_model=InvitationOut)
async def decline(
    token: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = await decline_invitation(db, current_user.id, token)
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found")
    return inv


@router.get("/linked-trees")
async def linked_trees(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await get_linked_trees(db, current_user.id)


@router.delete("/links/{link_id}")
async def revoke(
    link_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ok = await revoke_link(db, current_user.id, link_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Link not found")
    return {"ok": True}
