import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, Grid, List, ListItem, ListItemText, ListItemIcon, Divider, Box, CircularProgress, Fab } from '@mui/material';
import { useUser } from '../../contexts/UserContext/UserContext';
import { useNavigate } from 'react-router-dom';
import EventIcon from '@mui/icons-material/Event';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LogoutIcon from '@mui/icons-material/Logout';

interface Exame {
  id: string;
  description: string;
  exam_date: string | null;
  company_id: string;
  image_uploaded?: boolean;
}

interface DashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    ativo: boolean;
    address: string;
    phone: string;
    cpf: string;
    role: number;
    created_at: string | null;
    updated_at: string | null;
  };
  exames_agendados: Exame[];
  exames_anteriores: Exame[];
  total_exames: number;
  exames_com_imagem: number;
}

export default function DashboardTrabalhador() {
  const { user, token, logout } = useUser();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (user.role !== 2 && user.role !== 3)) {
      navigate('/login');
      return;
    }

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL}/usuario/dashboard/trabalhador/${user.id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        if (response.ok) {
          const data: DashboardData = await response.json();
          setDashboardData(data);
        } else {
          console.error('Erro ao buscar dados da dashboard:', response.status);
        }
      } catch (error) {
        console.error('Erro ao buscar dados da dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, token, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!dashboardData) {
    return <Typography>Erro ao carregar dados.</Typography>;
  }

  return (
    <Container>
      <Paper elevation={3} sx={{ padding: 3, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard do Trabalhador
        </Typography>
        <Typography variant="h6">
          Bem-vindo, {dashboardData.user.name}!
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ padding: 2 }}>
              <Typography variant="h6">Exames Agendados:</Typography>
              <List>
                {dashboardData.exames_agendados.map((exame) => (
                  <ListItem key={exame.id}>
                    <ListItemIcon>
                      <EventIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={exame.description}
                      secondary={exame.exam_date ? `Data: ${exame.exam_date}` : 'Data não definida'}
                    />
                  </ListItem>
                ))}
                {dashboardData.exames_agendados.length === 0 && (
                  <ListItem>
                    <ListItemText primary="Nenhum exame agendado." />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ padding: 2 }}>
              <Typography variant="h6">Histórico de Exames:</Typography>
              <List>
                {dashboardData.exames_anteriores.map((exame) => (
                  <ListItem key={exame.id}>
                    <ListItemIcon>
                      <HistoryIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={exame.description}
                      secondary={exame.exam_date ? `Data: ${exame.exam_date}` : 'Data não definida'}
                    />
                    {exame.image_uploaded && (
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                    )}
                  </ListItem>
                ))}
                {dashboardData.exames_anteriores.length === 0 && (
                  <ListItem>
                    <ListItemText primary="Nenhum exame anterior." />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>
        <Divider sx={{ my: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ padding: 2 }}>
              <Typography variant="h6">Total de Exames:</Typography>
              <Typography variant="subtitle1">{dashboardData.total_exames}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ padding: 2 }}>
              <Typography variant="h6">Exames com Imagem:</Typography>
              <Typography variant="subtitle1">{dashboardData.exames_com_imagem}</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
      <Box sx={{ position: 'fixed', bottom: 16, right: 16 }}>
        <Fab color="secondary" aria-label="logout" onClick={handleLogout}>
          <LogoutIcon />
        </Fab>
      </Box>
    </Container>
  );
}