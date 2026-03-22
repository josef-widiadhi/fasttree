from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, JSON, Float, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Person(Base):
    __tablename__ = "persons"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Basic info
    full_name = Column(String, nullable=False)
    nickname = Column(String)
    gender = Column(String)
    birthday = Column(String)
    birth_place = Column(String)
    death_date = Column(String)
    is_deceased = Column(Boolean, default=False)

    # Contact
    phone = Column(String)
    email = Column(String)
    address = Column(Text)
    avatar_url = Column(String)

    # Node position on canvas
    pos_x = Column(Float, default=0.0)
    pos_y = Column(Float, default=0.0)

    # Dynamic extra fields
    extra_fields = Column(JSON, default=dict)
    notes = Column(Text)

    # Old global visibility kept for migration compat
    visibility = Column(String, default="private")

    # NEW: list of tree_link IDs this person is shared with.
    # []          = private (no one sees this)
    # [1, 3]      = only links 1 and 3 can see this person
    # ["*"]       = shared with ALL current and future links (opt-in broadcast)
    shared_with = Column(JSON, default=list)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="persons", foreign_keys=[owner_id])
    parent_relations = relationship(
        "Relation", foreign_keys="Relation.child_id",
        back_populates="child", cascade="all, delete-orphan",
    )
    child_relations = relationship(
        "Relation", foreign_keys="Relation.parent_id",
        back_populates="parent", cascade="all, delete-orphan",
    )
    partner_relations_a = relationship(
        "Relation", foreign_keys="Relation.person_a_id",
        back_populates="person_a", cascade="all, delete-orphan",
    )
    partner_relations_b = relationship(
        "Relation", foreign_keys="Relation.person_b_id",
        back_populates="person_b", cascade="all, delete-orphan",
    )


class Relation(Base):
    __tablename__ = "relations"

    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("persons.id", ondelete="CASCADE"), nullable=True)
    child_id  = Column(Integer, ForeignKey("persons.id", ondelete="CASCADE"), nullable=True)
    person_a_id = Column(Integer, ForeignKey("persons.id", ondelete="CASCADE"), nullable=True)
    person_b_id = Column(Integer, ForeignKey("persons.id", ondelete="CASCADE"), nullable=True)
    relation_type = Column(String, nullable=False, default="parent_child")
    label = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    parent   = relationship("Person", foreign_keys=[parent_id],   back_populates="child_relations")
    child    = relationship("Person", foreign_keys=[child_id],    back_populates="parent_relations")
    person_a = relationship("Person", foreign_keys=[person_a_id], back_populates="partner_relations_a")
    person_b = relationship("Person", foreign_keys=[person_b_id], back_populates="partner_relations_b")


class TreeLink(Base):
    __tablename__ = "tree_links"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    linked_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner_person_id  = Column(Integer, ForeignKey("persons.id"), nullable=True)
    linked_person_id = Column(Integer, ForeignKey("persons.id"), nullable=True)
    status = Column(String, default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
