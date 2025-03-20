import unittest
import json
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
from bcrypt import hashpw, gensalt, checkpw
from app import create_app, drop_test_db
from app.database import Base
from app.models.user import User, UserDTO
from app import TestSession

class UserRoutesTestCase(unittest.TestCase):
    def setUp(self):
        """Configuração executada antes de cada teste"""
        # Limpar o banco de dados de teste
        drop_test_db()
        
        # Configurar o banco de dados de teste
        self.db = TestSession()
        Base.metadata.create_all(bind=self.db.bind)
        
    def tearDown(self):
        """Limpeza executada após cada teste"""
        self.db.close()
        drop_test_db()
    
    @patch('app.routes.user_routes.get_db')
    @patch('app.routes.user_routes.enviar_email')
    def test_registrar_usuario(self, mock_enviar_email, mock_get_db):
        """Teste de registro de usuário"""
        # Configurar o mock para retornar o banco de dados de teste
        mock_get_db.return_value = self.db
        
        # Criar a aplicação de teste
        self.app = create_app(testing=True)
        
        with self.app.test_client() as client:
            # Dados para registro
            dados_usuario = {
                "name": "Usuário Teste",
                "address": "Rua Teste, 123",
                "phone": "12345678901",
                "cpf": "12345678901",
                "email": "usuario@teste.com",
                "password": "senha123"
            }
            
            # Fazer requisição POST para registrar usuário
            response = client.post(
                "/api/usuario/registrar",
                data=json.dumps(dados_usuario),
                content_type="application/json"
            )
            
            # Verificações
            self.assertEqual(response.status_code, 201)
            self.assertIn("Verifique seu e-mail", response.json["mensagem"])
            
            # Verificar se o mock de enviar_email foi chamado
            mock_enviar_email.assert_called_once()
            
            # Verificar se o usuário foi criado no banco e está inativo
            usuario = self.db.query(User).filter_by(email="usuario@teste.com").first()
            self.assertIsNotNone(usuario)
            self.assertEqual(usuario.name, "Usuário Teste")
            self.assertFalse(usuario.ativo)  # Verifica se o usuário está inativo
    
    @patch('app.routes.user_routes.get_db')
    def test_registrar_usuario_email_existente(self, mock_get_db):
        """Teste de registro com email já existente"""
        # Configurar o mock para retornar o banco de dados de teste
        mock_get_db.return_value = self.db
        
        # Adicionar um usuário existente
        usuario = User(
            name="Usuário Existente",
            address="Rua Existente, 123",
            phone="11111111111",
            cpf="11111111111",
            email="usuario@teste.com",
            password_hash=hashpw("senha123".encode('utf-8'), gensalt()).decode('utf-8'),
            role=0,
            ativo=True
        )
        self.db.add(usuario)
        self.db.commit()
        
        # Criar a aplicação de teste
        self.app = create_app(testing=True)
        
        with self.app.test_client() as client:
            # Dados para registro com mesmo email
            dados_usuario = {
                "name": "Outro Usuário",
                "address": "Outro Endereço, 456",
                "phone": "22222222222",
                "cpf": "22222222222",
                "email": "usuario@teste.com",
                "password": "outrasenha"
            }
            
            # Fazer requisição POST para registrar usuário
            response = client.post(
                "/api/usuario/registrar",
                data=json.dumps(dados_usuario),
                content_type="application/json"
            )
            
            # Verificar que retornou erro 400
            self.assertEqual(response.status_code, 400)
            self.assertIn("já registrado", response.json["erro"])
    
    @patch('app.routes.user_routes.get_db')
    def test_obter_usuario(self, mock_get_db):
        """Teste para obter dados de um usuário específico"""
        # Configurar o mock para retornar o banco de dados de teste
        mock_get_db.return_value = self.db
        
        # Criar um usuário no banco
        senha = "senha123"
        hashed_password = hashpw(senha.encode('utf-8'), gensalt()).decode('utf-8')
        usuario = User(
            id="123e4567-e89b-12d3-a456-426614174000",  # UUID fixo para teste
            name="Usuário de Teste",
            address="Rua de Teste, 123",
            phone="33333333333",
            cpf="33333333333",
            email="usuario@teste.com",
            password_hash=hashed_password,
            role=0,
            ativo=True
        )
        
        self.db.add(usuario)
        self.db.commit()
        
        # Criar a aplicação de teste
        self.app = create_app(testing=True)
        
        with self.app.test_client() as client:
            # Fazer requisição GET para obter usuário
            response = client.get(f"/api/usuario/obter/{usuario.id}")
            
            # Verificações
            self.assertEqual(response.status_code, 200)
            data = response.json
            self.assertEqual(data["id"], usuario.id)
            self.assertEqual(data["name"], "Usuário de Teste")
            self.assertEqual(data["email"], "usuario@teste.com")
    
    @patch('app.routes.user_routes.get_db')
    def test_find_by_substring(self, mock_get_db):
        """Teste para buscar usuários por substring no nome"""
        # Configurar o mock para retornar o banco de dados de teste
        mock_get_db.return_value = self.db
        
        # Criar vários usuários com nomes diferentes
        senha = "senha123"
        hashed_password = hashpw(senha.encode('utf-8'), gensalt()).decode('utf-8')
        usuario1 = User(
            name="João Silva",
            address="Rua Silva, 123",
            phone="11111111111",
            cpf="11111111111",
            email="joao@teste.com",
            password_hash=hashed_password,
            role=0,
            ativo=True
        )
        
        usuario2 = User(
            name="Maria Oliveira",
            address="Avenida Oliveira, 456",
            phone="22222222222",
            cpf="22222222222",
            email="maria@teste.com",
            password_hash=hashed_password,
            role=0,
            ativo=True
        )
        
        usuario3 = User(
            name="José Silva",
            address="Praça Silva, 789",
            phone="33333333333",
            cpf="33333333333",
            email="jose@teste.com",
            password_hash=hashed_password,
            role=0,
            ativo=True
        )
        
        # Adicionar ao banco
        self.db.add_all([usuario1, usuario2, usuario3])
        self.db.commit()
        
        # Criar a aplicação de teste
        self.app = create_app(testing=True)
        
        with self.app.test_client() as client:
            # Fazer requisição GET para buscar por substring "Silva"
            response = client.get("/api/usuarios/find_by_substring/Silva")
            
            # Verificações
            self.assertEqual(response.status_code, 200)
            usuarios = response.json
            self.assertEqual(len(usuarios), 2)  # Deve encontrar apenas os 2 com "Silva" no nome
            nomes = [u["name"] for u in usuarios]
            self.assertIn("João Silva", nomes)
            self.assertIn("José Silva", nomes)
            self.assertNotIn("Maria Oliveira", nomes)
    
    limite_expiracao = datetime.now() - timedelta(hours=1)

if __name__ == "__main__":
    unittest.main()