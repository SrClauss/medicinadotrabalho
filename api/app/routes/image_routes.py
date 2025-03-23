import os
from flask import Blueprint, request, jsonify, current_app
from app import get_db
from werkzeug.utils import secure_filename

image_bp = Blueprint('image', __name__)

# Função para verificar se a extensão do arquivo é permitida
def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}  # Adicionado 'pdf'
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
import os
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from app.models.exam import Exam  # Importe o modelo Exam

image_bp = Blueprint('image', __name__)

# Função para verificar se a extensão do arquivo é permitida
def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}  # Adicionado 'pdf'
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@image_bp.route('/images/upload_images', methods=['POST'])
def upload_images():
    
    db = get_db()
    
    try:
        if 'imagens' not in request.files:
            return jsonify({'erro': 'Nenhum arquivo enviado'}), 400

        files = request.files.getlist('imagens')
        image_names = request.form.getlist('image_names')
        exam_id = request.form.get('exam_id')  # Assumindo que você está enviando o ID do exame no formulário

        if not files or not image_names:
            return jsonify({'erro': 'Nenhum arquivo ou nome de imagem fornecido'}), 400

        if len(files) != len(image_names):
            return jsonify({'erro': 'Número de arquivos e nomes de imagens não correspondem'}), 400

        uploaded_files = []
        for file, image_name in zip(files, image_names):
            if file and allowed_file(file.filename):
                filename = secure_filename(image_name + '.' + file.filename.rsplit('.', 1)[1].lower())
                file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], filename))
                uploaded_files.append(filename)
            else:
                return jsonify({'erro': f'Tipo de arquivo não permitido: {file.filename}'}), 400
        
        # Atualizar o status image_uploaded do exame
        exam = db.query(Exam).get(exam_id)
        print(exam)
        if exam:
            exam.image_uploaded = True
            db.commit()
        else:
            return jsonify({'erro': 'Exame não encontrado'}), 404

        return jsonify({'mensagem': 'Arquivos enviados com sucesso', 'filenames': uploaded_files}), 200

    except Exception as e:
        current_app.logger.error(f"Erro ao fazer upload das imagens: {str(e)}")
        return jsonify({'erro': 'Erro ao fazer upload das imagens'}), 500
@image_bp.route('images/delete_images/<id>', methods=['DELETE'])
def delete_images(id):
    try:
        folder_path = current_app.config['UPLOAD_FOLDER']
        deleted_files = []

        for filename in os.listdir(folder_path):
            if filename.startswith(id + '_'):
                file_path = os.path.join(folder_path, filename)
                try:
                    os.remove(file_path)
                    deleted_files.append(filename)
                except Exception as e:
                    current_app.logger.error(f"Erro ao deletar o arquivo {filename}: {str(e)}")
                    return jsonify({'erro': f'Erro ao deletar o arquivo {filename}'}), 500

        if deleted_files:
            return jsonify({'mensagem': 'Arquivos deletados com sucesso', 'filenames': deleted_files}), 200
        else:
            return jsonify({'mensagem': 'Nenhum arquivo encontrado para deletar com este ID'}), 404

    except Exception as e:
        current_app.logger.error(f"Erro ao deletar as imagens: {str(e)}")
        return jsonify({'erro': 'Erro ao deletar as imagens'}), 500