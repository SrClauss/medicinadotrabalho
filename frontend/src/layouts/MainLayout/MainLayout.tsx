import { Box } from "@mui/material";
import Header from "./Header";
import Footer from "./Footer";
import { ReactNode, useState, useEffect } from "react";
import Usuario from "../../interfaces/Usuario";
import { useUser } from "../../contexts/UserContext/UserContext";
import Endereco from "../../interfaces/Endereco";

const MainLayout = ({ children }: { children: ReactNode }) => {
  const { user, setUser } = useUser();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, [setUser]);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!user || user.role > 2) {
    return <div>Você não tem permissão para acessar esta página.</div>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Box
        id="main-content"
        component="main"
        sx={{
          maxHeight: 'calc(100vh - 128px)',
          overflowY: 'auto',
          marginBottom: '64px',
          flex: 1,
        }}
      >
        {children}
      </Box>
      <Footer />
    </Box>
  );
};

export default MainLayout;