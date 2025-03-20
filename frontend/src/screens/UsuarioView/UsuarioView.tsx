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
import Usuario from "../../interfaces/Usuario";
import { Link, useParams } from "react-router-dom";

export default function UsuarioView() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [selectedUsuario, setSelectedUsuario] = useState<any>(null);
  const { user } = useUser();
  const [critery, setCritery] = useState<string>('');
  const [searchPerformed, setSearchPerformed] = useState<boolean>(false);
  const { searchTerm } = useParams<{ searchTerm?: string }>(); // Captura o searchTerm do useParams

  const fetchUsuarios = useCallback(() => {
    let url = import.meta.env.VITE_BASE_URL + "/usuarios/all";
    if (critery !== '') {
      url = import.meta.env.VITE_BASE_URL + "/usuarios/find_by_substring/" + critery;
    }

    fetch(url)
      .then((response) => response.json())
      .then((data) => setUsuarios(data))
      .finally(() => setSearchPerformed(true)); // Garante que searchPerformed seja true após a busca
  }, [critery]);

  useEffect(() => {
    if (searchTerm) {
      setCritery(searchTerm); // Define o critério de pesquisa com o searchTerm do useParams
      setSearchPerformed(true); // Inicia a busca automaticamente
    }
  }, [searchTerm]);

  useEffect(() => {
    if (searchPerformed) {
      fetchUsuarios();
    }
  }, [searchPerformed, fetchUsuarios]);

  const handleSearch = (searchTerm: string) => {
    setCritery(searchTerm);
    setSearchPerformed(true); // Define searchPerformed como true quando a pesquisa é realizada
  };

  const handlePopoverOpen = (event: React.MouseEvent<HTMLButtonElement>, usuario: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedUsuario(usuario);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
    setSelectedUsuario(null);
  };

  const handleDeleteUser = async (usuarioId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este usuário?")) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL}/usuario/deletar/${usuarioId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          alert("Usuário excluído com sucesso!");
          setUsuarios(usuarios.filter((usuario) => usuario.id !== usuarioId));
        } else {
          alert("Erro ao excluir usuário.");
        }
      } catch (error) {
        console.error("Erro ao excluir usuário:", error);
        alert("Erro ao conectar com o servidor.");
      }
    }
  };

  const open = Boolean(anchorEl);

  return (
    <Container>
      <Paper elevation={3}>
        <TitleForm title="Visualizar Usuário" id="title-visualizar-usuario" />
        <SearchBar onSearch={handleSearch} label="Pesquisar" />
        <Box sx={{ display: "flex", justifyContent: "flex-end", padding: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width={100}>Nome</TableCell>
                  <TableCell width={100}>Email</TableCell>
                  <TableCell width={50}>Info</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usuarios.map((usuario: any) => (
                  <TableRow key={usuario.id}>
                    <TableCell>{usuario.name}</TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>
                      <Tooltip title="Informações">
                        <IconButton onClick={(event) => handlePopoverOpen(event, usuario)}>
                          <Info color="info" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Agendamentos">
                        <IconButton>
                          <EventNote color="warning" />
                        </IconButton>
                      </Tooltip>
                      {user && user.role === 0 && (
                        <>
                          <Tooltip title="Editar">
                            <IconButton component={Link} to={`/editar-usuario/${usuario.id}`}>
                              <Edit color="primary" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Deletar">
                            <IconButton onClick={() => handleDeleteUser(usuario.id)}>
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
            {selectedUsuario && (
              <>
                <Typography variant="h6" component="div" gutterBottom>
                  {selectedUsuario.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ID: {selectedUsuario.id}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Email: {selectedUsuario.email}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Telefone: {selectedUsuario.phone}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  CPF: {selectedUsuario.cpf}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Role: {selectedUsuario.role}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ativo: {selectedUsuario.ativo ? "Sim" : "Não"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Criado em: {selectedUsuario.created_at}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Atualizado em: {selectedUsuario.updated_at}
                </Typography>
                <Typography variant="subtitle2" component="div" mt={2}>
                  Endereços:
                </Typography>
                <List>
                  {selectedUsuario.address &&
                    JSON.parse(selectedUsuario.address).map((endereco: any) => (
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