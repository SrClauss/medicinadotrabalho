import './App.css';
import { ThemeProvider } from './providers/ThemeProvider/ThemeProvider';
import { CssBaseline } from '@mui/material';
import { UserProvider, useUser } from './contexts/UserContext/UserContext';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout/MainLayout';
import OfflineLayout from './layouts/OfflineLayout/OfflineLayout';
import Main from './screens/Main/Main';
import CadastroUsuario from './screens/CadastroUsuario/CadastroUsuario';
import UsuarioView from './screens/UsuarioView/UsuarioView';
import CadastroEmpresa from './screens/CadastroEmpresa/CadastroEmpresa';
import EmpresaView from './screens/EmpresaView/EmpresaView';
import RedefineSenha from './screens/RedefineSenha/RedefineSenha';
import RedefineSenhaEmpresa from './screens/RedefineSenha/RedefineSenhaEmpresa';
import LoginScreen from './screens/LoginScreen/LoginScreen';
import RecuperacaoSenha from './screens/RecuperacaoSenha/RecuperacaoSenha';
import AgendamentoPorEmpresa from './screens/AgendamentoPorEmpresa/AgendamentoPorEmpresa';
import VerAgendamentosPorEmpresa from './screens/VerAgendamentosPorEmpresa/VerAgendamentosPorEmpresa';
import UsuarioContainer from './screens/UsuarioContainer/UsuarioContainer';
import EmpresaContainer from './screens/EmpresaContainer/EmpresaContainer';
import DashboardEmpresa from './screens/DashboardEmpresa/DashboardEmpresa';
import DashboardTrabalhador from './screens/DashboardTrabalhador/DashboardTrabalhador'; // Importe o novo componente
import { Box, CircularProgress } from '@mui/material';

function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const userRole = user?.role || 0;

  if (userRole > 1 && userRole !== 4 && userRole !== 2 && userRole !== 3) {
    return <OfflineLayout>{children}</OfflineLayout>;
  }

  return <MainLayout>{children}</MainLayout>;
}

function Home() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const userRole = user?.role || 0;

  if (userRole === 4) {
    return <OfflineLayout><DashboardEmpresa /></OfflineLayout>;
  }

  if (userRole === 2 || userRole === 3) {
    return <OfflineLayout><DashboardTrabalhador /></OfflineLayout>;
  }

  return (
    <LayoutWrapper>
      <Main />
    </LayoutWrapper>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <Router>
        <UserProvider>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/login" element={<OfflineLayout><LoginScreen /></OfflineLayout>} />
            <Route path="/redefine-senha/:token" element={<OfflineLayout><RedefineSenha /></OfflineLayout>} />
            <Route path="/redefine-senha-empresa/:token" element={<OfflineLayout><RedefineSenhaEmpresa /></OfflineLayout>} />
            <Route path="/redefine-senha" element={<OfflineLayout><RecuperacaoSenha /></OfflineLayout>} />

            {/* Rota condicional para a Home */}
            <Route path="/" element={<Home />} />

            {/* Rotas protegidas com layout condicional */}
            <Route path="/cadastro-usuario" element={<LayoutWrapper><CadastroUsuario /></LayoutWrapper>} />
            <Route path="/editar-usuario/:id" element={<LayoutWrapper><CadastroUsuario /></LayoutWrapper>} />
            <Route path="/usuarios/:searchTerm?" element={<LayoutWrapper><UsuarioView /></LayoutWrapper>} />
            <Route path="/usuarios-container" element={<LayoutWrapper><UsuarioContainer /></LayoutWrapper>} />
            <Route path="/cadastro-empresa" element={<LayoutWrapper><CadastroEmpresa /></LayoutWrapper>} />
            <Route path="/editar-empresa/:id" element={<LayoutWrapper><CadastroEmpresa /></LayoutWrapper>} />
            <Route path="/empresas/:searchTerm?" element={<LayoutWrapper><EmpresaView /></LayoutWrapper>} />
            <Route path="/agendamento-empresa/:companyId" element={<LayoutWrapper><AgendamentoPorEmpresa /></LayoutWrapper>} />
            <Route path="/ver-agendamentos-por-empresa/:companyId/:companyName" element={<LayoutWrapper><VerAgendamentosPorEmpresa /></LayoutWrapper>} />
            <Route path="/empresas-container" element={<LayoutWrapper><EmpresaContainer /></LayoutWrapper>} />
          </Routes>
        </UserProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;