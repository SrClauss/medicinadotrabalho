from flask import Blueprint, request, jsonify, current_app
from app.models.exam import Exam
from app.models.user import User
from app.models.company import Company
from app import get_db
from datetime import datetime, timedelta, date
from sqlalchemy import distinct, func
import ulid
import os
from werkzeug.utils import secure_filename
from flask_mail import Message
import shutil
from app import mail  # Importar o objeto mail configurado no __init__.py
from flask import send_from_directory
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
    

# Rota para listar exames por empresa entre duas datas (recebendo parâmetros via query string)
@exam_bp.route('/exames/listar_por_empresa_e_datas', methods=['GET'])
def listar_por_empresa_e_datas():
    try:
        db = get_db()
        data = request.args  # Obter os dados da query string

        company_id = data.get('company_id')
        data_inicial_str = data.get('data_inicial')
        data_final_str = data.get('data_final')

        # Definir datas padrão
        hoje = datetime.today().date()
        data_inicial = datetime.strptime(data_inicial_str, '%Y-%m-%d').date() if data_inicial_str else hoje
        data_final = datetime.strptime(data_final_str, '%Y-%m-%d').date() if data_final_str else hoje + timedelta(days=3650)  # Hoje + 10 anos

        # Validar se company_id foi fornecido
        if not company_id:
            return jsonify({"erro": "company_id é obrigatório"}), 400

        # Construir a query
        query = db.query(Exam).filter(
            Exam.company_id == company_id,
            Exam.exam_date >= data_inicial,
            Exam.exam_date <= data_final
        )

        # Executar a query
        exames = query.all()

        # Serializar os resultados
        exam_list = []
        for exam in exames:
            # Buscar informações do usuário
            user = db.query(User).get(exam.user_id)
            user_data = None
            if user:
                user_data = {
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
                }

            exam_list.append({
                "id": exam.id,
                "description": exam.description,
                "image_uploaded": exam.image_uploaded,
                "company_id": exam.company_id,
                "user": user_data,  # Adiciona os dados do usuário
                "created_at": exam.created_at.isoformat(),
                "updated_at": exam.updated_at.isoformat(),
                "exam_date": exam.exam_date.isoformat() if exam.exam_date else None
            })

        return jsonify({"list": exam_list}), 200

    except ValueError as ve:
        return jsonify({"erro": f"Erro ao processar datas: {str(ve)}. Use o formato YYYY-MM-DD."}), 400
    except Exception as e:
        current_app.logger.error(f"Erro ao listar exames por empresa e datas: {str(e)}")
        return jsonify({"erro": "Erro ao listar exames por empresa e datas"}), 500


