import './App.css'
import { ThemeProvider } from './providers/ThemeProvider/ThemeProvider';
import { CssBaseline } from '@mui/material'
import { UserProvider } from './contexts/UserContext/UserContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout/MainLayout';
import Main from './screens/Main/Main';
import CadastroUsuario from './screens/CadastroUsuario/CadastroUsuario';
import RedefineSenha from './screens/RedefineSenha/RedefineSenha';
import OfflineLayout from './layouts/OfflineLayout/OfflineLayout';
import UsuarioView from './screens/UsuarioView/UsuarioView';
import CadastroEmpresa from './screens/CadastroEmpresa/CadastroEmpresa';
import EmpresaView from './screens/EmpresaView/EmpresaView';
import RedefineSenhaEmpresa from './screens/RedefineSenha/RedefineSenhaEmpresa';
import LoginScreen from './screens/LoginScreen/LoginScreen';
import RecuperacaoSenha from './screens/RecuperacaoSenha/RecuperacaoSenha';
import AgendamentoPorEmpresa from './screens/AgendamentoPorEmpresa/AgendamentoPorEmpresa';
import VerAgendamentosPorEmpresa from './screens/VerAgendamentosPorEmpresa/VerAgendamentosPorEmpresa';
import UsuarioContainer from './screens/UsuarioContainer/UsuarioContainer';
import EmpresaContainer from './screens/EmpresaContainer/EmpresaContainer';

export function App() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <Router>
        <UserProvider>
          <Routes>
            <Route path="/" element={<MainLayout><Main /></MainLayout>} />
            <Route path="/login" element={<OfflineLayout><LoginScreen /></OfflineLayout>} />
            <Route path="/redefine-senha/:token" element={<OfflineLayout><RedefineSenha /></OfflineLayout>} />
            <Route path="/redefine-senha-empresa/:token" element={<OfflineLayout><RedefineSenhaEmpresa /></OfflineLayout>} />
            <Route path="/cadastro-usuario" element={<MainLayout><CadastroUsuario /></MainLayout>} />
            <Route path="/editar-usuario/:id" element={<MainLayout><CadastroUsuario /></MainLayout>} />
            <Route path="/usuarios/:searchTerm?" element={<MainLayout><UsuarioView /></MainLayout>} />
            <Route path="/usuarios-container" element={<MainLayout><UsuarioContainer /></MainLayout>} />
            <Route path="/cadastro-empresa" element={<MainLayout><CadastroEmpresa /></MainLayout>} />
            <Route path="/editar-empresa/:id" element={<MainLayout><CadastroEmpresa /></MainLayout>} />
            <Route path="/empresas/:searchTerm?" element={<MainLayout><EmpresaView /></MainLayout>} />
            <Route path="/redefine-senha" element={<OfflineLayout><RecuperacaoSenha /></OfflineLayout>} />
            <Route path="/agendamento-empresa/:companyId" element={<MainLayout><AgendamentoPorEmpresa /></MainLayout>} />
            <Route path="/ver-agendamentos-por-empresa/:companyId/:companyName" element={<MainLayout><VerAgendamentosPorEmpresa /></MainLayout>} />
            <Route path="/empresas-container" element={<MainLayout><EmpresaContainer /></MainLayout>} />
          </Routes>
        </UserProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;