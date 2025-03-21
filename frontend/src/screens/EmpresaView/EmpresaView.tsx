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
} from "@mui/material";
import SearchBar from "../../components/SearchBar/SearchBar";
import { Info, EventNote, Delete, Edit } from "@mui/icons-material";
import TitleForm from "../../components/TitleForm/TitleForm";
import { useEffect, useState, useCallback } from "react";
import { useUser } from "../../contexts/UserContext/UserContext";
import Empresa from "../../interfaces/Empresa";
import { Link, useParams } from "react-router-dom";

export default function EmpresaView() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [selectedEmpresa, setSelectedEmpresa] = useState<any>(null);
  const { isAdmin } = useUser(); // Apenas mudando para usar isAdmin em vez de user
  const [critery, setCritery] = useState<string>('');
  const [searchPerformed, setSearchPerformed] = useState<boolean>(false);
  const { searchTerm } = useParams<{ searchTerm?: string }>();

  const fetchEmpresas = useCallback(() => {
    let url = import.meta.env.VITE_BASE_URL + "/empresas/all";
    if (critery !== '') {
      url = import.meta.env.VITE_BASE_URL + "/empresas/find_by_substring/" + critery;
    }

    fetch(url)
      .then((response) => response.json())
      .then((data) => setEmpresas(data))
      .finally(() => setSearchPerformed(true));
  }, [critery]);

  useEffect(() => {
    if (searchTerm) {
      setCritery(searchTerm);
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
    setSearchPerformed(true);
  };

  const handlePopoverOpen = (event: React.MouseEvent<HTMLButtonElement>, empresa: any) => {
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
        } else {
          alert("Erro ao excluir empresa.");
        }
      } catch (error) {
        console.error("Erro ao excluir empresa:", error);
        alert("Erro ao conectar com o servidor.");
      }
    }
  };

  const open = Boolean(anchorEl);

  return (
    <Container>
      <Paper elevation={3}>
        <TitleForm title="Visualizar Empresa" id="title-visualizar-empresa" />
        <SearchBar onSearch={handleSearch} label="Pesquisar" />
        <Box sx={{ display: "flex", justifyContent: "flex-end", padding: 2 }}>
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
                        <IconButton onClick={(event) => handlePopoverOpen(event, empresa)}>
                          <Info color="info" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Agendamentos">
                        <IconButton>
                          <EventNote color="warning" />
                        </IconButton>
                      </Tooltip>
                      {isAdmin() && ( // Aqui é a única mudança
                        <>
                          <Tooltip title="Editar">
                            <IconButton component={Link} to={`/editar-empresa/${empresa.id}`}>
                              <Edit color="primary" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Deletar">
                            <IconButton onClick={() => handleDeleteEmpresa(empresa.id)}>
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
                    ((typeof selectedEmpresa.address === 'string' 
                      ? JSON.parse(selectedEmpresa.address) 
                      : selectedEmpresa.address) || []).map((endereco: any) => (
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
    </Container>
  );
}