# app/__init__.py
import os
from dotenv import load_dotenv
from flask import Flask
from flask_mail import Mail
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
import ulid
from datetime import datetime
from app.database import get_db, init_db


load_dotenv()  # Carrega as variáveis do .env

# Configuração do banco de dados
DATABASE_URL = os.getenv('DATABASE_URL')
TEST_DATABASE_URL = os.getenv('TEST_DATABASE_URL')
test_engine = create_engine(TEST_DATABASE_URL)
engine = create_engine(DATABASE_URL)
Session = scoped_session(sessionmaker(bind=engine))
TestSession = scoped_session(sessionmaker(bind=test_engine))

# Configuração do Flask-Mail
mail = Mail()

# Variável global para a aplicação
app = None

def create_app(testing=False):
    global app
    app = Flask(__name__)
    
    # Configurações obtidas do .env
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True') == 'True'
    app.config['MAIL_USE_SSL'] = os.getenv('MAIL_USE_SSL', 'False') == 'True'
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
    app.config['MODE'] = os.getenv('MODE')
    app.config['FRONTEND_DEV_URL'] = os.getenv('FRONTEND_DEV_URL')
    app.config['FRONTEND_PROD_URL'] = os.getenv('FRONTEND_PROD_URL')
    app.config['FRONTEND_URL'] = app.config['FRONTEND_DEV_URL'] if app.config['MODE'] == 'development' else app.config['FRONTEND_PROD_URL']
    app.config['SQLALCHEMY_POOL_SIZE'] = 100  # Aumente para um valor maior
    if testing:
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('TEST_DATABASE_URL')
        app.config['SECRET_KEY'] = 'chave_teste'
    else:
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
    mail.init_app(app)

    # Configuração do diretório de upload de imagens
    UPLOAD_FOLDER = 'uploads'
    app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, UPLOAD_FOLDER)
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)  # Crie o diretório se não existir

    # Importar modelos após a criação do app para evitar importação circular
    from app.routes.user_routes import user_bp
    from app.routes.company_routes import company_bp
    from app.routes.exam_routes import exam_bp
    from app.routes.image_routes import image_bp
    from app.routes.login import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api', name='auth')
    app.register_blueprint(user_bp, url_prefix='/api', name='user_blueprint')
    app.register_blueprint(company_bp, url_prefix='/api', name='company_blueprint')
    app.register_blueprint(exam_bp, url_prefix='/api', name='exam_blueprint')
    app.register_blueprint(image_bp, url_prefix='/api')

    return app

def get_db(testing=False):
    if testing:
        return TestSession()
    return Session()

def init_db(testing=False):
    """Inicializa o banco de dados criando todas as tabelas"""
    from app.models.user import Base
    from app.models.company import Base
    from app.models.exam import Base
    
    if testing:
        Base.metadata.create_all(bind=test_engine)
        return
    Base.metadata.create_all(bind=engine)

def drop_test_db():
    from app.models.user import Base
    from app.models.company import Base
    from app.models.exam import Base
    Base.metadata.drop_all(bind=test_engine)