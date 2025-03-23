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

interface CadastroUsuarioProps {
  onAddUser?: (user: Usuario) => void; // Nova prop opcional para adicionar o usuário à lista
  id?: string; // ID opcional para edição
  isModal?: boolean; // Indica se está sendo usado em um modal
}

export default function CadastroUsuario({ onAddUser, id: propId, isModal = false }: CadastroUsuarioProps) {
  const { id: paramId } = useParams<{ id?: string }>();
  const id = propId || paramId; // Usar ID da prop se fornecido, caso contrário do parâmetro de rota
  
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
          // Processar o address apropriadamente
          if (data.address) {
            try {
              // Verificar se já é um array ou se precisa de parse
              const parsedAddress = Array.isArray(data.address) 
                ? data.address 
                : typeof data.address === 'string' 
                  ? JSON.parse(data.address) 
                  : data.address;
              
              if (Array.isArray(parsedAddress)) {
                setAdresses(parsedAddress.map((address) => Endereco.newFromObject(address)));
              } else {
                setAdresses([Endereco.newFromObject(parsedAddress)]);
              }
            } catch (e) {
              console.error("Erro ao analisar o endereço:", e);
            }
          }
        })
        .catch(() => {
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
          address: adresses.map(endereco => ({
            logradouro: endereco.logradouro,
            numero: endereco.numero,
            bairro: endereco.bairro,
            cidade: endereco.cidade,
            estado: endereco.estado,
            cep: endereco.cep
          })), // Enviar como array de objetos JSON
        }),
      });

      if (response.ok) {
        const data = await response.json();

        setAlert({
          open: true,
          message: id? `Usuário ${id} atualizado com sucesso!` : "Usuário cadastrado com sucesso!",
          severity: "success",
        });
        
        // Se for um cadastro e tiver a função onAddUser, chamar essa função
        if (!id && onAddUser) {
          // Extrair o usuário do response
          const newUser = data.user;

          // Criar objeto de usuário completo para retornar
          const novoUsuario: Usuario = {
            ...newUser,
            address: adresses,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          onAddUser(novoUsuario);
        } 
        // Se não estiver em modal, redirecionar após sucesso
        else if (!isModal) {
          setTimeout(() => {
            navigate(`/usuarios/${user.name}`);
          }, 3000);
        }
        
        // Limpar formulário após cadastro bem-sucedido
        if (!id) {
          setUser({
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
          setAdresses([]);
        }
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

  const renderContent = () => (
    <>
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
        sx={{ padding: 2, mt: 2 }}
        id="cadastrar-button"
        variant="contained"
        color="primary"
        fullWidth
        onClick={handleSubmit}
      >
        {id ? "Salvar Alterações" : "Cadastrar Usuário"}
      </Button>
    </>
  );

  // Se estiver sendo usado como um componente normal (não em um modal)
  if (!isModal) {
    return (
      <Container>
        <Paper elevation={3} sx={{ padding: 2, marginTop: 2 }}>
          {renderContent()}
        </Paper>
      </Container>
    );
  }
  
  // Se estiver sendo usado em um modal, apenas retornar o conteúdo sem container
  return renderContent();
}