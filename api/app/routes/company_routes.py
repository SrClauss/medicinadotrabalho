from flask import Blueprint, request, jsonify, current_app, url_for
from app.models.company import Company, CompanyDTO
from app import get_db, mail
from flask_mail import Message
from bcrypt import hashpw, gensalt
from datetime import datetime, timedelta, timezone
from sqlalchemy import func
  # Importe o módulo json
import unicodedata
from app.models.user import User
from sqlalchemy import func
from unidecode import unidecode  # Importe a biblioteca unidecode

company_bp = Blueprint('company', __name__)

# Remova a função remover_acentos
# def remover_acentos(texto):
#     """Remove acentos e normaliza o texto para comparação."""
#     texto = texto.lower()
#     return ''.join(c for c in unicodedata.normalize('NFD', texto)
#                    if unicodedata.category(c) != 'Mn')

def enviar_email(para, assunto, template):
    try:
        msg = Message(assunto, recipients=[para], html=template, sender=current_app.config['MAIL_USERNAME'])
        mail.send(msg)
    except Exception as e:
        pass

def enviar_email_verificacao(company_dto: CompanyDTO):
    try:
        token = company_dto.to_jwt()
        frontend_url = current_app.config['FRONTEND_URL']
        confirm_url = f"{frontend_url}/confirmar-email/{token}"
        html = f'<b>Bem-vindo! Por favor, confirme seu e-mail clicando <a href="{confirm_url}">aqui</a>.</b>'
        assunto = "Por favor, confirme seu e-mail"
        enviar_email(company_dto.email, assunto, html)
    except Exception as e:
        pass

@company_bp.route('/empresa/reenviaremail/<id>', methods=['GET'])
def reenviaemail(id):
    try:
        db = get_db()
        company = db.query(Company).get(id)
        if not company:
            return jsonify({"erro": "Empresa não encontrada"}), 404
        company_dto = CompanyDTO.from_model(company)
        enviar_email_verificacao(company_dto)
        return jsonify({"mensagem": "E-mail de confirmação reenviado com sucesso"}), 200
    except Exception as e:
        current_app.logger.error(f"Erro ao reenviar e-mail de confirmação: {str(e)}")
        return jsonify({"erro": "Erro ao reenviar e-mail de confirmação"}), 500
    

