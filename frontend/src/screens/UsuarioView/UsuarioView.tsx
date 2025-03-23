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
    Snackbar,
    Alert
} from "@mui/material";
import SearchBar from "../../components/SearchBar/SearchBar";
import { Info, EventNote, Delete, Add, Edit } from "@mui/icons-material";
import TitleForm from "../../components/TitleForm/TitleForm";
import { useEffect, useState, useCallback } from "react";
import { useUser } from "../../contexts/UserContext/UserContext";
import Usuario from "../../interfaces/Usuario";
import { Link, useParams } from "react-router-dom";
import { SelectChangeEvent } from "@mui/material";

export default function UsuarioView() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [selectedUsuario, setSelectedUsuario] = useState<any>(null);
    const { isAdmin } = useUser();
    const [critery, setCritery] = useState<string>('');
    const [searchPerformed, setSearchPerformed] = useState<boolean>(false);
    const { searchTerm } = useParams<{ searchTerm?: string }>();
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

    const showSnackbar = (message: string, severity: 'success' | 'error') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };

    // Novos estados para paginação
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);

    const fetchUsuarios = useCallback(() => {
        let url = `${import.meta.env.VITE_BASE_URL}/usuarios/all/${currentPage}/${limit}`;
        if (critery !== '') {
            url = `${import.meta.env.VITE_BASE_URL}/usuarios/find_by_substring/${critery}/${currentPage}/${limit}`;
        }

        fetch(url)
            .then((response) => response.json())
            .then((data) => {
                // Atualiza a lista de usuários e o total de páginas
                if (data.list && Array.isArray(data.list)) {
                    setUsuarios(data.list);
                    setTotalPages(data.pages || 1);
                } else if (Array.isArray(data)) {
                    // Compatibilidade com endpoint /all que pode retornar apenas array
                    setUsuarios(data);
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
            fetchUsuarios();
        }
    }, [searchPerformed, fetchUsuarios]);

    const handleSearch = (searchTerm: string) => {
        setCritery(searchTerm);
        setCurrentPage(1); // Reseta para primeira página em nova busca
        setSearchPerformed(true);
    };

    const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
        setCurrentPage(page);
        setSearchPerformed(true);
    };

    const handleLimitChange = (event: SelectChangeEvent<number>) => {
        setLimit(Number(event.target.value));
        setCurrentPage(1); // Reseta para primeira página ao mudar o limite
        setSearchPerformed(true);
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
                    showSnackbar("Usuário excluído com sucesso!", 'success');
                    setUsuarios(usuarios.filter((usuario) => usuario.id !== usuarioId));
                    // Recarregar dados se a página ficar vazia após exclusão
                    if (usuarios.length === 1 && currentPage > 1) {
                        setCurrentPage(currentPage - 1);
                    }
                    setSearchPerformed(true);
                } else {
                    showSnackbar("Erro ao excluir usuário.", 'error');
                }
            } catch (error) {
                console.error("Erro ao excluir usuário:", error);
                showSnackbar("Erro ao conectar com o servidor.", 'error');
            }
        }
    };

    // Componente para os controles de paginação que será reutilizado
    const PaginationControls = () => (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginY: 2,
                gap: 2, // Adiciona um espaçamento entre os elementos
            }}
        >
            <FormControl variant="outlined" size="small">
                <Select
                    value={limit}
                    onChange={handleLimitChange}
                    displayEmpty
                    inputProps={{ 'aria-label': 'Itens por página' }}
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
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ maxWidth: 1000, margin: 'auto' }}>
                <TitleForm title="Visualizar Usuário" id="title-visualizar-usuario" />
                <SearchBar onSearch={handleSearch} label="Pesquisar" />
                <Box sx={{ padding: 2 }}>
                    {/* Controles de paginação no início da tabela */}
                    {usuarios.length > 0 && <PaginationControls />}

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
                                            {isAdmin() && (
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

                    {/* Controles de paginação no final da tabela */}
                    {usuarios.length > 0 && <PaginationControls />}
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
                                        ((typeof selectedUsuario.address === 'string'
                                            ? JSON.parse(selectedUsuario.address)
                                            : selectedUsuario.address) || []).map((endereco: any) => (
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
                    position: 'fixed',
                    bottom: 90,
                    right: 20,
                }}
                component={Link}
                to="/cadastro-usuario" // Adapte a rota conforme necessário
            >
                <Add />
            </Fab>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
}