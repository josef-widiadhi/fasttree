from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
import re


class InvitationCreate(BaseModel):
    recipient_email: str
    message: Optional[str] = None
    share_mode: str = "full"
    contact_person_id: Optional[int] = None  # point-of-contact person node in sender's tree

    @field_validator("recipient_email")
    @classmethod
    def validate_email(cls, v):
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v):
            raise ValueError("Invalid email address")
        return v.lower().strip()


class InvitationOut(BaseModel):
    id: int
    token: str
    sender_id: int
    recipient_id: Optional[int]
    recipient_email: Optional[str]
    message: Optional[str]
    share_mode: str
    contact_person_id: Optional[int]
    status: str
    created_at: datetime
    expires_at: Optional[datetime]

    model_config = {"from_attributes": True}


class InvitationAccept(BaseModel):
    token: str
    # Optionally the recipient can also tag their own person node
    your_person_id: Optional[int] = None
