from datetime import datetime
from sqlalchemy import ARRAY, Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base


class Submission(Base):
    __tablename__ = "submissions"
    __table_args__ = {"schema": "app"}

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("app.teams.id", ondelete="CASCADE"), nullable=False)
    stage_id = Column(Integer, ForeignKey("app.stages.id"), nullable=False)
    submitted_answers = Column(JSONB, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    failed_keys = Column(ARRAY(String), nullable=True)
    submitted_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    team = relationship("Team", back_populates="submissions")
    stage = relationship("Stage", back_populates="submissions")
