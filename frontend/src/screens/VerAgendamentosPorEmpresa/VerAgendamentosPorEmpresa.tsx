import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
  TableContainer,
  Popover,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { FilterList, Info, Scanner, Search, Send } from '@mui/icons-material';
import TitleForm from '../../components/TitleForm/TitleForm';
import { useUser } from '../../contexts/UserContext/UserContext';

interface Exam {
  id: string;
  description: string;
  image_uploaded: boolean;
  company_id: string;
  user: {
    id: string;
    name: string;
    email: string;
    cpf: string;
    address: any;
    phone: string;
    ativo: boolean;
    role: number;
    created_at: string;
    updated_at: string;
  } | null;
  created_at: string;
  updated_at: string;
  exam_date: string;
}

export default function VerAgendamentosPorEmpresa() {
  const { companyId, companyName } = useParams<{ companyId: string, companyName: string }>();
  const [dataInicial, setDataInicial] = useState<string>('');
  const [dataFinal, setDataFinal] = useState<string>('');
  const [exames, setExames] = useState<Exam[]>([]);
  const nomeEmpresa = decodeURIComponent(companyName || 'Nome da Empresa');
  const { token } = useUser();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [selectedExamInfo, setSelectedExamInfo] = useState<Exam | null>(null);

  useEffect(() => {
    // Buscar agendamentos ao montar o componente ou quando companyId mudar
    buscarAgendamentos();
  }, [companyId]);

  const buscarAgendamentos = async () => {
    if (!companyId) return;

    let url = `${import.meta.env.VITE_BASE_URL}/exames/listar_por_empresa_e_datas?company_id=${companyId}`;

    if (dataInicial) {
      url += `&data_inicial=${dataInicial}`;
    }

    if (dataFinal) {
      url += `&data_final=${dataFinal}`;
    }

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setExames(data.list || []);
      } else {
        console.error('Erro ao buscar agendamentos:', response.status);
        setExames([]);
      }
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      setExames([]);
    }
  };

  const handlePopoverOpen = (
    event: React.MouseEvent<HTMLButtonElement>,
    exam: Exam
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedExamInfo(exam);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
    setSelectedExamInfo(null);
  };

  const open = Boolean(anchorEl);

  return (
    <Container>
      <Paper elevation={3}>
        <TitleForm title={`Agendamentos da Empresa: ${nomeEmpresa}`} id="title-agendamentos-empresa" />
        <Box sx={{ padding: 2 }}>
          <Typography variant="h6" gutterBottom>
            Filtrar Agendamentos
          </Typography>
          <Divider sx={{margin: "20px 0px"}} />
          <Box sx={{ display: 'flex', gap: 2, marginBottom: 2 }}>
            <TextField
                 
              size='small'           
              label="Data Inicial"
              slotProps={{
                inputLabel: {
                  shrink: true,
                }}}
              type="date"
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
            />
            <TextField
              size='small'
              label="Data Final"
              type="date"
              slotProps={{
                inputLabel: {
                  shrink: true,
                }}}
              
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
            />
            <Button variant="contained" onClick={buscarAgendamentos}>
                <FilterList />
                <Typography variant="button">Filtrar</Typography>

            </Button>
          </Box>

          {exames.length > 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Data do Exame</TableCell>
                    <TableCell>Descrição</TableCell>
                    <TableCell>Usuário</TableCell>
                    <TableCell>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {exames.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell>{new Date(exam.exam_date).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>{exam.description}</TableCell>
                      <TableCell>{exam.user?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Tooltip title="Informações">
                          <IconButton onClick={(event) => handlePopoverOpen(event, exam)}>
                            <Info color="info" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Digitalizar Imagem">
                            <IconButton disabled={!exam.image_uploaded}>
                                <Scanner color={exam.image_uploaded?"disabled":"success"} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Enviar exame por email">

                            <IconButton disabled={exam.image_uploaded}>
                                <Send color={exam.image_uploaded?"success":"disabled"} />
                            </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handlePopoverClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
          >
            <Paper elevation={3} sx={{ padding: 2, maxWidth: 400 }}>
              {selectedExamInfo && (
                <>
                  <Typography variant="h6" component="div" gutterBottom>
                    Informações do Exame
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Data do Exame: {selectedExamInfo.exam_date}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Descrição: {selectedExamInfo.description}
                  </Typography>
                  <Typography variant="h6" component="div" gutterBottom>
                    Informações do Usuário
                  </Typography>
                  {selectedExamInfo.user ? (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        Nome: {selectedExamInfo.user.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Email: {selectedExamInfo.user.email}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        CPF: {selectedExamInfo.user.cpf}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Telefone: {selectedExamInfo.user.phone}
                      </Typography>
                      <Typography variant="subtitle2" component="div" mt={2}>
                        Endereços:
                      </Typography>
                      <List>
                        {selectedExamInfo.user.address &&
                          (
                            (typeof selectedExamInfo.user.address === "string"
                              ? JSON.parse(selectedExamInfo.user.address)
                              : selectedExamInfo.user.address) || []
                          ).map((endereco: any) => (
                            <ListItem key={endereco.id}>
                              <ListItemText
                                primary={`${endereco.logradouro}, ${endereco.numero}`}
                                secondary={`${endereco.bairro} - ${endereco.cidade}, ${endereco.estado} - CEP: ${endereco.cep}`}
                              />
                            </ListItem>
                          ))}
                      </List>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Usuário não encontrado
                    </Typography>
                  )}
                </>
              )}
            </Paper>
          </Popover>
        </Box>
      </Paper>
    </Container>
  );
}