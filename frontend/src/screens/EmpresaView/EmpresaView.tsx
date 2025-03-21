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
  Tooltip,
  Popover,
  Typography,
  List,
  ListItem,
  ListItemText,
  TableContainer,
  FormControl,
  Select,
  MenuItem,
  Pagination,
  Fab,
} from "@mui/material";
import SearchBar from "../../components/SearchBar/SearchBar";
import { Info, EventNote, Delete, Edit, Add } from "@mui/icons-material";
import TitleForm from "../../components/TitleForm/TitleForm";
import { useEffect, useState, useCallback } from "react";
import { useUser } from "../../contexts/UserContext/UserContext";
import Empresa from "../../interfaces/Empresa";
import { Link, useParams } from "react-router-dom";
import { SelectChangeEvent } from "@mui/material";

export default function EmpresaView() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [selectedEmpresa, setSelectedEmpresa] = useState<any>(null);
  const { isAdmin } = useUser();
  const [critery, setCritery] = useState<string>("");
  const [searchPerformed, setSearchPerformed] = useState<boolean>(false);
  const { searchTerm } = useParams<{ searchTerm?: string }>();

  // Novos estados para paginação
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  const fetchEmpresas = useCallback(() => {
    let url = `${
      import.meta.env.VITE_BASE_URL
    }/empresas/all/${currentPage}/${limit}`;
    if (critery !== "") {
      url = `${
        import.meta.env.VITE_BASE_URL
      }/empresas/find_by_substring/${critery}/${currentPage}/${limit}`;
    }

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        // Atualiza a lista de empresas e o total de páginas
        if (data.list && Array.isArray(data.list)) {
          setEmpresas(data.list);
          setTotalPages(data.pages || 1);
        } else if (Array.isArray(data)) {
          // Compatibilidade com endpoint /all que pode retornar apenas array
          setEmpresas(data);
          setTotalPages(1);
        }
      })
      .finally(() => setSearchPerformed(true));
  }, [critery, currentPage, limit]);

  useEffect(() => {
    if (searchTerm) {
      setCritery(searchTerm);
      setCurrentPage(1); // Reseta para primeira página em nova busca
      setSearchPerformed(true);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (searchPerformed) {
      fetchEmpresas();
    }
  }, [searchPerformed, fetchEmpresas]);

  const handleSearch = (searchTerm: string) => {
    setCritery(searchTerm);
    setCurrentPage(1); // Reseta para primeira página em nova busca
    setSearchPerformed(true);
  };

  const handlePageChange = (
    _: React.ChangeEvent<unknown>,
    page: number
  ) => {
    setCurrentPage(page);
    setSearchPerformed(true);
  };

  const handleLimitChange = (event: SelectChangeEvent<number>) => {
    setLimit(Number(event.target.value));
    setCurrentPage(1); // Reseta para primeira página ao mudar o limite
    setSearchPerformed(true);
  };

  const handlePopoverOpen = (
    event: React.MouseEvent<HTMLButtonElement>,
    empresa: any
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedEmpresa(empresa);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
    setSelectedEmpresa(null);
  };

  const handleDeleteEmpresa = async (empresaId: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta empresa?")) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL}/empresa/deletar/${empresaId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          alert("Empresa excluída com sucesso!");
          setEmpresas(empresas.filter((empresa) => empresa.id !== empresaId));
          // Recarregar dados se a página ficar vazia após exclusão
          if (empresas.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
          }
          setSearchPerformed(true);
        } else {
          alert("Erro ao excluir empresa.");
        }
      } catch (error) {
        console.error("Erro ao excluir empresa:", error);
        alert("Erro ao conectar com o servidor.");
      }
    }
  };

  // Componente para os controles de paginação que será reutilizado
  const PaginationControls = () => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginY: 2,
        gap: 2, // Adiciona um espaçamento entre os elementos
      }}
    >
      <FormControl variant="outlined" size="small">
        <Select
          value={limit}
          onChange={handleLimitChange}
          displayEmpty
          inputProps={{ "aria-label": "Itens por página" }}
        >
          <MenuItem value={5}>5 por página</MenuItem>
          <MenuItem value={10}>10 por página</MenuItem>
          <MenuItem value={25}>25 por página</MenuItem>
          <MenuItem value={50}>50 por página</MenuItem>
          <MenuItem value={100}>100 por página</MenuItem>
        </Select>
      </FormControl>
      <Pagination
        count={totalPages}
        page={currentPage}
        onChange={handlePageChange}
        color="primary"
        showFirstButton
        showLastButton
      />
    </Box>
  );

  const open = Boolean(anchorEl);

  return (
    <Container>
      <Paper elevation={3}>
        <TitleForm title="Visualizar Empresas" id="title-visualizar-empresa" />
        <SearchBar onSearch={handleSearch} label="Pesquisar" />
        <Box sx={{ padding: 2 }}>
          {/* Controles de paginação no início da tabela */}
          {empresas.length > 0 && <PaginationControls />}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width={150}>Nome</TableCell>
                  <TableCell width={150}>Email</TableCell>
                  <TableCell width={150}>Info</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {empresas.map((empresa: any) => (
                  <TableRow key={empresa.id}>
                    <TableCell>{empresa.name}</TableCell>
                    <TableCell>{empresa.email}</TableCell>
                    <TableCell>
                      <Tooltip title="Informações">
                        <IconButton
                          onClick={(event) => handlePopoverOpen(event, empresa)}
                        >
                          <Info color="info" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Agendamentos">
                        <IconButton
                          component={Link}
                          to={`/agendamento-empresa/${empresa.id}`}
                        >
                          <EventNote color="warning" />
                        </IconButton>
                      </Tooltip>
                      {isAdmin() && (
                        <>
                          <Tooltip title="Editar">
                            <IconButton
                              component={Link}
                              to={`/editar-empresa/${empresa.id}`}
                            >
                              <Edit color="primary" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Deletar">
                            <IconButton
                              onClick={() => handleDeleteEmpresa(empresa.id)}
                            >
                              <Delete color="error" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Controles de paginação no final da tabela */}
          {empresas.length > 0 && <PaginationControls />}
        </Box>

        <Popover
          open={open}
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
          <Paper elevation={3} sx={{ padding: 2, maxWidth: 400 }}>
            {selectedEmpresa && (
              <>
                <Typography variant="h6" component="div" gutterBottom>
                  {selectedEmpresa.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ID: {selectedEmpresa.id}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Email: {selectedEmpresa.email}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Telefone: {selectedEmpresa.phone}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  CNPJ: {selectedEmpresa.cnpj}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ativo: {selectedEmpresa.ativo ? "Sim" : "Não"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Criado em: {selectedEmpresa.created_at}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Atualizado em: {selectedEmpresa.updated_at}
                </Typography>
                <Typography variant="subtitle2" component="div" mt={2}>
                  Endereços:
                </Typography>
                <List>
                  {selectedEmpresa.address &&
                    (
                      (typeof selectedEmpresa.address === "string"
                        ? JSON.parse(selectedEmpresa.address)
                        : selectedEmpresa.address) || []
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
            )}
          </Paper>
        </Popover>
      </Paper>

      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: "fixed",
          bottom: 90,
          right: 20,
        }}
        component={Link}
        to="/cadastro-empresa" // Adapte a rota conforme necessário
      >
        <Add />
      </Fab>
    </Container>
  );
}