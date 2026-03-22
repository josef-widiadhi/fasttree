from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.person import PersonCreate, PersonUpdate, PersonOut, RelationCreate, RelationOut, TreeData, NodePositionUpdate
from app.services.person_service import (
    get_persons_for_user, get_linked_persons, get_relations_for_user,
    create_person, update_person, delete_person,
    create_relation, delete_relation, update_positions,
    parse_vcf, export_to_vcf
)
from typing import List

router = APIRouter(prefix="/persons", tags=["persons"])


@router.get("/tree", response_model=TreeData)
async def get_tree(
    include_linked: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    persons = await get_persons_for_user(db, current_user.id)
    if include_linked:
        linked = await get_linked_persons(db, current_user.id)
        persons = list(persons) + list(linked)
    relations = await get_relations_for_user(db, current_user.id)
    return TreeData(persons=persons, relations=relations)


@router.post("/", response_model=PersonOut)
async def add_person(
    data: PersonCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await create_person(db, current_user.id, data)


@router.put("/{person_id}", response_model=PersonOut)
async def edit_person(
    person_id: int,
    data: PersonUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    person = await update_person(db, person_id, current_user.id, data)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    return person


@router.delete("/{person_id}")
async def remove_person(
    person_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ok = await delete_person(db, person_id, current_user.id)
    if not ok:
        raise HTTPException(status_code=404, detail="Person not found")
    return {"ok": True}


@router.post("/relations", response_model=RelationOut)
async def add_relation(
    data: RelationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await create_relation(db, current_user.id, data)


@router.delete("/relations/{relation_id}")
async def remove_relation(
    relation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ok = await delete_relation(db, relation_id, current_user.id)
    if not ok:
        raise HTTPException(status_code=404, detail="Relation not found")
    return {"ok": True}


@router.post("/positions")
async def save_positions(
    positions: List[NodePositionUpdate],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await update_positions(db, current_user.id, [p.model_dump() for p in positions])
    return {"ok": True}


@router.post("/import/vcf", response_model=List[PersonOut])
async def import_vcf(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    content = await file.read()
    try:
        vcf_text = content.decode("utf-8")
    except UnicodeDecodeError:
        vcf_text = content.decode("latin-1")

    parsed = parse_vcf(vcf_text)
    created = []
    for p_data in parsed:
        person_in = PersonCreate(**{k: v for k, v in p_data.items() if k in PersonCreate.model_fields})
        person = await create_person(db, current_user.id, person_in)
        created.append(person)
    return created


@router.get("/export/vcf", response_class=PlainTextResponse)
async def export_vcf(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    persons = await get_persons_for_user(db, current_user.id)
    vcf_content = export_to_vcf(list(persons))
    return PlainTextResponse(
        content=vcf_content,
        media_type="text/vcard",
        headers={"Content-Disposition": "attachment; filename=family_tree.vcf"}
    )
