from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
import models
import schemas


def get_notes(db: Session, skip: int = 0, limit: int = 100) -> List[models.Note]:
    return db.query(models.Note).order_by(models.Note.updated_at.desc()).offset(skip).limit(limit).all()


def get_note(db: Session, note_id: int) -> Optional[models.Note]:
    return db.query(models.Note).filter(models.Note.id == note_id).first()


def create_note(db: Session, note: schemas.NoteCreate) -> models.Note:
    db_note = models.Note(title=note.title, content=note.content)
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note


def update_note(db: Session, note_id: int, note: schemas.NoteUpdate) -> Optional[models.Note]:
    db_note = get_note(db, note_id)
    if db_note is None:
        return None
    db_note.title = note.title
    db_note.content = note.content
    db_note.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_note)
    return db_note


def patch_note(db: Session, note_id: int, note: schemas.NotePatch) -> Optional[models.Note]:
    db_note = get_note(db, note_id)
    if db_note is None:
        return None
    update_data = note.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_note, field, value)
    db_note.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_note)
    return db_note


def delete_note(db: Session, note_id: int) -> bool:
    db_note = get_note(db, note_id)
    if db_note is None:
        return False
    db.delete(db_note)
    db.commit()
    return True
