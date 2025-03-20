import { AppBar, Box, Toolbar, Container } from '@mui/material';
import logo from '../../assets/logo.png';

export default function OfflineHeader() {
  return (
    <AppBar position="static">
      <Container>
        <Toolbar sx={{ justifyContent: 'center', padding: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <a href="https://www.clinicaaudionorte.com.br/home/" target="_blank" rel="noopener noreferrer">
              <img src={logo} alt="logo" style={{ width: 150 }} />
            </a>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}