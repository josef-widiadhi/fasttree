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
    gender = Column(String)  # male, female, other, unknown
    birthday = Column(String)  # store as string for flexibility (YYYY-MM-DD)
    birth_place = Column(String)
    death_date = Column(String)
    is_deceased = Column(Boolean, default=False)

    # Contact
    phone = Column(String)
    email = Column(String)
    address = Column(Text)

    # Avatar / photo
    avatar_url = Column(String)

    # Node position on canvas
    pos_x = Column(Float, default=0.0)
    pos_y = Column(Float, default=0.0)

    # Dynamic extra fields (JSON)
    extra_fields = Column(JSON, default=dict)

    # Notes
    notes = Column(Text)

    # Visibility: private, shared (visible to linked trees)
    visibility = Column(String, default="private")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    owner = relationship("User", back_populates="persons", foreign_keys=[owner_id])

    parent_relations = relationship(
        "Relation",
        foreign_keys="Relation.child_id",
        back_populates="child",
        cascade="all, delete-orphan",
    )
    child_relations = relationship(
        "Relation",
        foreign_keys="Relation.parent_id",
        back_populates="parent",
        cascade="all, delete-orphan",
    )
    partner_relations_a = relationship(
        "Relation",
        foreign_keys="Relation.person_a_id",
        back_populates="person_a",
        cascade="all, delete-orphan",
    )
    partner_relations_b = relationship(
        "Relation",
        foreign_keys="Relation.person_b_id",
        back_populates="person_b",
        cascade="all, delete-orphan",
    )


class Relation(Base):
    __tablename__ = "relations"

    id = Column(Integer, primary_key=True, index=True)

    # For parent-child
    parent_id = Column(Integer, ForeignKey("persons.id", ondelete="CASCADE"), nullable=True)
    child_id = Column(Integer, ForeignKey("persons.id", ondelete="CASCADE"), nullable=True)

    # For partners (spouse/partner)
    person_a_id = Column(Integer, ForeignKey("persons.id", ondelete="CASCADE"), nullable=True)
    person_b_id = Column(Integer, ForeignKey("persons.id", ondelete="CASCADE"), nullable=True)

    # Type: parent_child | spouse | partner | sibling | custom
    relation_type = Column(String, nullable=False, default="parent_child")
    label = Column(String)  # custom label for "custom" type

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    parent = relationship("Person", foreign_keys=[parent_id], back_populates="child_relations")
    child = relationship("Person", foreign_keys=[child_id], back_populates="parent_relations")
    person_a = relationship("Person", foreign_keys=[person_a_id], back_populates="partner_relations_a")
    person_b = relationship("Person", foreign_keys=[person_b_id], back_populates="partner_relations_b")


class TreeLink(Base):
    """Links between two users' trees (after accepting invitation)"""
    __tablename__ = "tree_links"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    linked_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    # Which persons are the bridge nodes (cross-tree link)
    owner_person_id = Column(Integer, ForeignKey("persons.id"), nullable=True)
    linked_person_id = Column(Integer, ForeignKey("persons.id"), nullable=True)
    status = Column(String, default="active")  # active | revoked
    created_at = Column(DateTime(timezone=True), server_default=func.now())
