from flask import Blueprint, request, jsonify, current_app, url_for
from app.models.company import Company, CompanyDTO
from app import get_db, mail
from flask_mail import Message
from bcrypt import hashpw, gensalt
from datetime import datetime, timedelta, timezone
import ulid
import json  # Importe o módulo json

from app.models.user import User

company_bp = Blueprint('company', __name__)

def enviar_email(para, assunto, template):
    try:
        msg = Message(assunto, recipients=[para], html=template, sender=current_app.config['MAIL_USERNAME'])
        mail.send(msg)
    except Exception as e:
        current_app.logger.error(f"Erro ao enviar e-mail: {str(e)}")
        raise

def enviar_email_verificacao(company_dto: CompanyDTO):
    try:
        token = company_dto.to_jwt()
        confirm_url = url_for('company_blueprint.confirmar', token=token, _external=True)
        html = f'<b>Bem-vindo! Por favor, confirme seu e-mail clicando <a href="{confirm_url}">aqui</a>.</b>'
        assunto = "Por favor, confirme seu e-mail"
        enviar_email(company_dto.email, assunto, html)
    except Exception as e:
        current_app.logger.error(f"Erro ao enviar e-mail de verificação: {str(e)}")
        raise
@company_bp.route('/empresa/reenviaremail/<id>', methods=['GET'])
def reenviaemail(id):
    try:
        db = get_db()
        company = db.query(Company).get(id)
        company_dto = company.to_dto()
        enviar_email_verificacao(company_dto)
        return jsonify({"mensagem": "E-mail de confirmação reenviado com sucesso"}), 200
    except Exception as e:
        current_app.logger.error(f"Erro ao reenviar e-mail de verificação: {str(e)}")
        return jsonify({"erro": "Erro ao reenviar e-mail de verificação"}), 500
    
@company_bp.route('/empresa/registrar', methods=['POST'])
def registrar():
    try:
        dados = request.get_json()
        if not dados:
            return jsonify({"erro": "Nenhum dado de entrada fornecido"}), 400

        # Verifica se o e-mail já está registrado
        db = get_db()

        existing_company = db.query(Company).filter_by(email=dados['email']).first()
        existing_user = db.query(User).filter_by(email=dados['email']).first()
        if existing_company or existing_user:
            return jsonify({"erro": "E-mail já registrado"}), 409

        # Converte o endereço para JSON, se necessário
        address_data = dados.get('address')
        if isinstance(address_data, list):
            address_json = json.dumps(address_data)
        else:
            address_json = address_data  # Mantém como está se já for uma string JSON

        # Cria a empresa com senha nula e inativa
        company = Company(
            name=dados['name'],
            address=address_json,
            phone=dados['phone'],
            cnpj=dados['cnpj'],
            email=dados['email'],
            password_hash=None,  # Senha nula
            ativo=False  # Inativa
        )

        db.add(company)
        db.commit()

        # Envia o e-mail de confirmação
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
        company_dto = CompanyDTO.from_jwt(token)

        if not company_dto:
            return jsonify({"erro": "Token inválido ou expirado"}), 400

        db = get_db()

        # Busca a empresa correspondente
        company = db.query(Company).filter_by(email=company_dto.email).first()
        if not company:
            return jsonify({"erro": "Empresa não encontrada"}), 404

        # Ativa a empresa
        company.ativo = True
        db.commit()

        return jsonify({"mensagem": "Conta confirmada com sucesso!"}), 200
    except Exception as e:
        db.rollback()
        current_app.logger.error(f"Erro ao confirmar e-mail: {str(e)}")
        return jsonify({"erro": "Erro ao confirmar e-mail"}), 500

@company_bp.route('/empresa/definir_senha', methods=['PUT'])
def definir_senha():
    try:
        dados = request.get_json()
        if not dados or 'email' not in dados or 'password' not in dados:
            return jsonify({"erro": "E-mail e senha são necessários"}), 400

        email = dados['email']
        password = dados['password']

        db = get_db()
        company = db.query(Company).filter_by(email=email).first()
        if not company:
            return jsonify({"erro": "Empresa não encontrada"}), 404

        # Verifica se a conta está ativa antes de permitir a definição da senha
        if not company.ativo:
            return jsonify({"erro": "Conta inativa. Confirme o e-mail primeiro."}), 403

        # Define a senha
        company.password_hash = hashpw(password.encode('utf-8'), gensalt()).decode('utf-8')
        db.commit()

        return jsonify({"mensagem": "Senha definida com sucesso!"}), 200
    except Exception as e:
        db.rollback()
        current_app.logger.error(f"Erro ao definir senha: {str(e)}")
        return jsonify({"erro": "Erro ao definir senha"}), 500

@company_bp.route('/empresa/redefinir_senha', methods=['POST'])
def redefinir_senha():
    try:
        dados = request.get_json()
        if not dados or 'email' not in dados:
            return jsonify({"erro": "Nenhum e-mail fornecido"}), 400

        email = dados['email']
        
        db = get_db()
        company = db.query(Company).filter_by(email=email).first()
        
        if not company:
            return jsonify({"erro": "Empresa não encontrada"}), 404

        company_dto = company.to_dto()

        token = company_dto.to_jwt()
        frontend_url = current_app.config['FRONTEND_URL']
        reset_url =  reset_url = f"{frontend_url}/redefine-senha-empresa/{token}"
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
        company_dto = CompanyDTO.from_jwt(token)
   
        if not company_dto:
            return jsonify({"erro": "Token inválido ou expirado"}), 400

        return jsonify({
            "mensagem": "Link de redefinição válido. Por favor, redefina sua senha.",
            "email": company_dto.email
        }), 200
    except Exception as e:
        current_app.logger.error(f"Erro ao processar token de redefinição de senha: {str(e)}")
        return jsonify({"erro": "Erro ao processar token de redefinição de senha"}), 500

@company_bp.route('/empresa/limpar_pendentes', methods=['DELETE'])
def limpar_pendentes():
    try:
        db = get_db()
        # Define o limite de expiração como uma hora atrás
        limite_expiracao = datetime.now(timezone.utc) - timedelta(hours=1)
        # Remove todos os registros expirados
        expirados = db.query(Company).filter(Company.ativo == False, Company.created_at < limite_expiracao).all()
        for company in expirados:
            db.delete(company)
        db.commit()
        return jsonify({"mensagem": f"{len(expirados)} registros expirados removidos."}), 200
    except Exception as e:
        db.rollback()
        current_app.logger.error(f"Erro ao limpar pending_companies: {str(e)}")
        return jsonify({"erro": "Erro ao limpar registros expirados"}), 500

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
            "address": company.address,
            "phone": company.phone,
            "cnpj": company.cnpj,
            "email": company.email,
            "ativo": company.ativo,
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
        # Contar o total de registros que correspondem à substring
        total_count = db.query(Company)\
                        .filter(Company.name.ilike(f"%{substring}%"))\
                        .count()
        # Calcular o número de páginas (arredondando para cima)
        pages = (total_count + limit - 1) // limit

        companies = db.query(Company)\
                      .filter(Company.name.ilike(f"%{substring}%"))\
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

        # Atualiza os campos da empresa com os dados fornecidos
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
        companies = db.query(Company)\
                      .order_by(Company.name)\
                      .limit(limit)\
                      .offset((page - 1) * limit)\
                      .all()
        company_list = [company.to_dict() for company in companies]
        return jsonify(company_list), 200
    except Exception as e:
        current_app.logger.error(f"Erro ao obter todas as empresas: {str(e)}")
        return jsonify({"erro": "Erro ao obter todas as empresas"}), 500