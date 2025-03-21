
import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Snackbar,
  TextField,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext/UserContext";
import TitleForm from "../../components/TitleForm/TitleForm";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const { setToken, fetchUserData } = useUser();
  const handlePopulate = async () => {
    try {
      const baseUrl = import.meta.env.VITE_BASE_URL;
      const response = await fetch(`${baseUrl}/populate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Verifica se a resposta não foi bem-sucedida
      if (!response.ok) {
        const errorData = await response.json(); // Captura a mensagem de erro do backend
        throw new Error(errorData.message || "Erro ao popular o banco de dados");
      }

      setSuccessMessage("Banco de dados populado com sucesso!");
    } catch (error) {
      console.error("Erro ao popular o banco de dados:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao popular o banco de dados"
      );
    }
  }


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

      // Verifica se a resposta não foi bem-sucedida
      if (!response.ok) {
        const errorData = await response.json(); // Captura a mensagem de erro do backend
        throw new Error(errorData.message || "Erro ao fazer login");
      }

      const data = await response.json();
      setToken(data.token); // Armazena o token JWT
      await fetchUserData(); // Busca os dados do usuário com o token
      
      setSuccessMessage("Login realizado com sucesso!");
      setTimeout(() => navigate("/"), 1000);
    } catch (error) {
      console.error("Erro ao logar:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao fazer login"
      );
    }
  };

  const handleCloseSnackbar = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  return (
    <Container sx={{ display: "flex", justifyContent: "center" }}>
      {/* Alertas de erro/sucesso */}

      <Paper
        elevation={3}
        sx={{ padding: 2, marginTop: 10, maxWidth: 450, width: "100%" }}
      > 
      <Button variant="contained" onClick={handlePopulate}>
        Popular banco de dados
      </Button>
        <TitleForm title="Login" id="title-login" />
        <Snackbar
          open={!!errorMessage || !!successMessage}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          
          sx={{position: "absolute", top: 0}}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={errorMessage ? "error" : "success"}
            sx={{ width: "100%" }}
          >
            {errorMessage || successMessage}
          </Alert>
        </Snackbar>

        <Box
          component="form"
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <TextField
            sx={{ marginTop: 2 }}
            label="Email"
            variant="outlined"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            sx={{ marginBottom: 2 }}
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
