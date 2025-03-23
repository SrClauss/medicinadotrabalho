import { useState, useEffect } from 'react';
import { useParams} from 'react-router-dom';
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
import { Delete, FilterList, Info, Scanner, Send } from '@mui/icons-material';
import TitleForm from '../../components/TitleForm/TitleForm';
import { useUser } from '../../contexts/UserContext/UserContext';
import UploadImagesModal from '../../components/UploadImagesModal/UploadImagesModal';

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
  const { isAdmin } = useUser();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  

  useEffect(() => {
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

  // Função para enviar exame por email usando a rota configurada
  const enviarExamePorEmail = async (examId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/exames/notificar_exame_pronto/${examId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        alert("Exame enviado por email com sucesso!");
        buscarAgendamentos(); // Atualiza a lista se necessário
      } else {
        alert("Erro ao enviar exame por email");
      }
    } catch (error) {
      console.error("Erro ao enviar exame por email:", error);
      alert("Erro ao enviar exame por email");
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
  const handleDeleteExam = async (examId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este exame?")) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL}/exames/deletar/${examId}`,
          {
            method: "DELETE",
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
        if (response.ok) {
          buscarAgendamentos();
        } else {
          console.error('Erro ao excluir exame:', response.status);
        }
      } catch (error) {
        console.error('Erro ao excluir exame:', error);
      }
    }
  };

  const handleOpenUploadModal = (exam: Exam) => {
    setSelectedExam(exam);
    setIsUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
    setSelectedExam(null);
    buscarAgendamentos();
  };

  return (
    <Container>
      <Paper elevation={3}>
        <TitleForm title={`Agendamentos da Empresa: ${nomeEmpresa}`} id="title-agendamentos-empresa" />
        <Box sx={{ padding: 2 }}>
          <Typography variant="h6" gutterBottom>
            Filtrar Agendamentos
          </Typography>
          <Divider sx={{ margin: "20px 0px" }} />
          <Box sx={{ display: 'flex', gap: 2, marginBottom: 2 }}>
            <TextField
              size='small'
              label="Data Inicial"
              slotProps={{ inputLabel: { shrink: true } }}
              type="date"
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
            />
            <TextField
              size='small'
              label="Data Final"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
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
                        <Tooltip title="Obter imagem">
                          <span>
                            <IconButton
                              onClick={() => handleOpenUploadModal(exam)}
                              disabled={exam.image_uploaded}
                            >
                              <Scanner color={exam.image_uploaded ? "disabled" : "success"} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Enviar exame por email">
                          <span>
                            <IconButton
                              disabled={!exam.image_uploaded}
                              onClick={() => enviarExamePorEmail(exam.id)}
                            >
                              <Send color={exam.image_uploaded ? "success" : "disabled"} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        {isAdmin() && (
                          <Tooltip title="Deletar">
                            <IconButton onClick={() => handleDeleteExam(exam.id)}>
                              <Delete color="error" />
                            </IconButton>
                          </Tooltip>
                        )}
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
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
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
      {selectedExam && (
        <UploadImagesModal
          open={isUploadModalOpen}
          onClose={handleCloseUploadModal}
          examId={selectedExam.id}
          name={selectedExam.user?.name || 'N/A'}
        />
      )}
    </Container>
  );
}