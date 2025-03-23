import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Divider,
  IconButton
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext/UserContext";
import TitleForm from "../../components/TitleForm/TitleForm";
import CloseIcon from '@mui/icons-material/Close';

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<'success' | 'info' | 'warning' | 'error'>('error');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { setToken, fetchUserData } = useUser();

  const handleLogin = async () => {
    try {
      const baseUrl = import.meta.env.VITE_BASE_URL;
      const response = await fetch(`${baseUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password: senha,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Erro ao fazer login");
        setSeverity('error');
        setOpen(true);
        return;
      }

      setMessage(data.message || "Login realizado com sucesso!");
      setSeverity('success');
      setOpen(true);

      setToken(data.token);
      await fetchUserData();
      navigate("/");
    } catch (error) {
      console.error("Erro ao logar:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao fazer login"
      );
      setSeverity('error');
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Container sx={{ display: "flex", justifyContent: "center" }}>
      <Paper
        elevation={3}
        sx={{ padding: 2, marginTop: 10, maxWidth: 450, width: "100%" }}
      >
        <TitleForm title="Login" id="title-login" />
        {open && (
          <Alert
            severity={severity}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={handleClose}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{ mb: 2 }}
          >
            {message}
          </Alert>
        )}
        <Box
          component="form"
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            mt: 2,
          }}
        >
          <TextField
            label="Email"
            variant="outlined"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Senha"
            variant="outlined"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <Button variant="contained" onClick={handleLogin}>
            Entrar
          </Button>
          <Button variant="text" onClick={() => navigate("/redefine-senha")}>
            Esqueci minha senha
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}