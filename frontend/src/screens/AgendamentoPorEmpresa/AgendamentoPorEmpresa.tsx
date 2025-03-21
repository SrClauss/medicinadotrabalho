import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Paper,
  Box,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Tooltip,
  Popover,
  Typography,
  List,
  ListItem,
  ListItemText,
  TableContainer,
  TextField,
  Collapse,
  Alert,
  Snackbar,
  CircularProgress,
  Fab,
  Modal,
} from "@mui/material";
import {
  Info,
  Add,
  Remove,
  Visibility,
  VisibilityOff,
  ExpandMore,
  ExpandLess,
  Send,
  PersonAdd,
  Close,
} from "@mui/icons-material";
import TitleForm from "../../components/TitleForm/TitleForm";
import SearchBar from "../../components/SearchBar/SearchBar";
import Usuario from "../../interfaces/Usuario";
import { useUser } from "../../contexts/UserContext/UserContext";
import CadastroUsuario from "../CadastroUsuario/CadastroUsuario";

// Estilo para o modal
const modalStyle = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "80%",
  maxWidth: 800,
  maxHeight: "90vh",
  overflow: "auto",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

export default function AgendamentoPorEmpresa() {
  // Parâmetros da URL (ID da empresa)
  const { companyId } = useParams<{ companyId: string }>();

  // Estados
  const [searchResults, setSearchResults] = useState<Usuario[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Usuario[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(true);
  const [relatedUsers, setRelatedUsers] = useState<Usuario[]>([]);
  const [showRelatedUsers, setShowRelatedUsers] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [selectedUserInfo, setSelectedUserInfo] = useState<Usuario | null>(
    null
  );

  // Estado para o modal de cadastro de usuário
  const [openCadastroModal, setOpenCadastroModal] = useState<boolean>(false);

  // Estados para agendamento
  const [showSchedulePanel, setShowSchedulePanel] = useState<boolean>(false);

  // Formatando a data atual para o formato YYYY-MM-DD para o campo de data
  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0];
  const [examDate, setExamDate] = useState<string>(formattedDate);

  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

  // Context
  const { token } = useUser();

  // Função para buscar usuários com base no termo de busca
  const handleSearch = async (term: string) => {
    if (term.trim() === "") {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BASE_URL
        }/usuarios/find_by_substring/${term}/1/10`
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(Array.isArray(data.list) ? data.list : []);
        // Sempre mostrar os resultados quando há uma busca bem-sucedida
        setShowSearchResults(true);
      } else {
        console.error("Erro ao buscar usuários");
        showSnackbar("Erro ao buscar usuários", "error");
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      showSnackbar("Erro na requisição", "error");
    }
  };

  // Função para buscar usuários relacionados à empresa
  const fetchRelatedUsers = async () => {
    if (!companyId) return;

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BASE_URL
        }/exames/usuarios_por_empresa/${companyId}`
      );

      if (response.ok) {
        const data = await response.json();
        setRelatedUsers(Array.isArray(data) ? data : []);
      } else {
        console.error("Erro ao buscar usuários relacionados");
        showSnackbar("Erro ao buscar usuários relacionados", "error");
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      showSnackbar("Erro na requisição", "error");
    }
  };

  // Efeito para buscar usuários relacionados quando o componente montar
  useEffect(() => {
    if (companyId) {
      fetchRelatedUsers();
    }
  }, [companyId, token]);

  // Função para enviar os exames em lote
  const handleSubmitExams = async () => {
    if (selectedUsers.length === 0) {
      showSnackbar("Selecione pelo menos um usuário", "error");
      return;
    }

    if (!examDate) {
      showSnackbar("Selecione uma data para o exame", "error");
      return;
    }

    if (!description.trim()) {
      showSnackbar("Informe uma descrição para o exame", "error");
      return;
    }

    try {
      setIsSubmitting(true);

      const requestData = {
        company_id: companyId,
        users: selectedUsers.map((user) => user.id),
        exam_date: examDate,
        description,
      };

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/exames/criar_em_lote`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestData),
        }
      );

      if (response.ok) {
        const data = await response.json();
        showSnackbar(
          `${data.exams_created} exames agendados com sucesso!`,
          "success"
        );

        // Limpar os dados após o agendamento
        setSelectedUsers([]);
        setDescription("");
        setExamDate(formattedDate);
        setShowSchedulePanel(false);
        setShowSearchResults(true);

        // Recarregar usuários relacionados
        fetchRelatedUsers();
      } else {
        const errorData = await response.json();
        showSnackbar(`Erro: ${errorData.erro}`, "error");
      }
    } catch (error) {
      console.error("Erro ao agendar exames:", error);
      showSnackbar("Erro ao agendar exames", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manipulador para adicionar usuário à lista de selecionados
  const handleAddUser = (user: Usuario) => {
    setSelectedUsers((prev) => {
      if (prev.some((u) => u.id === user.id)) {
        return prev;
      }
      return [...prev, user];
    });
    setShowSearchResults(false);

    // Neste fluxo, os resultados de pesquisa permanecem visíveis até que o usuário feche
  };

  // Manipulador para remover usuário da lista de selecionados
  const handleRemoveUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((user) => user.id !== userId));
    if (selectedUsers.length <= 1) {
      setShowSearchResults(true);
    }
  };

  // Manipuladores para o Popover
  const handlePopoverOpen = (
    event: React.MouseEvent<HTMLButtonElement>,
    user: Usuario
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedUserInfo(user);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
    setSelectedUserInfo(null);
  };

  // Toggle para mostrar/ocultar usuários relacionados
  const toggleRelatedUsers = () => {
    setShowRelatedUsers((prev) => !prev);
  };

  // Toggle para mostrar/ocultar painel de agendamento
  const toggleSchedulePanel = () => {
    setShowSchedulePanel((prev) => !prev);
  };

  // Função para mostrar snackbar
  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Função para fechar snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Função para adicionar usuário recém-cadastrado à lista
  const handleAddNewUser = (user: Usuario) => {
    setSelectedUsers((prev) => {
      if (prev.some((u) => u.id === user.id)) {
        return prev;
      }
      return [...prev, user];
    });
    setOpenCadastroModal(false);
    showSnackbar(
      `Usuário ${user.name} cadastrado e adicionado com sucesso!`,
      "success"
    );
  };

  return (
    <Container>
      <Paper elevation={3}>
        <TitleForm
          title="Agendamento por Empresa"
          id="title-agendamento-empresa"
        />

        {/* SearchBar */}
        <Box sx={{ padding: 2 }}>
          <SearchBar onSearch={handleSearch} label="Pesquisar usuário" />
        </Box>

        {/* Tabela de resultados da pesquisa */}
        {searchResults.length > 0 && showSearchResults && (
          <Box sx={{ padding: 2 }}>
            <Paper elevation={2}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  padding: "8px 16px",
                  borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => setShowSearchResults(false)}
                  aria-label="fechar resultados"
                >
                  <Close />
                </IconButton>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nome</TableCell>
                      <TableCell>CPF</TableCell>
                      <TableCell>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {searchResults.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.cpf}</TableCell>
                        <TableCell>
                          <Tooltip title="Informações">
                            <IconButton
                              onClick={(event) =>
                                handlePopoverOpen(event, user)
                              }
                            >
                              <Info color="info" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Adicionar">
                            <IconButton onClick={() => handleAddUser(user)}>
                              <Add color="primary" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        )}

        {/* Tabela de usuários selecionados */}
        {selectedUsers.length > 0 && (
          <Box sx={{ padding: 2 }}>
            <Typography variant="h6" gutterBottom>
              Usuários Selecionados ({selectedUsers.length})
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>CPF</TableCell>
                    <TableCell>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.cpf}</TableCell>
                      <TableCell>
                        <Tooltip title="Informações">
                          <IconButton
                            onClick={(event) => handlePopoverOpen(event, user)}
                          >
                            <Info color="info" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remover">
                          <IconButton onClick={() => handleRemoveUser(user.id)}>
                            <Remove color="error" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Botões para ações com usuários selecionados */}
            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                color="secondary"
                onClick={toggleSchedulePanel}
                startIcon={showSchedulePanel ? <ExpandLess /> : <ExpandMore />}
              >
                {showSchedulePanel ? "Ocultar Agendamento" : "Agendar Exames"}
              </Button>
            </Box>

            {/* Painel de agendamento */}
            <Collapse in={showSchedulePanel} sx={{ mt: 2 }}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Agendar Exames
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <TextField
                    label="Data do Exame"
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    fullWidth
                  />

                  <TextField
                    label="Descrição do Exame"
                    multiline
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    fullWidth
                  />

                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleSubmitExams}
                    disabled={
                      isSubmitting ||
                      !examDate ||
                      !description.trim() ||
                      selectedUsers.length === 0
                    }
                    startIcon={
                      isSubmitting ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <Send />
                      )
                    }
                  >
                    {isSubmitting ? "Enviando..." : "Agendar Exames"}
                  </Button>
                </Box>
              </Paper>
            </Collapse>
          </Box>
        )}

        {/* Botão para mostrar/ocultar usuários relacionados */}
        {relatedUsers.length > 0 && (
          <Box sx={{ padding: 2 }}>
            <Button
              variant="outlined"
              startIcon={showRelatedUsers ? <VisibilityOff /> : <Visibility />}
              onClick={toggleRelatedUsers}
            >
              {showRelatedUsers ? "Ocultar" : "Mostrar"} Usuários com Exames
            </Button>
          </Box>
        )}

        {/* Tabela de usuários relacionados */}
        {showRelatedUsers && relatedUsers.length > 0 && (
          <Box sx={{ padding: 2 }}>
            <Typography variant="h6" gutterBottom>
              Usuários com Exames nesta Empresa
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>CPF</TableCell>
                    <TableCell>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {relatedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.cpf}</TableCell>
                      <TableCell>
                        <Tooltip title="Informações">
                          <IconButton
                            onClick={(event) => handlePopoverOpen(event, user)}
                          >
                            <Info color="info" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Adicionar">
                          <IconButton onClick={() => handleAddUser(user)}>
                            <Add color="primary" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Popover para exibir informações detalhadas do usuário */}
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handlePopoverClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
        >
          {selectedUserInfo && (
            <Paper elevation={3} sx={{ padding: 2, maxWidth: 400 }}>
              <Typography variant="h6" component="div" gutterBottom>
                {selectedUserInfo.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Email: {selectedUserInfo.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                CPF: {selectedUserInfo.cpf}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Telefone: {selectedUserInfo.phone}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Função: {selectedUserInfo.role === 0 ? "Admin" : "Usuário"}
              </Typography>
              <Typography variant="subtitle2" component="div" mt={2}>
                Endereços:
              </Typography>
              <List>
                {selectedUserInfo.address &&
                  (
                    (typeof selectedUserInfo.address === "string"
                      ? JSON.parse(selectedUserInfo.address)
                      : selectedUserInfo.address) || []
                  ).map((endereco: any) => (
                    <ListItem key={endereco.id}>
                      <ListItemText
                        primary={`${endereco.logradouro}, ${endereco.numero}`}
                        secondary={`${endereco.bairro} - ${endereco.cidade}, ${endereco.estado} - CEP: ${endereco.cep}`}
                      />
                    </ListItem>
                  ))}
              </List>
            </Paper>
          )}
        </Popover>
      </Paper>

      {/* Botão flutuante para adicionar novo usuário */}
      <Fab
        color="primary"
        sx={{ position: "fixed", bottom: "5rem", right: "2rem" }}
        onClick={() => setOpenCadastroModal(true)}
      >
        <PersonAdd />
      </Fab>

      {/* Modal para cadastro de novo usuário */}
      <Modal
        open={openCadastroModal}
        onClose={() => setOpenCadastroModal(false)}
        aria-labelledby="modal-cadastro-usuario"
        aria-describedby="modal-para-cadastrar-novo-usuario"
      >
        <Box sx={modalStyle}>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <IconButton onClick={() => setOpenCadastroModal(false)}>
              <Close />
            </IconButton>
          </Box>
          <CadastroUsuario onAddUser={handleAddNewUser} isModal={true} />
        </Box>
      </Modal>

      {/* Snackbar para mensagens */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}
