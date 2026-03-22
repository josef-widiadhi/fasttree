from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from sqlalchemy.orm import selectinload
from app.models.person import Person, Relation, TreeLink
from app.models.user import User
from app.schemas.person import PersonCreate, PersonUpdate, RelationCreate
from typing import Optional, List
import vobject
from datetime import datetime


async def get_persons_for_user(db: AsyncSession, user_id: int) -> List[Person]:
    result = await db.execute(
        select(Person).where(Person.owner_id == user_id).order_by(Person.id)
    )
    return result.scalars().all()


async def get_linked_persons(db: AsyncSession, user_id: int) -> List[Person]:
    """Get persons from linked trees that have visibility=shared"""
    links = await db.execute(
        select(TreeLink).where(
            and_(
                or_(TreeLink.owner_id == user_id, TreeLink.linked_user_id == user_id),
                TreeLink.status == "active"
            )
        )
    )
    links = links.scalars().all()

    linked_user_ids = set()
    for link in links:
        if link.owner_id == user_id:
            linked_user_ids.add(link.linked_user_id)
        else:
            linked_user_ids.add(link.owner_id)

    if not linked_user_ids:
        return []

    result = await db.execute(
        select(Person).where(
            and_(
                Person.owner_id.in_(linked_user_ids),
                Person.visibility == "shared"
            )
        )
    )
    return result.scalars().all()


async def get_relations_for_user(db: AsyncSession, user_id: int) -> List[Relation]:
    persons = await get_persons_for_user(db, user_id)
    person_ids = [p.id for p in persons]
    if not person_ids:
        return []

    result = await db.execute(
        select(Relation).where(
            or_(
                Relation.parent_id.in_(person_ids),
                Relation.child_id.in_(person_ids),
                Relation.person_a_id.in_(person_ids),
                Relation.person_b_id.in_(person_ids),
            )
        )
    )
    return result.scalars().all()


async def create_person(db: AsyncSession, user_id: int, data: PersonCreate) -> Person:
    person = Person(owner_id=user_id, **data.model_dump())
    db.add(person)
    await db.commit()
    await db.refresh(person)
    return person


async def update_person(db: AsyncSession, person_id: int, user_id: int, data: PersonUpdate) -> Optional[Person]:
    result = await db.execute(
        select(Person).where(and_(Person.id == person_id, Person.owner_id == user_id))
    )
    person = result.scalar_one_or_none()
    if not person:
        return None
    for field, val in data.model_dump(exclude_none=True).items():
        setattr(person, field, val)
    await db.commit()
    await db.refresh(person)
    return person


async def delete_person(db: AsyncSession, person_id: int, user_id: int) -> bool:
    result = await db.execute(
        select(Person).where(and_(Person.id == person_id, Person.owner_id == user_id))
    )
    person = result.scalar_one_or_none()
    if not person:
        return False
    await db.delete(person)
    await db.commit()
    return True


async def create_relation(db: AsyncSession, user_id: int, data: RelationCreate) -> Relation:
    relation = Relation(**data.model_dump())
    db.add(relation)
    await db.commit()
    await db.refresh(relation)
    return relation


async def delete_relation(db: AsyncSession, relation_id: int, user_id: int) -> bool:
    result = await db.execute(select(Relation).where(Relation.id == relation_id))
    relation = result.scalar_one_or_none()
    if not relation:
        return False
    # Verify ownership
    all_ids = [relation.parent_id, relation.child_id, relation.person_a_id, relation.person_b_id]
    all_ids = [i for i in all_ids if i]
    persons = await db.execute(
        select(Person).where(and_(Person.id.in_(all_ids), Person.owner_id == user_id))
    )
    if not persons.scalars().first():
        return False
    await db.delete(relation)
    await db.commit()
    return True


async def update_positions(db: AsyncSession, user_id: int, positions: list) -> bool:
    for pos in positions:
        result = await db.execute(
            select(Person).where(and_(Person.id == pos["person_id"], Person.owner_id == user_id))
        )
        person = result.scalar_one_or_none()
        if person:
            person.pos_x = pos["pos_x"]
            person.pos_y = pos["pos_y"]
    await db.commit()
    return True


# --- VCF Import/Export ---

def parse_vcf(vcf_content: str) -> List[dict]:
    """Parse VCF/vCard content into person dicts"""
    persons = []
    try:
        for vcard in vobject.readComponents(vcf_content):
            person = {}
            if hasattr(vcard, 'fn'):
                person['full_name'] = vcard.fn.value
            elif hasattr(vcard, 'n'):
                n = vcard.n.value
                parts = [n.prefix, n.given, n.additional, n.family, n.suffix]
                person['full_name'] = ' '.join(p for p in parts if p).strip()
            else:
                continue

            if hasattr(vcard, 'nickname'):
                person['nickname'] = vcard.nickname.value

            if hasattr(vcard, 'bday'):
                bday = vcard.bday.value
                if isinstance(bday, str):
                    person['birthday'] = bday
                else:
                    person['birthday'] = bday.strftime('%Y-%m-%d')

            if hasattr(vcard, 'tel'):
                person['phone'] = vcard.tel.value

            if hasattr(vcard, 'email'):
                person['email'] = vcard.email.value

            if hasattr(vcard, 'adr'):
                adr = vcard.adr.value
                parts = [adr.street, adr.city, adr.region, adr.code, adr.country]
                person['address'] = ', '.join(p for p in parts if p)

            if hasattr(vcard, 'gender'):
                g = vcard.gender.value.upper()
                person['gender'] = {'M': 'male', 'F': 'female'}.get(g, 'other')

            person['extra_fields'] = {}
            if hasattr(vcard, 'note'):
                person['notes'] = vcard.note.value

            persons.append(person)
    except Exception as e:
        pass
    return persons


def export_to_vcf(persons: List[Person]) -> str:
    """Export persons to VCF format"""
    vcf_parts = []
    for person in persons:
        vcard = vobject.vCard()

        vcard.add('fn').value = person.full_name

        n = vobject.vcard.Name(family='', given=person.full_name)
        vcard.add('n').value = n

        if person.nickname:
            vcard.add('nickname').value = person.nickname

        if person.birthday:
            vcard.add('bday').value = person.birthday

        if person.phone:
            tel = vcard.add('tel')
            tel.value = person.phone
            tel.type_param = 'CELL'

        if person.email:
            email = vcard.add('email')
            email.value = person.email
            email.type_param = 'HOME'

        if person.address:
            adr = vcard.add('adr')
            adr.value = vobject.vcard.Address(street=person.address)

        if person.gender:
            gender_map = {'male': 'M', 'female': 'F', 'other': 'O'}
            vcard.add('gender').value = gender_map.get(person.gender, 'U')

        if person.notes:
            vcard.add('note').value = person.notes

        vcf_parts.append(vcard.serialize())

    return '\n'.join(vcf_parts)
