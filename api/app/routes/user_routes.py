from flask import Blueprint, request, jsonify, current_app
import jwt
from app.models.user import User, UserDTO
from app import get_db, mail
from flask_mail import Message
from bcrypt import hashpw, gensalt
import json
from datetime import datetime, timedelta
from sqlalchemy import func
import unicodedata
from unidecode import unidecode  # Importe a biblioteca unidecode

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
        if isinstance(address_data, list):
            address_json = json.dumps(address_data)
        else:
            address_json = address_data

        user = User(
            name=dados['name'],
            email=dados['email'],
            address=address_json,
            phone=dados['phone'],
            cpf=dados['cpf'],
            password_hash="",
            ativo=False,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

        db.add(user)
        db.commit()

        user_dto = UserDTO.from_model(user)
        enviar_email_verificacao(user_dto)

        return jsonify({"mensagem": "Verifique seu e-mail para confirmar a conta."}), 201
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
        if isinstance(address_data, list):
            address_json = json.dumps(address_data)
        else:
            address_json = address_data
        user.address = address_json

        db.commit()
        return jsonify({"mensagem": "Usuário atualizado com sucesso"}), 200
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