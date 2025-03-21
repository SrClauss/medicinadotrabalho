import {
    Container,
    Paper,
    Box,
    TextField,
    Button,
    IconButton,
    Alert,
} from "@mui/material";
import TitleForm from "../../components/TitleForm/TitleForm";
import TwoColumnsForm from "../../components/TwoColumnsForm/TwoColumnsForm";
import { useState, useEffect } from "react";
import AdressDialog from "../../dialogs/AdressDialog/AdressDialog";
import Endereco from "../../interfaces/Endereco";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate, useParams } from "react-router-dom";
import Empresa from "../../interfaces/Empresa"; // Importe a classe Empresa

export default function CadastroEmpresa() {
    const { id } = useParams<{ id?: string }>(); // ID agora vem do useParams e é opcional
    const [empresa, setEmpresa] = useState<Empresa>(
        new Empresa(
            "",
            "",
            "",
            null,
            "",
            "",
            true,
            "",
            ""
        )
    );
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
            fetch(`${import.meta.env.VITE_BASE_URL}/empresa/obter/${id}`)
                .then((response) => response.json())
                .then((data) => {
                    const empresaData = Empresa.newFromObject(data);
                    setEmpresa(empresaData);

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
                .catch((error) => {
                    setAlert({
                        open: true,
                        message: "Erro ao carregar dados da empresa para edição.",
                        severity: "error",
                    });
                });
        }
    }, [id]);

    const handleSetAdresses = (adress: Endereco) => {
        setAdresses([...adresses, adress]);
        setEmpresa(Empresa.newFromObject({ ...empresa, address: adress }));
        setOpenAdressDialog(false);
    };
    const handleDeleteAdress = (adress: Endereco) => {
        setAdresses(adresses.filter((item) => item !== adress));
    };

    const handleSubmit = async () => {
        try {
            const method = id ? "PUT" : "POST";
            const url = id
                ? `${import.meta.env.VITE_BASE_URL}/empresas/editar/${id}`
                : `${import.meta.env.VITE_BASE_URL}/empresa/registrar`;

            // Enviar os endereços como array diretamente, sem converter para string
            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...empresa,
                    address: adresses, // Enviar como array diretamente
                }),
            });

            if (response.ok) {
                setAlert({
                    open: true,
                    message: `Empresa ${id ? "atualizada" : "cadastrada"} com sucesso!`,
                    severity: "success",
                });
                // Redireciona para EmpresaView com o nome da empresa como searchTerm
                setTimeout(() => {
                    navigate(`/empresas/${empresa.name}`);
                }, 3000);
            } else {
                const errorData = await response.json();
                let message = errorData.erro || "Erro ao cadastrar/atualizar empresa.";
                if (errorData.erro === "CNPJ já registrado") {
                    message = "Este CNPJ já está cadastrado. Por favor, use um CNPJ diferente.";
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
                    title={id ? "Editar Empresa" : "Cadastro de Empresa"}
                    id={id ? "editar-empresa-title" : "cadastro-empresa-title"}
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
                        value={empresa.name}
                        onChange={(e) => setEmpresa(Empresa.newFromObject({ ...empresa, name: e.target.value }))}
                        autoComplete="off"
                    />
                    <TextField
                        id="email"
                        label="Email"
                        variant="outlined"
                        type="email"
                        fullWidth
                        value={empresa.email}
                        onChange={(e) => setEmpresa(Empresa.newFromObject({ ...empresa, email: e.target.value }))}
                        autoComplete="off"
                    />
                </TwoColumnsForm>

                <TwoColumnsForm id="phone-cnpj">
                    <TextField
                        id="phone"
                        label="Telefone"
                        variant="outlined"
                        fullWidth
                        value={empresa.phone || ""}
                        onChange={(e) => setEmpresa(Empresa.newFromObject({ ...empresa, phone: e.target.value }))}
                        autoComplete="off"
                    />
                    <TextField
                        id="cnpj"
                        label="CNPJ"
                        variant="outlined"
                        fullWidth
                        value={empresa.cnpj}
                        onChange={(e) => setEmpresa(Empresa.newFromObject({ ...empresa, cnpj: e.target.value }))}
                        autoComplete="off"
                    />
                </TwoColumnsForm>

                <TwoColumnsForm id="adress">
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
                    {id ? "Salvar Alterações" : "Cadastrar Empresa"}
                </Button>
            </Paper>
        </Container>
    );
}