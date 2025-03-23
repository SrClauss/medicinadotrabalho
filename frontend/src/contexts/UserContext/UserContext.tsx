import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Usuario from '../../interfaces/Usuario';
import { jwtDecode as jwt_decode } from 'jwt-decode'; // Certifique-se de ter instalado: npm install jwt-decode

interface TokenPayload {
  sub: string; // ID do usuário ou empresa
  role: number;
  exp: number; // Timestamp de expiração
}

interface UserContextType {
  user: Usuario | null;
  token: string | null;
  setUser: React.Dispatch<React.SetStateAction<Usuario | null>>;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
  isAdmin: () => boolean;
  isCompany: () => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  fetchUserData: () => Promise<void>;
  loading: boolean; // Adicionado estado de loading
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser deve ser usado dentro de um UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true); // Inicializa o loading como true
  const navigate = useNavigate();

  // Flag para controlar se os dados do usuário já foram buscados
  const userFetchedRef = useRef(false);

  // Verificar token no localStorage quando o componente montar
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const decoded = jwt_decode<TokenPayload>(storedToken);
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp > currentTime) {
          setToken(storedToken);
          setIsAuthenticated(true);
          // Busca os dados do usuário apenas se ainda não foram buscados
          if (!userFetchedRef.current) {
            fetchUserData();
          }
        } else {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } catch (error) {
        console.error("Token inválido:", error);
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
    setLoading(false); // Define o loading como false após a verificação inicial
  }, [navigate]);

  // Efeito para verificar a expiração do token periodicamente
  useEffect(() => {
    if (!token) return;

    const checkTokenExpiration = () => {
      try {
        const decoded = jwt_decode<TokenPayload>(token);
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp <= currentTime) {
          logout();
          navigate('/login');
        }
      } catch (error) {
        logout();
        navigate('/login');
      }
    };

    const interval = setInterval(checkTokenExpiration, 60000);
    return () => clearInterval(interval);
  }, [token, navigate]);

  // Persistência do token no localStorage e atualização do estado de autenticação
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      userFetchedRef.current = false;
    }
  }, [token]);

  const fetchUserData = async () => {
    if (!token || userFetchedRef.current) return;
    setLoading(true); // Define o loading como true antes de buscar os dados
    try {
      const decoded = jwt_decode<TokenPayload>(token);
      
      // Verificar se é uma empresa (role=4) ou usuário
      const isCompany = decoded.role === 4;
      const endpoint = isCompany 
        ? `${import.meta.env.VITE_BASE_URL}/empresa/obter/${decoded.sub}`
        : `${import.meta.env.VITE_BASE_URL}/usuario/obter/${decoded.sub}`;
        
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Para empresas, adaptar os dados para o formato de usuário
        if (isCompany) {
          // Criar um objeto de usuário a partir dos dados da empresa
          const companyAsUser: Usuario = {
            id: data.id,
            name: data.name,
            email: data.email,
            cpf: data.cnpj || '', // Usar CNPJ no lugar de CPF
            address: data.address,
            phone: data.phone,
            ativo: data.ativo,
            role: 4, // Role 4 para empresas
            created_at: data.created_at,
            updated_at: data.updated_at
          };
          setUser(companyAsUser);
        } else {
          // Para usuários normais, não é necessária adaptação
          setUser(data);
        }
        
        userFetchedRef.current = true;
      } else {
        throw new Error('Falha ao obter dados');
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      logout();
    } finally {
      setLoading(false); // Define o loading como false após a busca dos dados
    }
  };

  const isAdmin = () => {
    if (!token) return false;
    try {
      const decoded = jwt_decode<TokenPayload>(token);
      return decoded.role === 0;
    } catch {
      return false;
    }
  };

  // Função para verificar se o usuário é uma empresa
  const isCompany = () => {
    if (!token) return false;
    try {
      const decoded = jwt_decode<TokenPayload>(token);
      return decoded.role === 4;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    userFetchedRef.current = false;
    navigate('/login');
  };

  return (
    <UserContext.Provider 
      value={{ 
        user, 
        token, 
        setUser, 
        setToken, 
        isAdmin, 
        isCompany, // Adicionar nova função
        logout, 
        isAuthenticated,
        fetchUserData,
        loading // Adicionado estado de loading
      }}
    >
      {children}
    </UserContext.Provider>
  );
};