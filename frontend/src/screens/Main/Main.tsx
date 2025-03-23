import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  CalendarToday, 
  BusinessCenter, 
  AssignmentTurnedIn, 
  AccessTime 
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Interfaces para os dados
interface ExameRecente {
  id: string;
  user_id: string;
  company_id: string;
  exam_date: string;
  description: string;
  created_at: string;
  updated_at: string;
  image_uploaded: boolean;
}

interface ExamesPorDia {
  [data: string]: number;
}

interface EmpresaComMaisExames {
  id: string;
  name: string;
  total: number;
}

interface DashboardData {
  examesHoje: ExameRecente[];
  examesPorDia: ExamesPorDia;
  empresasComMaisExames: EmpresaComMaisExames[];
  examesRecentes: ExameRecente[];
}

// Cores para o gráfico de pizza
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Main() {
  // Estado único para armazenar todos os dados da dashboard
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    examesHoje: [],
    examesPorDia: {},
    empresasComMaisExames: [],
    examesRecentes: []
  });

  // Estados para controle de carregamento e erros
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Referência para controlar se já foi feita a requisição
  const fetchedRef = useRef(false);
  
  // Formatar data para exibição
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  // Truncar texto longo
  const truncarTexto = (texto: string, tamanho: number = 30) => {
    if (!texto) return '';
    return texto.length > tamanho ? texto.substring(0, tamanho) + '...' : texto;
  };

  // Converter dados de exames por dia para o formato esperado pelo Recharts
  const dadosGraficoExamesPorDia = Object.keys(dashboardData.examesPorDia).map((data) => ({
    data: formatarData(data),
    quantidade: dashboardData.examesPorDia[data]
  }));

  // Buscar dados da API
  useEffect(() => {
    // Evitar requisições duplicadas
    if (fetchedRef.current) return;
    
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Uma única requisição para obter todos os dados da dashboard
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/dashboard/dados`);
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar dados: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Atualizar o estado com todos os dados obtidos
        setDashboardData(data);
        
        // Marcar que os dados foram buscados
        fetchedRef.current = true;
      } catch (err) {
        console.error("Erro ao buscar dados da dashboard:", err);
        setError("Falha ao carregar dados da dashboard. Por favor, tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Cleanup function para resetar a flag quando o componente for desmontado
    return () => {
      fetchedRef.current = false;
    };
  }, []);

  // Mostrar estado de carregamento
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} />
      </Container>
    );
  }

  // Mostrar mensagem de erro se houver
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Cartão de exames agendados hoje */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h3" component="div">
                    {dashboardData.examesHoje.length}
                  </Typography>
                  <Typography variant="body2">
                    Exames Hoje
                  </Typography>
                </Box>
                <CalendarToday fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Cartão com o total de exames nos próximos 5 dias */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h3" component="div">
                    {Object.values(dashboardData.examesPorDia).reduce((a, b) => a + b, 0)}
                  </Typography>
                  <Typography variant="body2">
                    Exames nos Próximos 5 dias
                  </Typography>
                </Box>
                <AssignmentTurnedIn fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Cartão com o número de empresas */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h3" component="div">
                    {dashboardData.empresasComMaisExames.length}
                  </Typography>
                  <Typography variant="body2">
                    Empresas com Exames
                  </Typography>
                </Box>
                <BusinessCenter fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Cartão com o número de exames recentes */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'error.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h3" component="div">
                    {dashboardData.examesRecentes.length}
                  </Typography>
                  <Typography variant="body2">
                    Exames Recentes
                  </Typography>
                </Box>
                <AccessTime fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico de barras - Exames por dia nos próximos 5 dias */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 320 }}>
            <Typography variant="h6" component="h3" gutterBottom>
              Exames Agendados por Dia
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart
                data={dadosGraficoExamesPorDia}
                margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantidade" name="Quantidade de Exames" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Gráfico de pizza - Empresas com mais exames */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 320 }}>
            <Typography variant="h6" component="h3" gutterBottom>
              Empresas com Mais Exames
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={dashboardData.empresasComMaisExames}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                  nameKey="name"
                >
                  {dashboardData.empresasComMaisExames.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} exames`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Tabela - Exames recentes */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" component="h3" gutterBottom>
              Exames Recentes
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Descrição</TableCell>
                    <TableCell>Data do Exame</TableCell>
                    <TableCell>ID do Usuário</TableCell>
                    <TableCell>ID da Empresa</TableCell>
                    <TableCell>Criado em</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData.examesRecentes.map((exame) => (
                    <TableRow key={exame.id}>
                      <TableCell>{truncarTexto(exame.description)}</TableCell>
                      <TableCell>{formatarData(exame.exam_date)}</TableCell>
                      <TableCell>{truncarTexto(exame.user_id, 8)}</TableCell>
                      <TableCell>{truncarTexto(exame.company_id, 8)}</TableCell>
                      <TableCell>{new Date(exame.created_at).toLocaleString('pt-BR')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}