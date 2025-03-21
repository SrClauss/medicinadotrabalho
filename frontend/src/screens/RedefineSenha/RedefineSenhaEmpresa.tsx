import { useParams } from "react-router-dom";
import { Paper, FormControl, Button, TextField, IconButton, InputAdornment, Alert } from "@mui/material";
import { Box, Container } from "@mui/system";
import TitleForm from "../../components/TitleForm/TitleForm";
import { useState } from "react";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from "react-router-dom";

export default function RedefineSenhaEmpresa() {
    const { token } = useParams<{ token: string }>();
    const [senha, setSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [showSenha, setShowSenha] = useState(false);
    const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
    const navigate = useNavigate();
    const [alert, setAlert] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
        open: false,
        message: "",
        severity: "success",
    });

    const handleRedefineSenha = async () => {
        const baseUrl = import.meta.env.VITE_BASE_URL;
        if (senha !== confirmarSenha) {
            setAlert({ open: true, message: "As senhas não conferem", severity: "error" });
            return;
        }

        fetch(`${baseUrl}/empresa/confirmar_redefinicao`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token,
                password: senha,
            }),
        })
            .then((response) => {
                if (response.ok) {
                    setAlert({ open: true, message: "Senha redefinida com sucesso!", severity: "success" });
                } else {
                    setAlert({ open: true, message: "Erro ao redefinir senha", severity: "error" });
                }
                navigate("/login");
            })
            .catch((error) => {
                console.error("Erro ao redefinir senha", error);
                setAlert({ open: true, message: "Erro ao redefinir senha", severity: "error" });
                navigate("/login");
            });
    };

    return (
        <>
            <Container>
                <Paper
                    elevation={3}
                    sx={{
                        padding: { md: 5, xs: 2 },
                        margin: { md: "40px 300px", xs: "40px 20px" },
                        borderRadius: 2,
                    }}
                >
                    <TitleForm title="Redefinir Senha" id={"title-redefinicao"} />
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            padding: 2,
                            gap: 2,
                        }}
                    >
                        {alert.open && (
                            <Alert severity={alert.severity} onClose={() => setAlert({ ...alert, open: false })}>
                                {alert.message}
                            </Alert>
                        )}
                        <FormControl>
                            <TextField
                                id="senha"
                                label="Nova Senha"
                                type={showSenha ? "text" : "password"}
                                variant="outlined"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowSenha(prev => !prev)} edge="end">
                                                {showSenha ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </FormControl>
                        <FormControl>
                            <TextField
                                id="confirmar-senha"
                                label="Confirmar Senha"
                                type={showConfirmarSenha ? "text" : "password"}
                                variant="outlined"
                                value={confirmarSenha}
                                onChange={(e) => setConfirmarSenha(e.target.value)}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowConfirmarSenha(prev => !prev)} edge="end">
                                                {showConfirmarSenha ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </FormControl>
                        <Button onClick={handleRedefineSenha} variant="contained" color="primary">
                            Redefinir Senha
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </>
    );
}