# app/models/company.py
from bcrypt import checkpw, gensalt, hashpw
from flask import current_app
import jwt
from sqlalchemy import Column, String, DateTime, func, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import pytz
import ulid
from .exam import Exam
from app.database import Base

timezone = pytz.timezone('UTC')

class Company(Base):
    __tablename__ = 'companies'
    id = Column(String(26), primary_key=True, default=lambda: str(ulid.new()))
    name = Column(String(100), nullable=False)
    address = Column(JSON, nullable=False)
    phone = Column(String(20), nullable=False)
    cnpj = Column(String(14), unique=True, nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(String(128), nullable=True)  # Permite senha nula inicialmente
    ativo = Column(Boolean, default=False)  # Campo para verificar se a conta está ativa
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Use string para evitar importação circular
    exams = relationship("Exam", back_populates="company")

    def __repr__(self):
        return f"<Company(name='{self.name}', email='{self.email}')>"

    def check_password(self, password):
        return checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8')) if self.password_hash else False
    
    def to_jwt(self):
        payload = {
            'email': self.email,
            'exp': datetime.now(timezone) + timedelta(hours=1)
        }
        return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'address': self.address,
            'phone': self.phone,
            'cnpj': self.cnpj,
            'email': self.email,
            'ativo': self.ativo,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

class CompanyDTO:
    def __init__(self, name, address, phone, cnpj, email, password):
        self.name = name
        self.address = address
        self.phone = phone
        self.cnpj = cnpj
        self.email = email
        self.password = password

    def to_dict(self):
        return {
            'name': self.name,
            'address': self.address,
            'phone': self.phone,
            'cnpj': self.cnpj,
            'email': self.email,
            'password': self.password
        }

    @staticmethod
    def from_dict(data):
        return CompanyDTO(name=data['name'], address=data['address'], phone=data['phone'], cnpj=data['cnpj'], email=data['email'], password=data['password'])

    @staticmethod
    def from_jwt(token):
        try:
            data = jwt.decode(
                token,
                current_app.config['SECRET_KEY'],
                algorithms=['HS256'],
                options={"require_exp": True}  # Exige validação de expiração
            )
            return CompanyDTO(name=data['name'], address=data['address'], phone=data['phone'], cnpj=data['cnpj'], email=data['email'], password=None)
        except jwt.ExpiredSignatureError:
            return None  # Token expirado
        except Exception as e:
            current_app.logger.error(f"Erro ao decodificar token: {str(e)}")
            return None
    def to_jwt(self):
        payload = {
            'name': self.name,
            'address': self.address,
            'phone': self.phone,
            'cnpj': self.cnpj,
            'email': self.email,
            'exp': datetime.now(timezone) + timedelta(hours=1)
        }
        return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')