from pydantic import BaseModel
from typing import Optional, Any, List
from datetime import datetime


class PersonCreate(BaseModel):
    full_name: str
    nickname: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[str] = None
    birth_place: Optional[str] = None
    death_date: Optional[str] = None
    is_deceased: bool = False
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    avatar_url: Optional[str] = None
    pos_x: float = 0.0
    pos_y: float = 0.0
    extra_fields: Optional[dict] = {}
    notes: Optional[str] = None
    visibility: str = "private"


class PersonUpdate(BaseModel):
    full_name: Optional[str] = None
    nickname: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[str] = None
    birth_place: Optional[str] = None
    death_date: Optional[str] = None
    is_deceased: Optional[bool] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    avatar_url: Optional[str] = None
    pos_x: Optional[float] = None
    pos_y: Optional[float] = None
    extra_fields: Optional[dict] = None
    notes: Optional[str] = None
    visibility: Optional[str] = None


class PersonOut(BaseModel):
    id: int
    owner_id: int
    full_name: str
    nickname: Optional[str]
    gender: Optional[str]
    birthday: Optional[str]
    birth_place: Optional[str]
    death_date: Optional[str]
    is_deceased: bool
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    avatar_url: Optional[str]
    pos_x: float
    pos_y: float
    extra_fields: Optional[dict]
    notes: Optional[str]
    visibility: str
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}


class RelationCreate(BaseModel):
    relation_type: str  # parent_child | spouse | partner | sibling | custom
    parent_id: Optional[int] = None
    child_id: Optional[int] = None
    person_a_id: Optional[int] = None
    person_b_id: Optional[int] = None
    label: Optional[str] = None


class RelationOut(BaseModel):
    id: int
    relation_type: str
    parent_id: Optional[int]
    child_id: Optional[int]
    person_a_id: Optional[int]
    person_b_id: Optional[int]
    label: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class TreeData(BaseModel):
    persons: List[PersonOut]
    relations: List[RelationOut]


class NodePositionUpdate(BaseModel):
    person_id: int
    pos_x: float
    pos_y: float
