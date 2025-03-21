import { Box } from "@mui/material";
import Header from "./Header";
import Footer from "./Footer";
import { ReactNode, useState, useEffect } from "react";
import { useUser } from "../../contexts/UserContext/UserContext";
import { Navigate } from "react-router-dom";

const MainLayout = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isAdmin, user } = useUser();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Define um pequeno timeout para garantir que o contexto do usuário tenha tempo
    // de verificar o token e definir o estado isAuthenticated
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  // Redireciona para login se não autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Verifica permissões necessárias (exemplo para rota que exige admin)
  const requiresAdmin = window.location.pathname.includes('painel-administrativo');
  if (requiresAdmin && !isAdmin()) {
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