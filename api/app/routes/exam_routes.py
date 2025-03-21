from flask import Blueprint, render_template, request, jsonify, current_app
from app.models.exam import Exam
from app.models.user import User
from app import get_db
from datetime import datetime
import ulid
from sqlalchemy import distinct

exam_bp = Blueprint('exam', __name__)

@exam_bp.route('/exames', methods=['POST'])
def criar_exame():
    try:
        db = get_db()
        data = request.get_json()

        # Validação dos dados (adicione validações mais robustas conforme necessário)
        if not data or 'description' not in data or 'user_id' not in data or 'company_id' not in data:
            return jsonify({"erro": "Dados incompletos"}), 400

        # Extrai a data do exame do corpo da requisição
        exam_date_str = data.get('exam_date')
        exam_date = None
        if exam_date_str:
            try:
                exam_date = datetime.strptime(exam_date_str, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"erro": "Formato de data inválido. Use YYYY-MM-DD."}), 400

        novo_exame = Exam(
            id = str(ulid.new()),
            description=data['description'],
            user_id=data['user_id'],
            company_id=data['company_id'],
            exam_date=exam_date,
            image_uploaded=False,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

        db.add(novo_exame)
        db.commit()

        return jsonify({"mensagem": "Exame criado com sucesso", "id": novo_exame.id}), 201

    except Exception as e:
        db.rollback()
        current_app.logger.error(f"Erro ao criar exame: {str(e)}")
        return jsonify({"erro": "Erro ao criar exame"}), 500

@exam_bp.route('/exames/obter/<id>', methods=['GET'])
def obter(id):
    try:
        db = get_db()
        exam = db.query(Exam).get(id)

        if not exam:
            return jsonify({"erro": "Exame não encontrado"}), 404

        exam_data = {
            "id": exam.id,
            "description": exam.description,
            "image_uploaded": exam.image_uploaded,
            "user_id": exam.user_id,
            "company_id": exam.company_id,
            "created_at": exam.created_at.isoformat(),
            "updated_at": exam.updated_at.isoformat(),
            "exam_date": exam.exam_date.isoformat() if exam.exam_date else None
        }

        return jsonify({"exam": exam_data}), 200

    except Exception as e:
        current_app.logger.error(f"Erro ao obter exame: {str(e)}")
        return jsonify({"erro": "Erro ao obter exame"}), 500

@exam_bp.route('/exames/atualizar/<id>', methods=['PUT'])
def atualizar(id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({"erro": "Nenhum dado de entrada fornecido"}), 400

        db = get_db()
        exam = db.query(Exam).get(id)

        if not exam:
            return jsonify({"erro": "Exame não encontrado"}), 404

        # Atualiza os campos (pode ser feito de forma mais dinâmica)
        exam.description = data.get('description', exam.description)
        exam.image_uploaded = data.get('image_uploaded', exam.image_uploaded)
        exam.company_id = data.get('company_id', exam.company_id)
        exam.user_id = data.get('user_id', exam.user_id)
        exam.exam_date = datetime.strptime(data.get('exam_date'), '%Y-%m-%d').date() if data.get('exam_date') else exam.exam_date

        db.commit()

        return jsonify({"mensagem": "Exame atualizado com sucesso"}), 200
    except Exception as e:
        db.rollback()
        current_app.logger.error(f"Erro ao atualizar exame: {str(e)}")
        return jsonify({"erro": "Erro ao atualizar exame"}), 500

@exam_bp.route('/exames/deletar/<id>', methods=['DELETE'])
def deletar(id):
    try:
        db = get_db()
        exam = db.query(Exam).get(id)

        if not exam:
            return jsonify({"erro": "Exame não encontrado"}), 404

        db.delete(exam)
        db.commit()

        return jsonify({"mensagem": "Exame excluído com sucesso"}), 200
    except Exception as e:
        db.rollback()
        current_app.logger.error(f"Erro ao excluir exame: {str(e)}")
        return jsonify({"erro": "Erro ao excluir exame"}), 500

@exam_bp.route('/exames/listar', defaults={'page': 1, 'limit': 10}, methods=['GET'])
@exam_bp.route('/exames/listar/<int:page>/<int:limit>', methods=['GET'])
def listar(page, limit):
    try:
        db = get_db()
        total_count = db.query(Exam).count()
        pages = (total_count + limit - 1) // limit
        exams = db.query(Exam)\
                  .order_by(Exam.created_at)\
                  .limit(limit)\
                  .offset((page - 1) * limit)\
                  .all()
        exam_list = []
        for exam in exams:
            exam_list.append({
                "id": exam.id,
                "description": exam.description,
                "image_uploaded": exam.image_uploaded,
                "company_id": exam.company_id,
                "user_id": exam.user_id,
                "created_at": exam.created_at.isoformat(),
                "updated_at": exam.updated_at.isoformat(),
                "exam_date": exam.exam_date.isoformat() if exam.exam_date else None
            })
        return jsonify({"pages": pages, "list": exam_list}), 200
    except Exception as e:
        current_app.logger.error(f"Erro ao listar exames: {str(e)}")
        return jsonify({"erro": "Erro ao listar exames"}), 500

@exam_bp.route('/exames/listar_por_usuario/<user_id>', defaults={'page': 1, 'limit': 10}, methods=['GET'])
@exam_bp.route('/exames/listar_por_usuario/<user_id>/<int:page>/<int:limit>', methods=['GET'])
def listar_por_usuario(user_id, page, limit):
    try:
        db = get_db()
        total_count = db.query(Exam).filter(Exam.user_id == user_id).count()
        pages = (total_count + limit - 1) // limit
        exams = db.query(Exam)\
                  .filter(Exam.user_id == user_id)\
                  .order_by(Exam.created_at)\
                  .limit(limit)\
                  .offset((page - 1) * limit)\
                  .all()
        exam_list = []
        for exam in exams:
            exam_list.append({
                "id": exam.id,
                "description": exam.description,
                "image_uploaded": exam.image_uploaded,
                "company_id": exam.company_id,
                "user_id": exam.user_id,
                "created_at": exam.created_at.isoformat(),
                "updated_at": exam.updated_at.isoformat(),
                "exam_date": exam.exam_date.isoformat() if exam.exam_date else None
            })
        return jsonify({"pages": pages, "list": exam_list}), 200
    except Exception as e:
        current_app.logger.error(f"Erro ao listar exames por usuário: {str(e)}")
        return jsonify({"erro": "Erro ao listar exames por usuário"}), 500

@exam_bp.route('/exames/listar_por_empresa/<company_id>', defaults={'page': 1, 'limit': 10}, methods=['GET'])
@exam_bp.route('/exames/listar_por_empresa/<company_id>/<int:page>/<int:limit>', methods=['GET'])
def listar_por_empresa(company_id, page, limit):
    try:
        db = get_db()
        total_count = db.query(Exam).filter(Exam.company_id == company_id).count()
        pages = (total_count + limit - 1) // limit
        exams = db.query(Exam)\
                  .filter(Exam.company_id == company_id)\
                  .order_by(Exam.created_at)\
                  .limit(limit)\
                  .offset((page - 1) * limit)\
                  .all()
        exam_list = []
        for exam in exams:
            exam_list.append({
                "id": exam.id,
                "description": exam.description,
                "image_uploaded": exam.image_uploaded,
                "company_id": exam.company_id,
                "user_id": exam.user_id,
                "created_at": exam.created_at.isoformat(),
                "updated_at": exam.updated_at.isoformat(),
                "exam_date": exam.exam_date.isoformat() if exam.exam_date else None
            })
        return jsonify({"pages": pages, "list": exam_list}), 200
    except Exception as e:
        current_app.logger.error(f"Erro ao listar exames por empresa: {str(e)}")
        return jsonify({"erro": "Erro ao listar exames por empresa"}), 500

#filtrar por data lembrando que base tem um campo created_at
@exam_bp.route('/exames/listar_por_data/<data>', defaults={'page': 1, 'limit': 10}, methods=['GET'])
@exam_bp.route('/exames/listar_por_data/<data>/<int:page>/<int:limit>', methods=['GET'])
def listar_por_data(data, page, limit):
    try:
        db = get_db()
        total_count = db.query(Exam).filter(Exam.created_at == data).count()
        pages = (total_count + limit - 1) // limit
        exams = db.query(Exam)\
                  .filter(Exam.created_at == data)\
                  .order_by(Exam.created_at)\
                  .limit(limit)\
                  .offset((page - 1) * limit)\
                  .all()
        exam_list = []
        for exam in exams:
            exam_list.append({
                "id": exam.id,
                "description": exam.description,
                "image_uploaded": exam.image_uploaded,
                "company_id": exam.company_id,
                "user_id": exam.user_id,
                "created_at": exam.created_at.isoformat(),
                "updated_at": exam.updated_at.isoformat(),
                "exam_date": exam.exam_date.isoformat() if exam.exam_date else None
            })
        return jsonify({"pages": pages, "list": exam_list}), 200
    except Exception as e:
        current_app.logger.error(f"Erro ao listar exames por data: {str(e)}")
        return jsonify({"erro": "Erro ao listar exames por data"}), 500

#filtrar por data e empresa, e outro filtro por data e usuario
@exam_bp.route('/exames/listar_por_data_empresa/<data>/<company_id>', defaults={'page': 1, 'limit': 10}, methods=['GET'])
@exam_bp.route('/exames/listar_por_data_empresa/<data>/<company_id>/<int:page>/<int:limit>', methods=['GET'])
def listar_por_data_empresa(data, company_id, page, limit):
    try:
        db = get_db()
        total_count = db.query(Exam).filter(Exam.created_at == data, Exam.company_id == company_id).count()
        pages = (total_count + limit - 1) // limit
        exams = db.query(Exam)\
                  .filter(Exam.created_at == data, Exam.company_id == company_id)\
                  .order_by(Exam.created_at)\
                  .limit(limit)\
                  .offset((page - 1) * limit)\
                  .all()
        exam_list = []
        for exam in exams:
            exam_list.append({
                "id": exam.id,
                "description": exam.description,
                "image_uploaded": exam.image_uploaded,
                "company_id": exam.company_id,
                "user_id": exam.user_id,
                "created_at": exam.created_at.isoformat(),
                "updated_at": exam.updated_at.isoformat(),
                "exam_date": exam.exam_date.isoformat() if exam.exam_date else None
            })
        return jsonify({"pages": pages, "list": exam_list}), 200
    except Exception as e:
        current_app.logger.error(f"Erro ao listar exames por data e empresa: {str(e)}")
        return jsonify({"erro": "Erro ao listar exames por data e empresa"}), 500

@exam_bp.route('/exames/listar_por_data_usuario/<data>/<user_id>', defaults={'page': 1, 'limit': 10}, methods=['GET'])
@exam_bp.route('/exames/listar_por_data_usuario/<data>/<user_id>/<int:page>/<int:limit>', methods=['GET'])
def listar_por_data_usuario(data, user_id, page, limit):
    try:
        db = get_db()
        total_count = db.query(Exam).filter(Exam.created_at == data, Exam.user_id == user_id).count()
        pages = (total_count + limit - 1) // limit
        exams = db.query(Exam)\
                  .filter(Exam.created_at == data, Exam.user_id == user_id)\
                  .order_by(Exam.created_at)\
                  .limit(limit)\
                  .offset((page - 1) * limit)\
                  .all()
        exam_list = []
        for exam in exams:
            exam_list.append({
                "id": exam.id,
                "description": exam.description,
                "image_uploaded": exam.image_uploaded,
                "company_id": exam.company_id,
                "user_id": exam.user_id,
                "created_at": exam.created_at.isoformat(),
                "updated_at": exam.updated_at.isoformat(),
                "exam_date": exam.exam_date.isoformat() if exam.exam_date else None
            })
        return jsonify({"pages": pages, "list": exam_list}), 200
    except Exception as e:
        current_app.logger.error(f"Erro ao listar exames por data e usuário: {str(e)}")
        return jsonify({"erro": "Erro ao listar exames por data e usuário"}), 500

@exam_bp.route('/exames/listar_por_data_usuario_empresa/<data>/<user_id>/<company_id>',  defaults={'page': 1, 'limit': 10}, methods=['GET'])
@exam_bp.route('/exames/listar_por_data_usuario_empresa/<data>/<user_id>/<company_id>/<int:page>/<int:limit>', methods=['GET'])
def listar_por_data_usuario_empresa(data, user_id, company_id, page, limit):
    try:
        db = get_db()
        total_count = db.query(Exam).filter(Exam.created_at == data, Exam.user_id == user_id, Exam.company_id == company_id).count()
        pages = (total_count + limit - 1) // limit
        exams = db.query(Exam)\
                  .filter(Exam.created_at == data, Exam.user_id == user_id, Exam.company_id == company_id)\
                  .order_by(Exam.created_at)\
                  .limit(limit)\
                  .offset((page - 1) * limit)\
                  .all()
        exam_list = []
        for exam in exams:
            exam_list.append({
                "id": exam.id,
                "description": exam.description,
                "image_uploaded": exam.image_uploaded,
                "company_id": exam.company_id,
                "user_id": exam.user_id,
                "created_at": exam.created_at.isoformat(),
                "updated_at": exam.updated_at.isoformat(),
                "exam_date": exam.exam_date.isoformat() if exam.exam_date else None
            })
        return jsonify({"pages": pages, "list": exam_list}), 200
    except Exception as e:
        current_app.logger.error(f"Erro ao listar exames por data, usuário e empresa: {str(e)}")
        return jsonify({"erro": "Erro ao listar exames por data, usuário e empresa"}), 500

# Rota para atualizar o status da imagem para "uploaded"
@exam_bp.route('/exames/marcar_imagem_carregada/<id>', methods=['PUT'])
def marcar_imagem_carregada(id):
    try:
        db = get_db()
        exam = db.query(Exam).get(id)
        
        if not exam:
            return jsonify({"erro": "Exame não encontrado"}), 404
            
        exam.image_uploaded = True
        db.commit()
        
        return jsonify({"mensagem": "Status de imagem atualizado com sucesso"}), 200
    except Exception as e:
        db.rollback()
        current_app.logger.error(f"Erro ao atualizar status da imagem: {str(e)}")
        return jsonify({"erro": "Erro ao atualizar status da imagem"}), 500

@exam_bp.route('/exames/usuarios_por_empresa/<company_id>', methods=['GET'])
def listar_usuarios_por_empresa(company_id):
    try:
        db = get_db()

        # Consulta para obter os IDs de usuários distintos que têm exames com a empresa especificada
        user_ids = db.query(distinct(Exam.user_id)).filter(Exam.company_id == company_id).all()

        # Extrair os IDs de usuário da lista de tuplas
        user_ids_list = [user_id[0] for user_id in user_ids]

        # Consulta para obter os usuários com base nos IDs
        users = db.query(User).filter(User.id.in_(user_ids_list)).all()

        # Serializar os dados dos usuários
        user_list = []
        for user in users:
            user_list.append({
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "cpf": user.cpf,
                "address": user.address,
                "phone": user.phone,
                "ativo": user.ativo,
                "role": user.role,
                "created_at": user.created_at.isoformat(),
                "updated_at": user.updated_at.isoformat()
            })

        return jsonify(user_list), 200

    except Exception as e:
        current_app.logger.error(f"Erro ao listar usuários por empresa: {str(e)}")
        return jsonify({"erro": "Erro ao listar usuários por empresa"}), 500

@exam_bp.route('/exames/criar_em_lote', methods=['POST'])
def criar_exames_em_lote():
    try:
        db = get_db()
        data = request.get_json()

        # Validação dos dados
        if not data or 'company_id' not in data or 'users' not in data or 'description' not in data or 'exam_date' not in data:
            return jsonify({"erro": "Dados incompletos"}), 400

        company_id = data['company_id']
        users = data['users']
        description = data['description']
        exam_date_str = data['exam_date']
        
        # Validar que users é uma lista não vazia
        if not isinstance(users, list) or len(users) == 0:
            return jsonify({"erro": "Nenhum usuário especificado"}), 400
        
        # Converter a data
        try:
            exam_date = datetime.strptime(exam_date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"erro": "Formato de data inválido. Use YYYY-MM-DD."}), 400
        
        # Criar exames para cada usuário
        created_exams = []
        for user_id in users:
            # Verificar se o usuário existe
            user = db.query(User).get(user_id)
            if not user:
                continue  # Pular usuários que não existem
                
            # Criar novo exame
            novo_exame = Exam(
                id=str(ulid.new()),
                description=description,
                user_id=user_id,
                company_id=company_id,
                exam_date=exam_date,
                image_uploaded=False,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            
            db.add(novo_exame)
            created_exams.append(novo_exame.id)
        
        # Commit das mudanças
        db.commit()
        
        return jsonify({
            "mensagem": "Exames criados com sucesso",
            "exams_created": len(created_exams),
            "exam_ids": created_exams
        }), 201
    
    except Exception as e:
        db.rollback()
        current_app.logger.error(f"Erro ao criar exames em lote: {str(e)}")
        return jsonify({"erro": f"Erro ao criar exames em lote: {str(e)}"}), 500