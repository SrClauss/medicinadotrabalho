import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { Link } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import ApartmentIcon from '@mui/icons-material/Apartment';
import ContactsIcon from '@mui/icons-material/Contacts';
import LogoutIcon from '@mui/icons-material/Logout';
import { useUser } from '../../contexts/UserContext/UserContext';

interface MenuListProps {
  // toggleDrawer é uma função sem parâmetros que retorna void
  toggleDrawer: () => void;
}

const menuItems = [
  { label: 'Home', icon: <HomeIcon />, path: '/' },
  { label: 'Cadastrar Usuarios', icon: <PersonIcon />, path: '/cadastro-usuario' },
  { label: 'Cadastrar Empresas', icon: <BusinessIcon />, path: '/cadastro-empresa' },
  { label: 'Gereciar Empresas', icon: <ApartmentIcon />, path: '/empresas-container' },
  { label: 'Gerenciar Usuarios', icon: <ContactsIcon />, path: '/usuarios-container' },
];

export default function MenuList({ toggleDrawer }: MenuListProps) {
  const { logout } = useUser();

  return (
    <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer}>
      <List>
        {menuItems.map(({ label, icon, path }) => (
          <ListItem key={label} disablePadding>
            <ListItemButton component={Link} to={path}>
              <ListItemIcon>
                {icon}
              </ListItemIcon>
              <ListItemText primary={label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={logout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Sair" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
}