@company_bp.route('/empresa/registrar', methods=['POST'])
def registrar():
    try:
        dados = request.get_json()
        if not dados:
            return jsonify({"erro": "Nenhum dado de entrada fornecido"}), 400
        db = get_db()
        # Verifica se o e-mail já está registrado
        existing_company_email = db.query(Company).filter(Company.email == dados['email']).first()
        if existing_company_email:
            return jsonify({"erro": "E-mail já registrado"}), 409
        # Verifica se o CNPJ já está registrado
        existing_company_cnpj = db.query(Company).filter(Company.cnpj == dados['cnpj']).first()
        if existing_company_cnpj:
            return jsonify({"erro": "CNPJ já registrado"}), 409

        address_data = dados.get('address')
        if isinstance(address_data, list):
            address_json = json.dumps(address_data)
        else:
            address_json = address_data

        company = Company(
            name=dados['name'],
            email=dados['email'],
            address=address_json,
            phone=dados['phone'],
            cnpj=dados['cnpj'],
            password_hash="",
            ativo=False,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

        db.add(company)
        db.commit()

        company_dto = CompanyDTO.from_model(company)
        enviar_email_verificacao(company_dto)

        return jsonify({"mensagem": "Verifique seu e-mail para confirmar a conta."}), 201
    except Exception as e:
        db.rollback()
        current_app.logger.error(f"Erro ao registrar empresa: {str(e)}")
        return jsonify({"erro": "Erro ao registrar empresa"}), 500

@company_bp.route('/empresa/confirmar/<token>', methods=['GET'])
def confirmar(token):
    try:
        company = CompanyDTO.from_jwt(token)
    except:
        return jsonify({"erro": "Token inválido"}), 400

    db = get_db()
    company_model = db.query(Company).filter(Company.email == company.email).first()
    if not company_model:
        return jsonify({"erro": "Empresa não encontrada"}), 404

    company_model.ativo = True
    db.commit()
    return jsonify({"mensagem": "E-mail confirmado com sucesso"}), 200

@company_bp.route('/empresa/definir_senha', methods=['PUT'])
def definir_senha():
    try:
        dados = request.get_json()
        if not dados or 'token' not in dados or 'password' not in dados:
            return jsonify({"erro": "Dados de entrada inválidos"}), 400
    except Exception as e:
        return jsonify({"erro": "Erro ao definir senha"}), 500

    try:
        company = CompanyDTO.from_jwt(dados['token'])
    except:
        return jsonify({"erro": "Token inválido"}), 400

    db = get_db()
    company_model = db.query(Company).filter(Company.email == company.email).first()
    company_model.password_hash = hashpw(dados['password'].encode('utf-8'), gensalt()).decode('utf-8')
    db.commit()
    return jsonify({"mensagem": "Senha definida com sucesso"}), 200

@company_bp.route('/empresa/redefinir_senha', methods=['POST'])
def redefinir_senha():
    try:
        dados = request.get_json()
        if not dados or 'email' not in dados:
            return jsonify({"erro": "Nenhum e-mail fornecido"}), 400
        email = dados['email']
        db = get_db()
        company = db.query(Company).filter(Company.email == email).first()
        if not company:
            return jsonify({"erro": "Empresa não encontrada"}), 404

        company_dto = CompanyDTO(
            name=company.name,
            email=company.email,
            address=company.address,
            phone=company.phone,
            cnpj=company.cnpj
        )
        token = company_dto.to_jwt()
        frontend_url = current_app.config['FRONTEND_URL']
        reset_url = f"{frontend_url}/confirmar-redefinicao/{token}"
        html = f'<b>Para redefinir sua senha, clique <a href="{reset_url}">aqui</a>.</b>'
        assunto = "Redefinição de senha"
        enviar_email(company.email, assunto, html)
        return jsonify({"mensagem": "E-mail de redefinição de senha enviado com sucesso."}), 200
    except Exception as e:
        current_app.logger.error(f"Erro ao enviar e-mail de redefinição de senha: {str(e)}")
        return jsonify({"erro": "Erro ao enviar e-mail de redefinição de senha"}), 500

@company_bp.route('/empresa/confirmar_redefinicao/<token>', methods=['GET'])
def confirmar_redefinicao(token):
    try:
        company = CompanyDTO.from_jwt(token)
    except:
        return jsonify({"erro": "Token inválido"}), 400

    db = get_db()
    company_model = db.query(Company).filter(Company.email == company.email).first()
    if not company_model:
        return jsonify({"erro": "Empresa não encontrada"}), 404

    company_model.password_hash = hashpw(dados['password'].encode('utf-8'), gensalt()).decode('utf-8')
    db.commit()
    return jsonify({"mensagem": "Senha redefinida com sucesso"}), 200

@company_bp.route('/empresa/limpar_pendentes', methods=['DELETE'])
def limpar_pendentes():
    try:
        db = get_db()
        limite_expiracao = datetime.now() - timedelta(days=30)
        inativos = db.query(Company).filter(Company.ativo == False, Company.created_at < limite_expiracao).all()
        for company in inativos:
            db.delete(company)
        db.commit()
        return jsonify({"mensagem": f"{len(inativos)} registros inativos removidos."}), 200
    except Exception as e:
        db.rollback()
        current_app.logger.error(f"Erro ao limpar empresas inativas: {str(e)}")
        return jsonify({"erro": "Erro ao limpar registros inativos"}), 500

@company_bp.route('/empresa/obter/<id>', methods=['GET'])
def obter(id):
    try:
        db = get_db()
        company = db.query(Company).get(id)
        if not company:
            return jsonify({"erro": "Empresa não encontrada"}), 404
        return jsonify({
            "id": company.id,
            "name": company.name,
            "email": company.email,
            "ativo": company.ativo,
            "address": company.address,
            "phone": company.phone,
            "cnpj": company.cnpj,
            "created_at": company.created_at.isoformat() if company.created_at else None,
            "updated_at": company.updated_at.isoformat() if company.updated_at else None
        }), 200
    except Exception as e:
        current_app.logger.error(f"Erro ao obter empresa: {str(e)}")
        return jsonify({"erro": "Erro ao obter empresa"}), 500

@company_bp.route('/empresas/find_by_substring/<substring>', defaults={'page': 1, 'limit': 10}, methods=['GET'])
@company_bp.route('/empresas/find_by_substring/<substring>/<int:page>/<int:limit>', methods=['GET'])
def find_by_substring(substring, page, limit):
    try:
        db = get_db()
        # Remova a normalização do substring
        # substring_normalizado = unidecode(substring).lower()
        total_count = db.query(Company)\
                        .filter(Company.name.like(f"%{substring}%"))\
                        .count()
        pages = (total_count + limit - 1) // limit
        companies = db.query(Company)\
                  .filter(Company.name.like(f"%{substring}%"))\
                  .order_by(Company.name)\
                  .limit(limit)\
                  .offset((page - 1) * limit)\
                  .all()
        company_list = [company.to_dict() for company in companies]
        return jsonify({"pages": pages, "list": company_list}), 200
    except Exception as e:
        current_app.logger.error(f"Erro ao buscar empresas por substring: {str(e)}")
        return jsonify({"erro": "Erro ao buscar empresas por substring"}), 500

@company_bp.route('/empresas/editar/<id>', methods=['PUT'])
def editar(id):
    try:
        dados = request.get_json()
        if not dados:
            return jsonify({"erro": "Nenhum dado de entrada fornecido"}), 400

        db = get_db()
        company = db.query(Company).get(id)
        if not company:
            return jsonify({"erro": "Empresa não encontrada"}), 404

        # Verifica se o e-mail já está registrado para outra empresa
        if 'email' in dados and dados['email'] != company.email:
            existing_company_email = db.query(Company).filter(Company.email == dados['email']).first()
            if existing_company_email:
                return jsonify({"erro": "E-mail já registrado para outra empresa"}), 409

        # Verifica se o CNPJ já está registrado para outra empresa
        if 'cnpj' in dados and dados['cnpj'] != company.cnpj:
            existing_company_cnpj = db.query(Company).filter(Company.cnpj == dados['cnpj']).first()
            if existing_company_cnpj:
                return jsonify({"erro": "CNPJ já registrado para outra empresa"}), 409

        company.name = dados.get('name', company.name)
        company.email = dados.get('email', company.email)
        company.phone = dados.get('phone', company.phone)
        company.cnpj = dados.get('cnpj', company.cnpj)
        company.ativo = dados.get('ativo', company.ativo)
        company.updated_at = datetime.now()

        address_data = dados.get('address')
        if isinstance(address_data, list):
            address_json = json.dumps(address_data)
        else:
            address_json = address_data
        company.address = address_json

        db.commit()
        return jsonify({"mensagem": "Empresa atualizada com sucesso"}), 200
    except Exception as e:
        db.rollback()
        current_app.logger.error(f"Erro ao atualizar empresa: {str(e)}")
        return jsonify({"erro": "Erro ao atualizar empresa"}), 500

@company_bp.route('/empresa/deletar/<id>', methods=['DELETE'])
def deletar(id):
    try:
        db = get_db()
        company = db.query(Company).get(id)
        if not company:
            return jsonify({"erro": "Empresa não encontrada"}), 404
        db.delete(company)
        db.commit()
        return jsonify({"mensagem": "Empresa deletada com sucesso"}), 200
    except Exception as e:
        db.rollback()
        current_app.logger.error(f"Erro ao deletar empresa: {str(e)}")
        return jsonify({"erro": "Erro ao deletar empresa"}), 500

@company_bp.route('/empresas/all', defaults={'page': 1, 'limit': 100}, methods=['GET'])
@company_bp.route('/empresas/all/<int:page>/<int:limit>', methods=['GET'])
def get_all_companies(page, limit):
    try:
        db = get_db()
        total_count = db.query(Company).count()
        pages = (total_count + limit - 1) // limit  # Arredonda para cima
        companies = db.query(Company)\
                  .order_by(Company.name)\
                  .limit(limit)\
                  .offset((page - 1) * limit)\
                  .all()
        company_list = [company.to_dict() for company in companies]
        return jsonify({"pages": pages, "list": company_list}), 200
    except Exception as e:
        current_app.logger.error(f"Erro ao obter todas as empresas: {str(e)}")