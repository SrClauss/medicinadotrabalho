import {
  Container,
  Paper,
  Box,
  FormControlLabel,
  TextField,
  RadioGroup,
  Radio,
  Button,
  IconButton,
  Alert,
} from "@mui/material";
import TitleForm from "../../components/TitleForm/TitleForm";
import TwoColumnsForm from "../../components/TwoColumnsForm/TwoColumnsForm";
import { useState, useEffect } from "react";
import Usuario from "../../interfaces/Usuario";
import AdressDialog from "../../dialogs/AdressDialog/AdressDialog";
import Endereco from "../../interfaces/Endereco";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate, useParams } from "react-router-dom";

export default function CadastroUsuario() {
  const { id } = useParams<{ id?: string }>(); // ID agora vem do useParams e é opcional
  const [user, setUser] = useState<Usuario>({
    id: "",
    name: "",
    email: "",
    address: null,
    phone: "",
    cpf: "",
    role: 2,
    ativo: true,
    created_at: "",
    updated_at: "",
  });
  const [openAdressDialog, setOpenAdressDialog] = useState(false);
  const [adresses, setAdresses] = useState<Endereco[]>([]);
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "success",
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      // Se o ID estiver presente, buscar os dados do usuário para edição
      fetch(`${import.meta.env.VITE_BASE_URL}/usuario/obter/${id}`)
        .then((response) => response.json())
        .then((data) => {
          setUser(data);
          setAdresses(JSON.parse(data.address).map((adress: any) => Endereco.newFromObject(adress))) // Assumindo que o backend retorna os endereços no campo 'address'
        })
        .catch((error) => {
          setAlert({
            open: true,
            message: "Erro ao carregar dados do usuário para edição.",
            severity: "error",
          });
        });
    }
  }, [id]);

  const handleSetAdresses = (adress: Endereco) => {
    setAdresses([...adresses, adress]);
    setOpenAdressDialog(false);
  };
  const handleDeleteAdress = (adress: Endereco) => {
    setAdresses(adresses.filter((item) => item !== adress));
  };

  const handleSubmit = async () => {
    try {
      const method = id ? "PUT" : "POST";
      const url = id
        ? `${import.meta.env.VITE_BASE_URL}/usuarios/editar/${id}`
        : `${import.meta.env.VITE_BASE_URL}/usuario/registrar`;

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...user,
          address: adresses,
        }),
      });

      if (response.ok) {
        setAlert({
          open: true,
          message: `Usuário ${id ? "atualizado" : "cadastrado"} com sucesso!`,
          severity: "success",
        });
        // Redireciona para UsuarioView com o nome do usuário como searchTerm
        setTimeout(() => {
          navigate(`/usuarios/${user.name}`);
        }, 3000);
      } else {
        const errorData = await response.json();
        let message = errorData.erro || "Erro ao cadastrar/atualizar usuário.";
        if (errorData.erro === "CPF já registrado") {
          message = "Este CPF já está cadastrado. Por favor, use um CPF diferente.";
        }
        setAlert({
          open: true,
          message: message,
          severity: "error",
        });
      }
    } catch (error) {
      setAlert({
        open: true,
        message: "Erro ao conectar com o servidor.",
        severity: "error",
      });
    }
  };

  return (
    <Container>
      <Paper elevation={3} sx={{ padding: 2, marginTop: 2 }}>
        <TitleForm
          title={id ? "Editar Usuário" : "Cadastro de Usuário"}
          id={id ? "editar-usuario-title" : "cadastro-usuario-title"}
        />
        {alert.open && (
          <Alert
            severity={alert.severity}
            onClose={() => setAlert({ ...alert, open: false })}
          >
            {alert.message}
          </Alert>
        )}
        <TwoColumnsForm id="name-email">
          <TextField
            id="name"
            label="Nome"
            variant="outlined"
            fullWidth
            value={user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
            autoComplete="off"
          />
          <TextField
            id="email"
            label="Email"
            variant="outlined"
            type="email"
            fullWidth
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
            autoComplete="off"
          />
        </TwoColumnsForm>

        <TwoColumnsForm id="phone-cpf">
          <TextField
            id="phone"
            label="Telefone"
            variant="outlined"
            fullWidth
            value={user.phone || ""}
            onChange={(e) => setUser({ ...user, phone: e.target.value })}
            autoComplete="off"
          />
          <TextField
            id="cpf"
            label="CPF"
            variant="outlined"
            fullWidth
            value={user.cpf || ""}
            onChange={(e) => setUser({ ...user, cpf: e.target.value })}
            autoComplete="off"
          />
        </TwoColumnsForm>

        <TwoColumnsForm id="role-adress">
          <Box width={"100%"}>
            <RadioGroup
              aria-label="role"
              name="role"
              value={user.role?.toString()}
              onChange={(e) =>
                setUser({ ...user, role: parseInt(e.target.value) })
              }
            >
              <TwoColumnsForm id="role">
                <FormControlLabel
                  value="0"
                  control={<Radio />}
                  label="Administrador"
                />
                <FormControlLabel
                  value="1"
                  control={<Radio />}
                  label="Editor"
                />
                <FormControlLabel
                  value="2"
                  control={<Radio />}
                  label="Trabalhador"
                />
              </TwoColumnsForm>
            </RadioGroup>
          </Box>

          <Box width={"100%"}>
            <Button
              onClick={() => setOpenAdressDialog(true)}
              variant="contained"
              color="primary"
              fullWidth
            >
              Adicionar Endereço
            </Button>
          </Box>
          <AdressDialog
            open={openAdressDialog}
            onConfirm={handleSetAdresses}
            onClose={() => setOpenAdressDialog(false)}
          />
        </TwoColumnsForm>
        <Box width={"100%"}>
          {adresses.map((adress, index) => {
            return (
              <Paper
                elevation={4}
                key={index}
                sx={{ padding: 1, marginTop: 1 }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  {adress.toString()}
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteAdress(adress)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Paper>
            );
          })}
        </Box>
        <Button
          sx={{ padding: 2 }}
          id="cadastrar-button"
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleSubmit}
        >
          {id ? "Salvar Alterações" : "Cadastrar Usuário"}
        </Button>
      </Paper>
    </Container>
  );
}