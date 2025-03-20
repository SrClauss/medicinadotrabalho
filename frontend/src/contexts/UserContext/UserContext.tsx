import { createContext, useContext, useState } from 'react';
import Usuario from '../../interfaces/Usuario';

const userValue: Usuario = {
  name: "John Doe",
  email: "email@email.com",
  role: 0,
  id: "1",
  phone: "123456789",
  cpf: "123456789",
  created_at: new Date().toDateString(),
  updated_at: new Date().toDateString(),
  ativo: true,
  address: {
    cep: "12345678",
    logradouro: "Rua",
    numero: "123",
    complemento: "Casa",
    bairro: "Bairro",
    cidade: "Cidade",
    estado: "Estado",
    id: "1",
    toArray: function (): string[] {
      throw new Error('Function not implemented.');
    }
  },
};

interface UserContextType {
  user: Usuario | null;
  setUser: React.Dispatch<React.SetStateAction<Usuario | null>>;
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
  const [user, setUser] = useState<Usuario | null>(userValue);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};