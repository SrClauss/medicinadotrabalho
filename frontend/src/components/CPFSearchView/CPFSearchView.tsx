import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper,
    Tooltip, IconButton, List, ListItem, ListItemText,
    Alert, TextField, Button, Snackbar
} from '@mui/material';
import { EventNote, Delete, Edit } from "@mui/icons-material";
import Usuario from '../../interfaces/Usuario';
import { Link } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext/UserContext';
import TitleForm from '../TitleForm/TitleForm';

const CPFSearchView = () => {
    const [cpf, setCpf] = useState('');
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { isAdmin } = useUser();
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

    useEffect(() => {
        if (!cpf) {
            setUsuario(null);
            setError(null);
        }
    }, [cpf]);

    const handleSearch = async () => {
        setError(null);
        setUsuario(null);

        if (!cpf) {
            setError('Por favor, insira um CPF.');
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_BASE_URL}/usuario/find_by_cpf/${cpf}`);
            if (response.ok) {
                const data = await response.json();
                setUsuario(data);
            } else if (response.status === 404) {
                setError('Nenhum usuário encontrado com este CPF.');
                setUsuario(null);
            } else {
                setError('Erro ao buscar usuário.');
                setUsuario(null);
            }
        } catch (error: any) {
            setError('Erro ao conectar com o servidor.');
            setUsuario(null);
        }
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
                    setUsuario(null);
                    setCpf('');
                } else {
                    showSnackbar("Erro ao excluir usuário.", 'error');
                }
            } catch (error) {
                console.error("Erro ao excluir usuário:", error);
                showSnackbar("Erro ao conectar com o servidor.", 'error');
            }
        }
    };

    return (
        <Paper elevation={3} sx={{ padding: 3, maxWidth: 1000, margin: 4} }>
            <TitleForm title="Buscar Usuário por CPF" id="title-busca-cpf" />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', marginBottom: 2 }}>
                <TextField
                    size='small'
                    label="CPF"
                    variant="outlined"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    fullWidth
                />
                <Button variant="contained" onClick={handleSearch}>
                    Pesquisar
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ marginBottom: 2 }}>{error}</Alert>
            )}

            {usuario && (
                <Box mt={3}>
                    <Typography variant="h6" component="div" gutterBottom>
                        {usuario.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        ID: {usuario.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Email: {usuario.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Telefone: {usuario.phone}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        CPF: {usuario.cpf}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Role: {usuario.role}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Ativo: {usuario.ativo ? "Sim" : "Não"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Criado em: {usuario.created_at}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Atualizado em: {usuario.updated_at}
                    </Typography>
                    <Typography variant="subtitle2" component="div" mt={2}>
                        Endereços:
                    </Typography>
                    <List>
                        {usuario.address &&
                            ((typeof usuario.address === 'string'
                                ? JSON.parse(usuario.address)
                                : usuario.address) || []).map((endereco: any) => (
                                    <ListItem key={endereco.id}>
                                        <ListItemText
                                            primary={`${endereco.logradouro}, ${endereco.numero}`}
                                            secondary={`${endereco.bairro} - ${endereco.cidade}, ${endereco.estado} - CEP: ${endereco.cep}`}
                                        />
                                    </ListItem>
                                ))}
                    </List>
                    <Box mt={2} display="flex" gap={1}>
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
                    </Box>
                </Box>
            )}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Paper>
    );
};

export default CPFSearchView;