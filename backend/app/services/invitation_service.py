from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from app.models.invitation import Invitation
from app.models.person import TreeLink, Person
from app.models.user import User
from app.schemas.invitation import InvitationCreate, InvitationAccept
from datetime import datetime, timedelta, timezone
from typing import Optional, List


async def create_invitation(db: AsyncSession, sender_id: int, data: InvitationCreate) -> Invitation:
    result = await db.execute(select(User).where(User.email == data.recipient_email))
    recipient = result.scalar_one_or_none()

    invitation = Invitation(
        sender_id=sender_id,
        recipient_id=recipient.id if recipient else None,
        recipient_email=data.recipient_email,
        message=data.message,
        share_mode=data.share_mode,
        contact_person_id=data.contact_person_id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(invitation)
    await db.commit()
    await db.refresh(invitation)
    return invitation


async def get_invitation_by_token(db: AsyncSession, token: str) -> Optional[Invitation]:
    result = await db.execute(select(Invitation).where(Invitation.token == token))
    return result.scalar_one_or_none()


async def get_sent_invitations(db: AsyncSession, user_id: int) -> List[Invitation]:
    result = await db.execute(
        select(Invitation).where(Invitation.sender_id == user_id).order_by(Invitation.created_at.desc())
    )
    return result.scalars().all()


async def get_received_invitations(db: AsyncSession, user_id: int) -> List[Invitation]:
    result = await db.execute(
        select(Invitation).where(
            and_(Invitation.recipient_id == user_id, Invitation.status == "pending")
        ).order_by(Invitation.created_at.desc())
    )
    return result.scalars().all()


async def accept_invitation(
    db: AsyncSession,
    user_id: int,
    token: str,
    your_person_id: Optional[int] = None,
) -> Optional[Invitation]:
    result = await db.execute(select(Invitation).where(Invitation.token == token))
    invitation = result.scalar_one_or_none()

    if not invitation or invitation.status != "pending":
        return None

    if not invitation.recipient_id:
        invitation.recipient_id = user_id

    # Use the pre-set contact_person_id as owner_person_id in the link
    link = TreeLink(
        owner_id=invitation.sender_id,
        linked_user_id=user_id,
        owner_person_id=invitation.contact_person_id,  # ← auto point-of-contact
        linked_person_id=your_person_id,
    )
    db.add(link)
    await db.flush()

    invitation.status = "accepted"
    invitation.tree_link_id = link.id
    await db.flush()

    # Auto-apply initial sharing based on share_mode
    if invitation.share_mode == "just_me" and invitation.contact_person_id:
        # Share only the contact person node
        cp = await db.execute(
            select(Person).where(Person.id == invitation.contact_person_id)
        )
        cp = cp.scalar_one_or_none()
        if cp:
            sw = list(cp.shared_with or [])
            if link.id not in sw:
                sw.append(link.id)
            cp.shared_with = sw
    elif invitation.share_mode == "full":
        # Share all persons of the sender that were previously marked shared (visibility=shared)
        # or simply share all of them with this link
        persons_result = await db.execute(
            select(Person).where(Person.owner_id == invitation.sender_id)
        )
        for p in persons_result.scalars().all():
            sw = list(p.shared_with or [])
            if link.id not in sw:
                sw.append(link.id)
            p.shared_with = sw
    # 'partial' = do nothing, user manages manually

    await db.commit()
    await db.refresh(invitation)
    return invitation


async def decline_invitation(db: AsyncSession, user_id: int, token: str) -> Optional[Invitation]:
    result = await db.execute(select(Invitation).where(Invitation.token == token))
    invitation = result.scalar_one_or_none()
    if not invitation:
        return None
    invitation.status = "declined"
    await db.commit()
    await db.refresh(invitation)
    return invitation


async def get_linked_trees(db: AsyncSession, user_id: int) -> List[dict]:
    result = await db.execute(
        select(TreeLink).where(
            and_(
                or_(TreeLink.owner_id == user_id, TreeLink.linked_user_id == user_id),
                TreeLink.status == "active"
            )
        )
    )
    links = result.scalars().all()
    output = []
    for link in links:
        other_id = link.linked_user_id if link.owner_id == user_id else link.owner_id
        user_result = await db.execute(select(User).where(User.id == other_id))
        other_user = user_result.scalar_one_or_none()
        if other_user:
            # Resolve contact person name if set
            contact_name = None
            if link.owner_person_id:
                pr = await db.execute(select(Person).where(Person.id == link.owner_person_id))
                cp = pr.scalar_one_or_none()
                contact_name = cp.full_name if cp else None
            output.append({
                "link_id": link.id,
                "user_id": other_user.id,
                "username": other_user.username,
                "full_name": other_user.full_name,
                "email": other_user.email,
                "contact_person_name": contact_name,
            })
    return output


async def revoke_link(db: AsyncSession, user_id: int, link_id: int) -> bool:
    result = await db.execute(
        select(TreeLink).where(
            and_(
                TreeLink.id == link_id,
                or_(TreeLink.owner_id == user_id, TreeLink.linked_user_id == user_id)
            )
        )
    )
    link = result.scalar_one_or_none()
    if not link:
        return False
    link.status = "revoked"
    await db.commit()
    return True


async def get_pending_invitation_for_person(
    db: AsyncSession, person_id: int, sender_id: int
) -> Optional[Invitation]:
    """Check if a pending invite already exists for this contact_person_id"""
    result = await db.execute(
        select(Invitation).where(
            and_(
                Invitation.contact_person_id == person_id,
                Invitation.sender_id == sender_id,
                Invitation.status == "pending",
            )
        )
    )
    return result.scalar_one_or_none()
