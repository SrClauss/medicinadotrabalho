import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper,
    Tooltip, IconButton, List, ListItem, ListItemText,
    Alert, TextField, Button, Snackbar
} from '@mui/material';
import { EventNote, Delete, Edit, CalendarToday } from "@mui/icons-material";
import Empresa from '../../interfaces/Empresa';
import { Link } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext/UserContext';
import TitleForm from '../TitleForm/TitleForm';

const CNPJSearchView = () => {
    const [cnpj, setCnpj] = useState('');
    const [empresa, setEmpresa] = useState<Empresa | null>(null);
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
        if (!cnpj) {
            setEmpresa(null);
            setError(null);
        }
    }, [cnpj]);

    const handleSearch = async () => {
        setError(null);
        setEmpresa(null);

        if (!cnpj) {
            setError('Por favor, insira um CNPJ.');
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_BASE_URL}/empresas/find_by_cnpj/${cnpj}`);
            if (response.ok) {
                const data = await response.json();
                setEmpresa(data);
            } else if (response.status === 404) {
                setError('Nenhuma empresa encontrada com este CNPJ.');
                setEmpresa(null);
            } else {
                setError('Erro ao buscar empresa.');
                setEmpresa(null);
            }
        } catch (error: any) {
            setError('Erro ao conectar com o servidor.');
            setEmpresa(null);
        }
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
                    showSnackbar("Empresa excluída com sucesso!", 'success');
                    setEmpresa(null);
                    setCnpj('');
                } else {
                    showSnackbar("Erro ao excluir empresa.", 'error');
                }
            } catch (error) {
                console.error("Erro ao excluir empresa:", error);
                showSnackbar("Erro ao conectar com o servidor.", 'error');
            }
        }
    };

    return (
        <Paper elevation={3} sx={{ padding: 3, maxWidth: 600, margin: 'auto' }}>
            <TitleForm title="Buscar Empresa por CNPJ" id="title-busca-cnpj" />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', marginBottom: 2 }}>
                <TextField
                    size='small'
                    label="CNPJ"
                    variant="outlined"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    fullWidth
                />
                <Button variant="contained" onClick={handleSearch}>
                    Pesquisar
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ marginBottom: 2 }}>{error}</Alert>
            )}

            {empresa && (
                <Box mt={3}>
                    <Typography variant="h6" component="div" gutterBottom>
                        {empresa.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        ID: {empresa.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Email: {empresa.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Telefone: {empresa.phone}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        CNPJ: {empresa.cnpj}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Ativo: {empresa.ativo ? "Sim" : "Não"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Criado em: {empresa.created_at}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Atualizado em: {empresa.updated_at}
                    </Typography>
                    <Typography variant="subtitle2" component="div" mt={2}>
                        Endereços:
                    </Typography>
                    <List>
                        {empresa.address &&
                            ((typeof empresa.address === 'string'
                                ? JSON.parse(empresa.address)
                                : empresa.address) || []).map((endereco: any) => (
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
                            <IconButton component={Link} to={`/agendamento-empresa/${empresa.id}`}>
                                <EventNote color="warning" />
                            </IconButton>
                        </Tooltip>
                         <Tooltip title="Ver agendamentos">
                            <IconButton
                              component={Link}
                              to={`/ver-agendamentos-por-empresa/${empresa.id}/${encodeURIComponent(empresa.name)}`}
                            >
                              <CalendarToday color="warning" />
                            </IconButton>
                          </Tooltip>
                        {isAdmin() && (
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

export default CNPJSearchView;