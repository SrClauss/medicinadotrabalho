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

export function App() {
  return (
    <UserProvider>
      <ThemeProvider>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/" element={<MainLayout><Main/></MainLayout>} />
            <Route path="/cadastro-usuario" element={<MainLayout><CadastroUsuario/></MainLayout>} />
            <Route path="/editar-usuario/:id" element={<MainLayout><CadastroUsuario /></MainLayout>} />
            <Route path="/login" element={<div>login</div>} />
            <Route path="/redefine-senha/:token" element={<OfflineLayout><RedefineSenha/></OfflineLayout>} />
            <Route path="/usuario-view" element={<MainLayout><UsuarioView/></MainLayout>} />
            <Route path="/usuarios/:searchTerm?" element={<MainLayout><UsuarioView /></MainLayout>} />
          </Routes>
        </Router>
      </ThemeProvider>
    </UserProvider>
  );
}

export default App;