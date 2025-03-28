from flask import Blueprint, request, jsonify, current_app
import jwt
from app.models.user import User, UserDTO
from app import get_db, mail
from flask_mail import Message
from bcrypt import hashpw, gensalt
import json
from datetime import datetime, timedelta
from sqlalchemy import func
import ulid
from app.models.exam import Exam

user_bp = Blueprint('user', __name__)

# Remova a função remover_acentos
# def remover_acentos(texto):
#     """Remove acentos e normaliza o texto para comparação."""
#     texto = texto.lower()
#     return ''.join(c for c in unicodedata.normalize('NFD', texto)
#                    if unicodedata.category(c) != 'Mn')

def enviar_email(para, assunto, template):
    msg = Message(assunto, recipients=[para], html=template, sender=current_app.config['MAIL_USERNAME'])
    mail.send(msg)

def enviar_email_verificacao(user_dto: UserDTO):
    token = user_dto.to_jwt()
    frontend_url = current_app.config['FRONTEND_URL']
    confirm_url = f"{frontend_url}/redefine-senha/{token}"
    html = f'<b>Bem-vindo! Por favor, confirme seu e-mail clicando <a href="{confirm_url}">aqui</a>.</b>'
    assunto = "Por favor, confirme seu e-mail"
    enviar_email(user_dto.email, assunto, html)
    return confirm_url

@user_bp.route('/usuario/reenviaremail/<id>', methods=['GET'])
def reenviaemail(id):
    try:
        db = get_db()
        user = db.query(User).get(id)
        if not user:
            return jsonify({"erro": "Usuário não encontrado"}), 404
        user_dto = UserDTO.from_model(user)
        enviar_email_verificacao(user_dto)
        return jsonify({"mensagem": "E-mail de confirmação reenviado com sucesso"}), 200
    except Exception as e:
        current_app.logger.error(f"Erro ao reenviar e-mail de confirmação: {str(e)}")
        return jsonify({"erro": "Erro ao reenviar e-mail de confirmação"}), 500

@user_bp.route('/usuario/registrar', methods=['POST'])
def registrar():
    try:
        dados = request.get_json()
        if not dados:
            return jsonify({"erro": "Nenhum dado de entrada fornecido"}), 400
        db = get_db()
        # Verifica se o e-mail já está registrado
        existing_user_email = db.query(User).filter(User.email == dados['email']).first()
        if existing_user_email:
            return jsonify({"erro": "E-mail já registrado"}), 409
        # Verifica se o CPF já está registrado
        existing_user_cpf = db.query(User).filter(User.cpf == dados['cpf']).first()
        if existing_user_cpf:
            return jsonify({"erro": "CPF já registrado"}), 409

        address_data = dados.get('address')
        new_user_id = str(ulid.new())

        user = User(
            id = new_user_id,
            name=dados['name'],
            email=dados['email'],
            address=address_data,
            phone=dados['phone'],
            cpf=dados['cpf'],
            password_hash="",
            ativo=False,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

        db.add(user)
        db.commit()

        # Serializar o usuário para o formato JSON (incluindo o ID)
        user_dict = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "address": user.address,
            "phone": user.phone,
            "cpf": user.cpf,
            "ativo": user.ativo,
            "role": user.role,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None
        }

        user_dto = UserDTO.from_model(user)
        url_frontend = enviar_email_verificacao(user_dto)

        return jsonify({"mensagem": "Verifique seu e-mail para confirmar a conta.",
                        "url": url_frontend,
                        "user": user_dict  # Retorna os dados do usuário
                        }), 201
    except Exception as e:
        db.rollback()
        current_app.logger.error(f"Erro ao registrar usuário: {str(e)}")
        return jsonify({"erro": "Erro ao registrar usuário"}), 500

@user_bp.route('/usuario/redefinir_senha', methods=['POST'])
def redefinir_senha():
    try:
        dados = request.get_json()
        if not dados or 'email' not in dados:
            return jsonify({"erro": "Nenhum e-mail fornecido"}), 400
        email = dados['email']
        db = get_db()
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return jsonify({"erro": "Usuário não encontrado"}), 404
        user_dto = UserDTO(
            name=user.name,
            email=user.email,
            address=user.address,
            phone=user.phone,
            cpf=user.cpf
        )
        token = user_dto.to_jwt()
        frontend_url = current_app.config['FRONTEND_URL']
        reset_url = f"{frontend_url}/redefine-senha/{token}"
        html = f'<b>Para redefinir sua senha, clique <a href="{reset_url}">aqui</a>.</b>'
        assunto = "Redefinição de senha"
        enviar_email(user.email, assunto, html)
        return jsonify({"mensagem": "E-mail de redefinição de senha enviado com sucesso."}), 200
    except Exception as e:
        current_app.logger.error(f"Erro ao enviar e-mail de redefinição de senha: {str(e)}")
        return jsonify({"erro": "Erro ao enviar e-mail de redefinição de senha"}), 500

