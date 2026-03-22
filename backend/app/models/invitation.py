from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import secrets


class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True, default=lambda: secrets.token_urlsafe(32))
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    recipient_email = Column(String)
    message = Column(Text)

    # What the sender wants to share
    share_mode = Column(String, default="full")  # full | partial

    # Pre-set point-of-contact: which person in the SENDER's tree represents the invitee.
    # When accepted, the TreeLink.owner_person_id is automatically set to this.
    contact_person_id = Column(Integer, ForeignKey("persons.id"), nullable=True)

    # Status: pending | accepted | declined | expired | revoked
    status = Column(String, default="pending")

    # After acceptance, link is created
    tree_link_id = Column(Integer, ForeignKey("tree_links.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))

    sender = relationship("User", back_populates="sent_invitations", foreign_keys=[sender_id])
    recipient = relationship("User", back_populates="received_invitations", foreign_keys=[recipient_id])
    contact_person = relationship("Person", foreign_keys=[contact_person_id])