@exam_bp.route('/dashboard/dados', methods=['GET'])
def obter_dados_dashboard():
    try:
        db = get_db()
        hoje = date.today()
        
        # 1. Exames agendados para hoje
        exames_hoje = db.query(Exam).filter(Exam.exam_date == hoje).all()
        exames_hoje_list = [{
            "id": exame.id,
            "user_id": exame.user_id,
            "company_id": exame.company_id,
            "exam_date": exame.exam_date.isoformat(),
            "description": exame.description,
            "created_at": exame.created_at.isoformat() if exame.created_at else None,
            "updated_at": exame.updated_at.isoformat() if exame.updated_at else None,
            "image_uploaded": exame.image_uploaded
        } for exame in exames_hoje]
        
        # 2. Exames agendados por dia para os próximos 5 dias
        exames_por_dia = {}
        for i in range(5):
            data = hoje + timedelta(days=i)
            contagem = db.query(Exam).filter(Exam.exam_date == data).count()
            exames_por_dia[data.isoformat()] = contagem
        
        # 3. Empresas com mais exames
        empresas_mais_exames = db.query(Company.id, Company.name, func.count(Exam.id).label('total'))\
            .join(Exam, Company.id == Exam.company_id)\
            .group_by(Company.id, Company.name)\
            .order_by(func.count(Exam.id).desc())\
            .limit(4)\
            .all()
        
        empresas_list = [{"id": empresa.id, "name": empresa.name, "total": empresa.total} 
                           for empresa in empresas_mais_exames]
        
        # 4. Exames recentes
        exames_recentes = db.query(Exam).order_by(Exam.created_at.desc()).limit(10).all()
        exames_recentes_list = [{
            "id": exame.id,
            "user_id": exame.user_id,
            "company_id": exame.company_id,
            "exam_date": exame.exam_date.isoformat(),
            "description": exame.description,
            "created_at": exame.created_at.isoformat() if exame.created_at else None,
            "updated_at": exame.updated_at.isoformat() if exame.updated_at else None,
            "image_uploaded": exame.image_uploaded
        } for exame in exames_recentes]
        
        # Retorna todos os dados em um único objeto JSON
        return jsonify({
            "examesHoje": exames_hoje_list,
            "examesPorDia": exames_por_dia,
            "empresasComMaisExames": empresas_list,
            "examesRecentes": exames_recentes_list
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Erro ao obter dados da dashboard: {str(e)}")
        return jsonify({"erro": "Erro ao obter dados da dashboard"}), 500
@exam_bp.route('/exames/notificar_exame_pronto/<id>', methods=['POST'])
def notificar_exame_pronto(id):
    try:
        db = get_db()
        
        # 1. Obter o exame pelo ID
        exame = db.query(Exam).get(id)
        if not exame:
            return jsonify({"erro": "Exame não encontrado"}), 404
            
        # 2. Obter informações do usuário e da empresa
        usuario = db.query(User).get(exame.user_id)
        empresa = db.query(Company).get(exame.company_id)
        
        if not usuario or not empresa:
            return jsonify({"erro": "Usuário ou empresa não encontrados"}), 404
            
        # 3. Verificar se a imagem foi carregada
        if not exame.image_uploaded:
            return jsonify({"erro": "Este exame não possui imagem carregada"}), 400
            
        # 4. Localizar imagens relacionadas ao exame
        imagens = []
        upload_folder = current_app.config['UPLOAD_FOLDER']
        for filename in os.listdir(upload_folder):
            if filename.startswith(f"{exame.id}"):
                imagens.append(filename)
                
        if not imagens:
            return jsonify({"erro": "Nenhuma imagem encontrada para este exame"}), 404
            
        # 5. Renomear as imagens com um formato mais amigável
        data_formatada = exame.exam_date.strftime("%d-%m-%Y") if exame.exam_date else datetime.now().strftime("%d-%m-%Y")
        arquivos_renomeados = []
        for i, imagem in enumerate(imagens):
            extensao = os.path.splitext(imagem)[1]
            novo_nome = f"{usuario.name.replace(' ', '_')}_{empresa.name.replace(' ', '_')}_{data_formatada}_{i+1}{extensao}"
            novo_nome = secure_filename(novo_nome)
            caminho_antigo = os.path.join(upload_folder, imagem)
            caminho_novo = os.path.join(upload_folder, novo_nome)
            # Criar uma cópia para manter o arquivo original
            shutil.copy2(caminho_antigo, caminho_novo)
            arquivos_renomeados.append(novo_nome)
            
        # 6. Preparar e enviar e-mail para o usuário
        assunto_usuario = f"Seu exame está pronto - {data_formatada}"
        corpo_usuario = f"""
        <html>
            <body>
                <h2>Olá, {usuario.name}!</h2>
                <p>Seu exame realizado na empresa <b>{empresa.name}</b> em <b>{data_formatada}</b> está pronto.</p>
                <p>Descrição do exame: <b>{exame.description}</b></p>
                <p>Entre em contato com a empresa para mais informações ou para buscar o resultado completo.</p>
                <p>Obrigado!</p>
            </body>
        </html>
        """
        
        # 7. Preparar e enviar e-mail para a empresa
        assunto_empresa = f"Exame de {usuario.name} está pronto - {data_formatada}"
        corpo_empresa = f"""
        <html>
            <body>
                <h2>Olá, {empresa.name}!</h2>
                <p>O exame do funcionário <b>{usuario.name}</b> realizado em <b>{data_formatada}</b> está pronto.</p>
                <p>Descrição do exame: <b>{exame.description}</b></p>
                <p>As imagens foram processadas e estão disponíveis no sistema.</p>
                <p>Entre em contato com o funcionário para informá-lo sobre o resultado.</p>
            </body>
        </html>
        """
        
        try:
            # Enviar e-mail para o usuário
            msg_usuario = Message(
                assunto_usuario,
                recipients=[usuario.email],
                html=corpo_usuario,
                sender=current_app.config['MAIL_USERNAME']
            )
            for nome_arquivo in arquivos_renomeados:
                with open(os.path.join(upload_folder, nome_arquivo), 'rb') as arquivo:
                    msg_usuario.attach(nome_arquivo, 'image/jpeg', arquivo.read())
            mail.send(msg_usuario)
            
            # Enviar e-mail para a empresa
            msg_empresa = Message(
                assunto_empresa,
                recipients=[empresa.email],
                html=corpo_empresa,
                sender=current_app.config['MAIL_USERNAME']
            )
            for nome_arquivo in arquivos_renomeados:
                with open(os.path.join(upload_folder, nome_arquivo), 'rb') as arquivo:
                    msg_empresa.attach(nome_arquivo, 'image/jpeg', arquivo.read())
            mail.send(msg_empresa)
            
        except Exception as e:
            current_app.logger.error(f"Erro ao enviar e-mails: {str(e)}")
            return jsonify({"erro": f"Erro ao enviar e-mails: {str(e)}"}), 500
        
        # 8. Atualizar o status do exame (opcional)
        exame.updated_at = datetime.now()
        db.commit()
        
        return jsonify({
            "mensagem": "Notificações enviadas com sucesso",
            "emails_enviados": [usuario.email, empresa.email],
            "arquivos": arquivos_renomeados
        }), 200
        
    except Exception as e:
        if 'db' in locals():
            db.rollback()
        current_app.logger.error(f"Erro ao processar notificação de exame: {str(e)}")
        return jsonify({"erro": f"Erro ao processar notificação de exame: {str(e)}"}), 500
    
# Rota para listar exames entregues por empresa
@exam_bp.route('/exames/entregues_por_empresa/<company_id>', methods=['GET'])
def listar_exames_entregues_por_empresa(company_id):
    """
    Lista todos os exames entregues (com imagens carregadas) de uma empresa.
    """
    try:
        db = get_db()
        exames = db.query(Exam).filter(Exam.company_id == company_id, Exam.image_uploaded == True).all()

        # Serializar os exames
        exam_list = []
        for exam in exames:
            user = db.query(User).get(exam.user_id)
            user_data = {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "cpf": user.cpf,
                "phone": user.phone
            } if user else None

            exam_list.append({
                "id": exam.id,
                "description": exam.description,
                "exam_date": exam.exam_date.isoformat() if exam.exam_date else None,
                "created_at": exam.created_at.isoformat(),
                "updated_at": exam.updated_at.isoformat(),
                "user": user_data
            })

        return jsonify({"list": exam_list}), 200

    except Exception as e:
        current_app.logger.error(f"Erro ao listar exames entregues por empresa: {str(e)}")
        return jsonify({"erro": "Erro ao listar exames entregues por empresa"}), 500


# Rota para download de imagens de exames
@exam_bp.route('/exames/download_imagens/<exam_id>', methods=['GET'])
def download_imagens_exame(exam_id):
    """
    Permite o download das imagens relacionadas a um exame.
    """
    try:
        db = get_db()
        exam = db.query(Exam).get(exam_id)

        if not exam:
            return jsonify({"erro": "Exame não encontrado"}), 404

        if not exam.image_uploaded:
            return jsonify({"erro": "Nenhuma imagem carregada para este exame"}), 400

        # Localizar imagens relacionadas ao exame
        upload_folder = current_app.config['UPLOAD_FOLDER']
        imagens = [
            filename for filename in os.listdir(upload_folder)
            if filename.startswith(f"{exam.id}")
        ]

        if not imagens:
            return jsonify({"erro": "Nenhuma imagem encontrada para este exame"}), 404

        # Compactar as imagens em um arquivo ZIP
        zip_filename = f"exame_{exam.id}_imagens.zip"
        zip_path = os.path.join(upload_folder, zip_filename)

        with shutil.ZipFile(zip_path, 'w') as zipf:
            for imagem in imagens:
                zipf.write(os.path.join(upload_folder, imagem), arcname=imagem)

        # Enviar o arquivo ZIP para download
        return send_from_directory(upload_folder, zip_filename, as_attachment=True)

    except Exception as e:
        current_app.logger.error(f"Erro ao fazer download das imagens do exame: {str(e)}")
        return jsonify({"erro": "Erro ao fazer download das imagens do exame"}), 500


# Rota para estatísticas de exames por empresa
@exam_bp.route('/exames/estatisticas_por_empresa/<company_id>', methods=['GET'])
def estatisticas_exames_por_empresa(company_id):
    """
    Retorna estatísticas de exames para uma empresa.
    """
    try:
        db = get_db()

        total_exames = db.query(Exam).filter(Exam.company_id == company_id).count()
        exames_entregues = db.query(Exam).filter(Exam.company_id == company_id, Exam.image_uploaded == True).count()
        exames_pendentes = total_exames - exames_entregues

        return jsonify({
            "total_exames": total_exames,
            "exames_entregues": exames_entregues,
            "exames_pendentes": exames_pendentes
        }), 200

    except Exception as e:
        current_app.logger.error(f"Erro ao obter estatísticas de exames por empresa: {str(e)}")
        return jsonify({"erro": "Erro ao obter estatísticas de exames por empresa"}), 500


# Rota para buscar exames por data
@exam_bp.route('/exames/filtrar_por_data/<company_id>', methods=['GET'])
def filtrar_exames_por_data(company_id):
    """
    Filtra exames de uma empresa por intervalo de datas.
    """
    try:
        db = get_db()
        data_inicial = request.args.get('data_inicial')
        data_final = request.args.get('data_final')

        if not data_inicial or not data_final:
            return jsonify({"erro": "Datas inicial e final são obrigatórias"}), 400

        data_inicial = datetime.strptime(data_inicial, '%Y-%m-%d').date()
        data_final = datetime.strptime(data_final, '%Y-%m-%d').date()

        exames = db.query(Exam).filter(
            Exam.company_id == company_id,
            Exam.exam_date >= data_inicial,
            Exam.exam_date <= data_final
        ).all()

        # Serializar os exames
        exam_list = []
        for exam in exames:
            user = db.query(User).get(exam.user_id)
            user_data = {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "cpf": user.cpf,
                "phone": user.phone
            } if user else None

            exam_list.append({
                "id": exam.id,
                "description": exam.description,
                "exam_date": exam.exam_date.isoformat() if exam.exam_date else None,
                "created_at": exam.created_at.isoformat(),
                "updated_at": exam.updated_at.isoformat(),
                "user": user_data
            })

        return jsonify({"list": exam_list}), 200

    except Exception as e:
        current_app.logger.error(f"Erro ao filtrar exames por data: {str(e)}")
        return jsonify({"erro": "Erro ao filtrar exames por data"}), 500