@user_bp.route('/usuario/confirmar_redefinicao', methods=['POST'])
def confirmar_redefinicao():
    try:
        dados = request.get_json()
        if not dados or 'token' not in dados or 'password' not in dados:
            return jsonify({"erro": "Dados de entrada inválidos"}), 400
    except Exception as e:
        return jsonify({"erro": "Erro ao confirmar redefinição de senha"}), 500

    token_decodificado = jwt.decode(dados["token"], current_app.config['SECRET_KEY'], algorithms=["HS256"])
    print(token_decodificado)
    user = UserDTO.from_jwt(dados['token'])
    if not user:
        return jsonify({"erro": "Token inválido"}), 400

    db = get_db()
    user_model = db.query(User).filter(User.email == user.email).first()
    user_model.password_hash = hashpw(dados['password'].encode('utf-8'), gensalt()).decode('utf-8')
    user_model.ativo = True
    db.commit()
    return jsonify({"mensagem": "Senha redefinida com sucesso"}), 200

@user_bp.route('/usuario/obter/<id>', methods=['GET'])
def obter(id):
    try:
        db = get_db()
        user = db.query(User).get(id)
        if not user:
            return jsonify({"erro": "Usuário não encontrado"}), 404
        return jsonify({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "ativo": user.ativo,
            "address": user.address,
            "phone": user.phone,
            "cpf": user.cpf,
            "role": user.role,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None
        }), 200
    except Exception as e:
        current_app.logger.error(f"Erro ao obter usuário: {str(e)}")
        return jsonify({"erro": "Erro ao obter usuário"}), 500

@user_bp.route('/usuarios/all', defaults={'page': 1, 'limit': 100}, methods=['GET'])
@user_bp.route('/usuarios/all/<int:page>/<int:limit>', methods=['GET'])
def get_all_users(page, limit):
    try:
        db = get_db()
        total_count = db.query(User).count()
        pages = (total_count + limit - 1) // limit  # Arredonda para cima
        users = db.query(User)\
                  .order_by(User.name)\
                  .limit(limit)\
                  .offset((page - 1) * limit)\
                  .all()
        user_list = [user.to_dict() for user in users]
        return jsonify({"pages": pages, "list": user_list}), 200
    except Exception as e:
        current_app.logger.error(f"Erro ao obter todos os usuários: {str(e)}")
        return jsonify({"erro": "Erro ao obter todos os usuários"}), 500

@user_bp.route('/usuarios/find_by_substring/<substring>', defaults={'page': 1, 'limit': 10}, methods=['GET'])
@user_bp.route('/usuarios/find_by_substring/<substring>/<int:page>/<int:limit>', methods=['GET'])
def find_by_substring(substring, page, limit):
    print(current_app.config["FRONTEND_URL"])
    print("abruama")
    try:
        db = get_db()
        # Remova a normalização do substring
        # substring_normalizado = unidecode(substring).lower()
        total_count = db.query(User)\
                        .filter(User.name.like(f"%{substring}%"))\
                        .count()
        pages = (total_count + limit - 1) // limit
        users = db.query(User)\
                  .filter(User.name.like(f"%{substring}%"))\
                  .order_by(User.name)\
                  .limit(limit)\
                  .offset((page - 1) * limit)\
                  .all()
        user_list = [user.to_dict() for user in users]
        return jsonify({"pages": pages, "list": user_list}), 200
    except Exception as e:
        current_app.logger.error(f"Erro ao buscar usuários por substring: {str(e)}")
        return jsonify({"erro": "Erro ao buscar usuários por substring"}), 500

@user_bp.route('/usuarios/editar/<id>', methods=['PUT'])
def editar(id):
    try:
        dados = request.get_json()
        if not dados:
            return jsonify({"erro": "Nenhum dado de entrada fornecido"}), 400

        db = get_db()
        user = db.query(User).get(id)
        if not user:
            return jsonify({"erro": "Usuário não encontrado"}), 404

        # Verifica se o e-mail já está registrado para outro usuário
        if 'email' in dados and dados['email'] != user.email:
            existing_user_email = db.query(User).filter(User.email == dados['email']).first()
            if existing_user_email:
                return jsonify({"erro": "E-mail já registrado para outro usuário"}), 409

        # Verifica se o CPF já está registrado para outro usuário
        if 'cpf' in dados and dados['cpf'] != user.cpf:
            existing_user_cpf = db.query(User).filter(User.cpf == dados['cpf']).first()
            if existing_user_cpf:
                return jsonify({"erro": "CPF já registrado para outro usuário"}), 409

        user.name = dados.get('name', user.name)
        user.email = dados.get('email', user.email)
        user.phone = dados.get('phone', user.phone)
        user.cpf = dados.get('cpf', user.cpf)
        user.ativo = dados.get('ativo', user.ativo)
        user.role = dados.get('role', user.role)
        user.updated_at = datetime.now()

        address_data = dados.get('address')
        user.address = address_data

        db.commit()
        
        # Serializar o usuário para o formato JSON (incluindo o ID)
        user_dict = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "address": user.address,
            "phone": user.phone,
            "cpf": user.cpf,
            "ativo": user.ativo,
            "role": user.role,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None
        }
        
        return jsonify({"mensagem": "Usuário atualizado com sucesso", "user": user_dict}), 200
    except Exception as e:
        db.rollback()
        current_app.logger.error(f"Erro ao atualizar usuário: {str(e)}")
        return jsonify({"erro": "Erro ao atualizar usuário"}), 500

