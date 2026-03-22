from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.invitation import InvitationCreate, InvitationOut, InvitationAccept
from app.services.invitation_service import (
    create_invitation, get_invitation_by_token,
    get_sent_invitations, get_received_invitations,
    accept_invitation, decline_invitation,
    get_linked_trees, revoke_link,
    get_pending_invitation_for_person,
)
from typing import List

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


@router.get("/token/{token}", response_model=InvitationOut)
async def get_by_token(token: str, db: AsyncSession = Depends(get_db)):
    inv = await get_invitation_by_token(db, token)
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found")
    return inv


@router.get("/check-person/{person_id}", response_model=InvitationOut)
async def check_person_invite(
    person_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check if a pending invitation already exists for a given contact person."""
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
