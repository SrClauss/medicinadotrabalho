import { AppBar, Box, Toolbar, Container, Typography, InputBase, Divider, Button, IconButton } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import MenuButton from '../../components/MenuButton/MenuButton';
import logo from '../../assets/logo.png';
import { useUser } from '../../contexts/UserContext/UserContext';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import EventIcon from '@mui/icons-material/Event';
import SendIcon from '@mui/icons-material/Send';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import Usuario from '../../interfaces/Usuario';

export default function ButtonAppBar() {
  const { user, setUser } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  return (
    
      <AppBar position="static">
        
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexGrow: 1 }}>
              <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}>
                <MenuButton />
              </Box>
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
                <a href="https://www.clinicaaudionorte.com.br/home/" target="_blank" rel="noopener noreferrer">
                  <img src={logo} alt="logo" style={{ width: 100 }} />
                </a>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, flexGrow: 1, maxWidth: { xs: '100%', md: '300px' } }}>
                <InputBase
                  placeholder="Pesquisar…"
                  inputProps={{ 'aria-label': 'search' }}
                  sx={{ color: 'inherit', ml: 1, flex: 1, border: '1px solid white', borderRadius: 1, padding: '2px 8px' }}
                />
                <Button type="submit" sx={{ p: '10px' }} aria-label="search">
                  <SearchIcon htmlColor='white' />
                </Button>
              </Box>
            </Box>
            <Button color="inherit" onClick={handleLogout}>
              <LogoutIcon />
              <Typography variant="caption" sx={{ ml: 1 }}>Sair</Typography>
            </Button>
          </Toolbar>
          <Divider />
          <Toolbar sx={{ justifyContent: 'space-between', display: { xs: 'none', md: 'flex' } }}>
            <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, justifyContent: 'space-around' }}>
              <Link to="/cadastro-usuario" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }, padding: 1, borderRadius: 1 }}>
                  <PersonIcon />
                  <Typography variant="caption" sx={{ ml: 1 }}>Cadastrar Usuarios</Typography>
                </Box>
              </Link>
              <Divider orientation="vertical" flexItem />
              <Link to="/empresas" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }, padding: 1, borderRadius: 1 }}>
                  <BusinessIcon />
                  <Typography variant="caption" sx={{ ml: 1 }}>Cadastrar Empresas</Typography>
                </Box>
              </Link>
              <Divider orientation="vertical" flexItem />
              <Link to="/usuario-view" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }, padding: 1, borderRadius: 1 }}>
                  <EventIcon />
                  <Typography variant="caption" sx={{ ml: 1 }}>Gerenciar Usuarios</Typography>
                </Box>
              </Link>
              <Divider orientation="vertical" flexItem />
              <Link to="/enviar-exames" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }, padding: 1, borderRadius: 1 }}>
                  <SendIcon />
                  <Typography variant="caption" sx={{ ml: 1 }}>Enviar Exames</Typography>
                </Box>
              </Link>
              {user?.role === 0 && (
                <>
                  <Divider orientation="vertical" flexItem />
                  <Link to="/painel-administrativo" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }, padding: 1, borderRadius: 1 }}>
                      <AdminPanelSettingsIcon />
                      <Typography variant="caption" sx={{ ml: 1 }}>Painel Administrativo</Typography>
                    </Box>
                  </Link>
                </>
              )}
            </Box>
          </Toolbar>
        
      </AppBar>

  );
}