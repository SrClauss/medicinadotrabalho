import random
import bcrypt
from flask import Blueprint, request, jsonify, current_app
import ulid
from app.database import get_db
import sqlalchemy.exc
from app.models.user import User, UserDTO
from app.models.company import Company, CompanyDTO
from bcrypt import checkpw, hashpw
import jwt
from datetime import datetime, timezone, timedelta
from .company_routes import enviar_email_verificacao as enviar_email_company
from .user_routes import enviar_email_verificacao as enviar_email_user
import faker
import unicodedata

# Criando o Blueprint para rotas de autenticação
auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Autentica um usuário e retorna um token JWT
    """
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Email e senha são obrigatórios'}), 400

    db = get_db()
    
    # Verifica se é um usuário
    user = db.query(User).filter_by(email=data['email']).first()
    company = db.query(Company).filter_by(email=data['email']).first()
    
    if not user and not company:
        return jsonify({'message': 'Email ou senha inválidos'}), 404
    
    if user and checkpw(data['password'].encode('utf-8'), user.password_hash.encode('utf-8')):
        token = jwt.encode({'sub': user.id, 'role': user.role, 'exp': datetime.now(timezone.utc) + timedelta(hours=1)}, current_app.config['SECRET_KEY'], algorithm='HS256')
        return jsonify({'token': token})
    
    if company and checkpw(data['password'].encode('utf-8'), company.password_hash.encode('utf-8')):   
        token = jwt.encode({'sub': company.id, 'exp': datetime.now(timezone.utc) + timedelta(hours=1)}, current_app.config['SECRET_KEY'], algorithm='HS256')
        return jsonify({'token': token})
    
    return jsonify({'message': 'Email ou senha inválidos'}), 401
    

@auth_bp.route('/recover-password', methods=['POST'])
def recover_password():
    """
    Envia um email com instruções para recuperação de senha
    """
    data = request.get_json()
    
    if not data or not data.get('email'):
        return jsonify({'message': 'Email é obrigatório'}), 400
    
    db = get_db()
    
    user = db.query(User).filter_by(email=data['email']).first()
    user_dto = UserDTO.from_model(user)
    if user:
        enviar_email_user(user_dto)
        return jsonify({'message': 'Email enviado com instruções para recuperação de senha'})
    company = db.query(Company).filter_by(email=data['email']).first()
    company_dto = CompanyDTO.from_model(company)
    if company:
        enviar_email_company(company)
        return jsonify({'message': 'Email enviado com instruções para recuperação de senha'})
    
    return jsonify({'message': 'Email não encontrado'}), 404


def generate_unique_email(fake, tipo):
    """Gera um email único baseado no nome"""
    if tipo == "user":
        first_name = fake.first_name()
        last_name = fake.last_name()
        username = f"{first_name.lower()}{random.choice(['', '.'])}{last_name.lower()}"
        domain = random.choice(['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'uol.com.br'])
    else:  # company
        company_name = fake.company()
        username = ''.join(c for c in company_name.lower().replace(' ', '') if c.isalnum())[:15]
        domain = f"{username}.com.br"

    # Normaliza para remover acentos
    username = ''.join(c for c in unicodedata.normalize('NFD', username) if unicodedata.category(c) != 'Mn')
    
    # Adiciona um número aleatório para aumentar a chance de unicidade
    rand_num = random.randint(1, 9999)
    email = f"{username}{rand_num}@{domain}"
    
    return email


@auth_bp.route('/populate', methods=['POST'])
def populate():
    db = get_db()
    
    users_created = 0
    companies_created = 0
    total_users_target = 10000
    
    # Contadores para estatísticas
    users_attempted = 0
    companies_attempted = 0
    user_failures = 0
    company_failures = 0
    
    while users_created < total_users_target:
        # Ciclo de criação: 10 usuários + 1 empresa
        for _ in range(10):  # Tentar criar 10 usuários
            if users_created >= total_users_target:
                break
                
            users_attempted += 1
            try:
                fake = faker.Faker('pt_BR')
                
                # Gerar dados do usuário
                first_name = fake.first_name()
                last_name = fake.last_name()
                full_name = f"{first_name} {last_name}"
                
                rdn = random.random()
                adress_number = 1 if rdn < 0.7 else 2 if rdn < 0.9 else 3 if rdn < 0.95 else 4
                role = 2 if rdn < 0.9 else 1 if rdn < 0.97 else 0
                
                adresses = [{
                    "id": str(ulid.new()),
                    "cep": fake.postcode(),
                    "logradouro": fake.street_name(),
                    "numero": fake.building_number(),
                    "complemento": "Casa",
                    "bairro": fake.neighborhood(),
                    "cidade": fake.city(),
                    "estado": fake.state_abbr(),
                } for _ in range(adress_number)]
                
                # Gerar email único
                email = generate_unique_email(fake, "user")
                
                user = User(
                    id = str(ulid.new()),
                    name=full_name,
                    email=email,
                    password_hash=hashpw('123456'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),             
                    address=adresses,
                    phone=fake.phone_number(),
                    cpf=fake.cpf(),
                    role=role,
                    ativo=True,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                )
                
                db.add(user)
                db.commit()
                users_created += 1
                print(f"Usuário {users_created}/{total_users_target} criado com sucesso")
                
            except sqlalchemy.exc.IntegrityError as e:
                db.rollback()
                user_failures += 1
                print(f"Falha ao criar usuário: {e}")
                continue
        
        # Criar uma empresa a cada 10 usuários
        if users_created % 10 == 0 and users_created > 0:
            companies_attempted += 1
            try:
                fake = faker.Faker('pt_BR')
                
                # Gerar dados da empresa
                rdn = random.random()
                adress_number = 1 if rdn < 0.7 else 2 if rdn < 0.9 else 3 if rdn < 0.95 else 4
                
                adresses = [{
                    "id": str(ulid.new()),
                    "cep": fake.postcode(),
                    "logradouro": fake.street_name(),
                    "numero": fake.building_number(),
                    "complemento": "Casa",
                    "bairro": fake.neighborhood(),
                    "cidade": fake.city(),
                    "estado": fake.state_abbr(),
                } for _ in range(adress_number)]
                
                # Gerar email único
                email = generate_unique_email(fake, "company")
                
                company = Company(
                    id = str(ulid.new()),
                    name=fake.company(),
                    address=adresses,
                    phone=fake.phone_number(), 
                    cnpj=fake.cnpj(),
                    email=email,
                    password_hash=hashpw('123456'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
                    ativo=True,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                )
                
                db.add(company)
                db.commit()
                companies_created += 1
                print(f"Empresa {companies_created}/{total_users_target//10} criada com sucesso")
                
            except sqlalchemy.exc.IntegrityError as e:
                db.rollback()
                company_failures += 1
                print(f"Falha ao criar empresa: {e}")
                continue
    
    # Estatísticas finais
    stats = {
        "users_created": users_created,
        "companies_created": companies_created,
        "user_attempts": users_attempted,
        "company_attempts": companies_attempted,
        "user_failures": user_failures,
        "company_failures": company_failures
    }
    
    print(f"Processo de população concluído: {stats}")
    return jsonify({
        'message': 'Populado com sucesso',
        'stats': stats
    })