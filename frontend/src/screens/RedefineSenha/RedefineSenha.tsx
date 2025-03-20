import { useParams } from "react-router-dom";
import { Paper, FormControl, Button, TextField, IconButton, InputAdornment } from "@mui/material";
import { Box, Container } from "@mui/system";
import TitleForm from "../../components/TitleForm/TitleForm";
import { useState } from "react";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from "react-router-dom";

export default function RedefineSenha() {
  const { token } = useParams<{ token: string }>();
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const navigate = useNavigate();
  const handleRedefineSenha = async () => {


    
    const baseUrl = import.meta.env.VITE_BASE_URL;
    if (senha !== confirmarSenha) {
      alert("As senhas não conferem");
      return;
    }

    fetch(`${baseUrl}/usuario/confirmar_redefinicao`, {
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
          alert("Senha redefinida com sucesso!");
        } else {
          alert("Erro ao redefinir senha");
        }
        navigate("/login");
      })
      .catch((error) => {
        console.error("Erro ao redefinir senha", error);
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
