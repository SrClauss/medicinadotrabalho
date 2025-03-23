import { useState, useEffect } from 'react';
import { Container, Typography, Paper, Grid, Button, Fab } from '@mui/material';
import { useUser } from '../../contexts/UserContext/UserContext';
import { useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import { Box } from '@mui/system';

interface Estatisticas {
  total_exames: number;
  exames_entregues: number;
  exames_pendentes: number;
}

export default function DashboardEmpresa() {
  const { user, token, logout } = useUser();
  const navigate = useNavigate();
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);

  useEffect(() => {
    if (!user || user.role !== 4) {
      navigate('/login'); // Redirecionar se não for empresa
      return;
    }

    const fetchEstatisticas = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL}/exames/estatisticas_por_empresa/${user.id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setEstatisticas(data);
        } else {
          console.error('Erro ao buscar estatísticas:', response.status);
        }
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      }
    };

    fetchEstatisticas();
  }, [user, token, navigate]);

  if (!user) {
    return <Typography>Carregando...</Typography>;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Container>
      <Paper elevation={3} sx={{ padding: 3, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard da Empresa
        </Typography>
        {estatisticas ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ padding: 2 }}>
                <Typography variant="h6">Total de Exames:</Typography>
                <Typography variant="subtitle1">{estatisticas.total_exames}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ padding: 2 }}>
                <Typography variant="h6">Exames Entregues:</Typography>
                <Typography variant="subtitle1">{estatisticas.exames_entregues}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ padding: 2 }}>
                <Typography variant="h6">Exames Pendentes:</Typography>
                <Typography variant="subtitle1">{estatisticas.exames_pendentes}</Typography>
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Typography>Carregando estatísticas...</Typography>
        )}
        <Button variant="contained" color="primary" sx={{ mt: 3 }}>
          Gerenciar Exames
        </Button>
      </Paper>
      <Box sx={{ position: 'fixed', bottom: 80, right: 16 }}>
        <Fab color="secondary" aria-label="logout" onClick={handleLogout}>
          <LogoutIcon />
        </Fab>
      </Box>
    </Container>
  );
}