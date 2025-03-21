# app/models/exam.py
from sqlalchemy import Column, String, DateTime, func, ForeignKey, Boolean, Date
from sqlalchemy.orm import relationship
from datetime import datetime
import pytz
import ulid
from app.database import Base

timezone = pytz.timezone('UTC')


class Exam(Base):
    __tablename__ = 'exams'
    id = Column(String(26), primary_key=True, default=lambda: str(ulid.new()))
    description = Column(String(500))
    image_uploaded = Column(Boolean, default=False)
    user_id = Column(String(26), ForeignKey('users.id'))
    company_id = Column(String(26), ForeignKey('companies.id'))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    exam_date = Column(Date, nullable=True)  # Nova coluna para a data do exame

    user = relationship("User", back_populates="exams")
    company = relationship("Company", back_populates="exams")

        
        
        