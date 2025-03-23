import { useState } from "react";
import {
  Alert,
  Button,
  Container,
  Fade,
  IconButton,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import TitleForm from "../../components/TitleForm/TitleForm";
import CloseIcon from "@mui/icons-material/Close";

export default function RecuperacaoSenha() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const handleSendRecuperationEmail = async () => {
    const route = `${import.meta.env.VITE_BASE_URL}/recover-password`;
    try {
      const response = await fetch(route, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erro ao enviar email de recuperação de senha"
        );
      }

      setSuccessMessage("Email de recuperação de senha enviado com sucesso!");
      setTimeout(() => navigate("/login"), 1000);
    } catch (error) {
      console.error("Erro ao enviar email de recuperação de senha:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao enviar email de recuperação de senha"
      );
    }
  };

  const handleCloseAlert = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  return (
    <Container
      sx={{ display: "flex", justifyContent: "center", alignItems: "center"}}
    >
      <Paper
        elevation={5}
        sx={{
          padding: 3,
          marginTop: {md: 20, xs: 5},
          maxWidth: 450,
          width: "100%",
          borderRadius: 3,
        }}
      >
        <TitleForm title="Recuperação de Senha" id="recuperacao-senha-title" />

        <Typography
          variant="subtitle1"
          color="textSecondary"
          align="center"
          sx={{ mt: 2, mb: 2 }}
        >
          Informe seu email para recuperar a senha
        </Typography>

        <TextField
          label="Email"
          variant="outlined"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleSendRecuperationEmail}
          sx={{ mt: 2, mb: 2, py: 1.5, borderRadius: 2 }}
        >
          Enviar Email
        </Button>

        {errorMessage && (
          <Fade in={!!errorMessage}>
            <Alert
              severity="error"
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={handleCloseAlert}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
              sx={{ mt: 2 }}
            >
              {errorMessage}
            </Alert>
          </Fade>
        )}

        {successMessage && (
          <Fade in={!!successMessage}>
            <Alert
              severity="success"
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={handleCloseAlert}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
              sx={{ mt: 2 }}
            >
              {successMessage}
            </Alert>
          </Fade>
        )}
      </Paper>
    </Container>
  );
}