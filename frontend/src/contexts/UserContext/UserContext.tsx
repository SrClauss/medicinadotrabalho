import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Usuario from '../../interfaces/Usuario';
import {jwtDecode as jwt_decode} from 'jwt-decode'; // Você precisará instalar este pacote: npm install jwt-decode

interface TokenPayload {
  sub: string; // ID do usuário
  role: number;
  exp: number; // Timestamp de expiração
}

interface UserContextType {
  user: Usuario | null;
  token: string | null;
  setUser: React.Dispatch<React.SetStateAction<Usuario | null>>;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
  isAdmin: () => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  fetchUserData: () => Promise<void>;
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
  const navigate = useNavigate();

  // Verificar token no localStorage quando o componente montar
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        // Verifica se o token é válido e não está expirado
        const decoded = jwt_decode<TokenPayload>(storedToken);
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (decoded.exp > currentTime) {
          setToken(storedToken);
          setIsAuthenticated(true);
          fetchUserData(); // Busca os dados do usuário usando o token
        } else {
          // Token expirado
          localStorage.removeItem('token');
          navigate('/login');
        }
      } catch (error) {
        console.error("Token inválido:", error);
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
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

    const interval = setInterval(checkTokenExpiration, 60000); // Verifica a cada minuto
    return () => clearInterval(interval);
  }, [token, navigate]);

  // Quando o token mudar, salve no localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [token]);

  const fetchUserData = async () => {
    if (!token) return;
    
    try {
      const decoded = jwt_decode<TokenPayload>(token);
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/usuario/obter/${decoded.sub}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        throw new Error('Falha ao obter dados do usuário');
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      logout();
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

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
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
        logout, 
        isAuthenticated,
        fetchUserData 
      }}
    >
      {children}
    </UserContext.Provider>
  );
};