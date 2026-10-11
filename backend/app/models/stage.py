from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base


class Stage(Base):
    __tablename__ = "stages"
    __table_args__ = {"schema": "app"}

    id = Column(Integer, primary_key=True, index=True)
    stage_number = Column(Integer, unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    story_description = Column(Text, nullable=True)
    clues_guide = Column(Text, nullable=True)
    form_schema = Column(JSONB, nullable=False)  # Definitions of input fields
    correct_answers = Column(JSONB, nullable=False)  # Ground-truth values for fields
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    submissions = relationship("Submission", back_populates="stage")