@user_bp.route('/usuario/deletar/<id>', methods=['DELETE'])
def deletar(id):
    try:
        db = get_db()
        user = db.query(User).get(id)
        if not user:
            return jsonify({"erro": "Usuário não encontrado"}), 404
        db.delete(user)
        db.commit()
        return jsonify({"mensagem": "Usuário deletado com sucesso"}), 200
    except Exception as e:
        db.rollback()
        current_app.logger.error(f"Erro ao deletar usuário: {str(e)}")
        return jsonify({"erro": "Erro ao deletar usuário"}), 500

@user_bp.route('/usuario/limpar_pendentes', methods=['DELETE'])
def limpar_pendentes():
    try:
        db = get_db()
        limite_expiracao = datetime.now() - timedelta(days=30)
        inativos = db.query(User).filter(User.ativo == False, User.created_at < limite_expiracao).all()
        for user in inativos:
            db.delete(user)
        db.commit()
        return jsonify({"mensagem": f"{len(inativos)} registros inativos removidos."}), 200
    except Exception as e:
        db.rollback()
        current_app.logger.error(f"Erro ao limpar usuários inativos: {str(e)}")
        return jsonify({"erro": "Erro ao limpar registros inativos"}), 500


@user_bp.route('/usuario/find_by_cpf/<cpf>', methods=['GET'])
def find_by_cpf(cpf):
    print(cpf)
    try:
        db = get_db()
        user = db.query(User).filter(User.cpf == cpf).first()
        
        print(user)
        if not user:
            return jsonify({"erro": "Usuário não encontrado"}), 404
        return jsonify({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "ativo": user.ativo,
            "address": user.address,
            "phone": user.phone,
            "cpf": user.cpf,
            "role": user.role,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None
        }), 200
    except Exception as e:
        current_app.logger.error(f"Erro ao obter usuário por CPF: {str(e)}")
        return jsonify({"erro": "Erro ao obter usuário por CPF"}), 500
    
    

# Rota para obter dados da dashboard do trabalhador
@user_bp.route('/dashboard/trabalhador/<user_id>', methods=['GET'])
def obter_dados_dashboard_trabalhador(user_id):
    try:
        db = get_db()

        # 1. Obter informações do usuário
        user = db.query(User).get(user_id)
        if not user:
            return jsonify({"erro": "Usuário não encontrado"}), 404

        user_data = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "ativo": user.ativo,
            "address": user.address,
            "phone": user.phone,
            "cpf": user.cpf,
            "role": user.role,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None
        }

        # 2. Obter exames agendados para o usuário
        hoje = datetime.now().date()
        exames_agendados = db.query(Exam).filter(Exam.user_id == user_id, Exam.exam_date >= hoje).all()
        exames_agendados_list = [{
            "id": exame.id,
            "description": exame.description,
            "exam_date": exame.exam_date.isoformat() if exame.exam_date else None,
            "company_id": exame.company_id
        } for exame in exames_agendados]

        # 3. Obter histórico de exames do usuário
        exames_anteriores = db.query(Exam).filter(Exam.user_id == user_id, Exam.exam_date < hoje).all()
        exames_anteriores_list = [{
            "id": exame.id,
            "description": exame.description,
            "exam_date": exame.exam_date.isoformat() if exame.exam_date else None,
            "company_id": exame.company_id,
            "image_uploaded": exame.image_uploaded
        } for exame in exames_anteriores]

        # 4. Calcular estatísticas (total de exames, exames com imagem, etc.)
        total_exames = db.query(Exam).filter(Exam.user_id == user_id).count()
        exames_com_imagem = db.query(Exam).filter(Exam.user_id == user_id, Exam.image_uploaded == True).count()

        return jsonify({
            "user": user_data,
            "exames_agendados": exames_agendados_list,
            "exames_anteriores": exames_anteriores_list,
            "total_exames": total_exames,
            "exames_com_imagem": exames_com_imagem
        }), 200

    except Exception as e:
        current_app.logger.error(f"Erro ao obter dados da dashboard do trabalhador: {str(e)}")
        return jsonify({"erro": "Erro ao obter dados da dashboard do trabalhador"}), 500