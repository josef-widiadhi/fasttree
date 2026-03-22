from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from app.models.person import Person, Relation, TreeLink
from app.models.user import User
from app.schemas.person import PersonCreate, PersonUpdate, RelationCreate
from typing import Optional, List
import vobject


async def get_persons_for_user(db: AsyncSession, user_id: int) -> List[Person]:
    result = await db.execute(
        select(Person).where(Person.owner_id == user_id).order_by(Person.id)
    )
    return result.scalars().all()


async def get_active_links_for_user(db: AsyncSession, user_id: int) -> List[TreeLink]:
    result = await db.execute(
        select(TreeLink).where(
            and_(
                or_(TreeLink.owner_id == user_id, TreeLink.linked_user_id == user_id),
                TreeLink.status == "active"
            )
        )
    )
    return result.scalars().all()


async def get_linked_persons(db: AsyncSession, user_id: int) -> List[Person]:
    """
    Return persons from linked trees that have this user's link_id in their shared_with,
    OR have shared_with containing "*" (broadcast).
    """
    links = await get_active_links_for_user(db, user_id)
    if not links:
        return []

    # Find which link IDs correspond to which other-user's persons
    # For each link, find the other user
    linked_persons = []
    for link in links:
        other_user_id = link.linked_user_id if link.owner_id == user_id else link.owner_id
        result = await db.execute(
            select(Person).where(Person.owner_id == other_user_id)
        )
        all_persons = result.scalars().all()
        for p in all_persons:
            sw = p.shared_with or []
            # Visible if: shared with everyone ("*"), or this specific link_id is in list
            if "*" in sw or link.id in sw:
                linked_persons.append(p)

    return linked_persons


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
    all_ids = [x for x in [relation.parent_id, relation.child_id, relation.person_a_id, relation.person_b_id] if x]
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


async def batch_update_sharing(
    db: AsyncSession, user_id: int, person_ids: List[int], link_id: int, shared: bool
) -> int:
    """
    Add or remove link_id from shared_with for the given person_ids.
    Returns count of updated persons.
    """
    # Verify link belongs to this user
    link_result = await db.execute(
        select(TreeLink).where(
            and_(
                TreeLink.id == link_id,
                or_(TreeLink.owner_id == user_id, TreeLink.linked_user_id == user_id),
                TreeLink.status == "active"
            )
        )
    )
    link = link_result.scalar_one_or_none()
    if not link:
        return 0

    count = 0
    for pid in person_ids:
        result = await db.execute(
            select(Person).where(and_(Person.id == pid, Person.owner_id == user_id))
        )
        person = result.scalar_one_or_none()
        if not person:
            continue
        sw = list(person.shared_with or [])
        if shared and link_id not in sw:
            sw.append(link_id)
        elif not shared and link_id in sw:
            sw.remove(link_id)
        person.shared_with = sw
        count += 1
    await db.commit()
    return count


async def set_share_all(db: AsyncSession, user_id: int, link_id: int, broadcast: bool) -> int:
    """
    broadcast=True  → set shared_with=["*"] on all own persons (share everything)
    broadcast=False → remove "*" from all persons for this link
    """
    link_result = await db.execute(
        select(TreeLink).where(
            and_(
                TreeLink.id == link_id,
                or_(TreeLink.owner_id == user_id, TreeLink.linked_user_id == user_id),
                TreeLink.status == "active"
            )
        )
    )
    if not link_result.scalar_one_or_none():
        return 0

    result = await db.execute(select(Person).where(Person.owner_id == user_id))
    persons = result.scalars().all()
    for person in persons:
        sw = list(person.shared_with or [])
        if broadcast:
            if link_id not in sw:
                sw.append(link_id)
            # remove "*" markers, use explicit link ids
        else:
            sw = [x for x in sw if x != link_id]
        person.shared_with = sw
    await db.commit()
    return len(persons)


async def get_sharing_status(db: AsyncSession, user_id: int, link_id: int) -> List[dict]:
    """Return all own persons with their sharing status for a given link."""
    result = await db.execute(select(Person).where(Person.owner_id == user_id))
    persons = result.scalars().all()
    return [
        {
            "person_id": p.id,
            "full_name": p.full_name,
            "nickname": p.nickname,
            "gender": p.gender,
            "birthday": p.birthday,
            "shared": link_id in (p.shared_with or []),
        }
        for p in persons
    ]


# --- VCF Import/Export ---

def parse_vcf(vcf_content: str) -> List[dict]:
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
                person['birthday'] = bday if isinstance(bday, str) else bday.strftime('%Y-%m-%d')
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
    except Exception:
        pass
    return persons


def export_to_vcf(persons: List[Person]) -> str:
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
            tel = vcard.add('tel'); tel.value = person.phone; tel.type_param = 'CELL'
        if person.email:
            email = vcard.add('email'); email.value = person.email; email.type_param = 'HOME'
        if person.address:
            adr = vcard.add('adr'); adr.value = vobject.vcard.Address(street=person.address)
        if person.gender:
            vcard.add('gender').value = {'male': 'M', 'female': 'F', 'other': 'O'}.get(person.gender, 'U')
        if person.notes:
            vcard.add('note').value = person.notes
        vcf_parts.append(vcard.serialize())
    return '\n'.join(vcf_parts)
