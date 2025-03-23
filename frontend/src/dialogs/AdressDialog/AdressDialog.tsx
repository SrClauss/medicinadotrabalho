import { Box, Button, Dialog, DialogContent, DialogTitle,  TextField, Typography} from "@mui/material";

import {  useState } from "react";
import TwoColumnsForm from "../../components/TwoColumnsForm/TwoColumnsForm";
import Endereco from "../../interfaces/Endereco";
import TitleForm from "../../components/TitleForm/TitleForm";

interface IAdressDialog {
    open: boolean;
    onClose: () => void;
    onConfirm: (adress: any) => void;
}

const estados = ["", "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

export default function AdressDialog({ open, onClose,  onConfirm }: IAdressDialog) {

    const [cep, setCep] = useState("");
    const [logradouro, setLogradouro] = useState("");
    const [numero, setNumero] = useState("");
    const [complemento, setComplemento] = useState("");
    const [bairro, setBairro] = useState("");
    const [cidade, setCidade] = useState("");
    const [estado, setEstado] = useState("");

    const handleBlurCEP = async () => {
        if (cep.length !== 8) {
            setBairro("");
            setCidade("");
            setEstado("");
            setLogradouro("");
            return;
        }
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (data.erro) {
            alert("CEP não encontrado");
            setBairro("");
            setCidade("");
            setEstado("");
            setLogradouro("");
            setCep(cep.substring(0, 5) + "-" + cep.substring(5, 8));
            return;
        }

        setLogradouro(data.logradouro);
        setBairro(data.bairro);
        setCidade(data.localidade);
        setEstado(data.uf);

        //formate o cep
        setCep(cep.substring(0, 5) + "-" + cep.substring(5, 8));

    }

    const handleFocusCEP = () => {
        setCep(cep.replace(/[^0-9]/g, ""));
    }
    const handleSendAdress = () => {
        if (!cep || !logradouro || !bairro || !cidade || !estado) {
            alert("Preencha todos os campos");
            return;
        }
        let number: string = numero;
        if (numero === "") {
            number = "S/N";
        }
        const endereco = Endereco.newFromObject({
            cep: cep,
            logradouro: logradouro,
            numero: number,
            complemento: complemento,
            bairro: bairro,
            cidade: cidade,
            estado: estado
        });
        onConfirm(endereco);
    }

    return (
        <Dialog open={open} onClose={onClose} >
            <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <TitleForm id="title-adress" title="Adicionar Endereço" />
                    <Button sx={{
                            padding: 0,
                            minWidth: 'auto',
                            width: 30,
                            height: 30,
                           
                           
                        }} variant="contained" color="primary" onClick={onClose}>
                        <Typography>
                            X
                        </Typography>
                    </Button>
                </Box>

            </DialogTitle>
            <DialogContent>
                <TwoColumnsForm id="cep">
                    <TextField
                        id="cep"
                        label="CEP"
                        variant="outlined"
                        value={cep}
                        onChange={(e) => {
                            const value = e.target.value;
                            const numericValue = value.replace(/[^0-9]/g, "").slice(0, 8);
                            setCep(numericValue);
                        }}
                        onBlur={handleBlurCEP}
                        onFocus={handleFocusCEP}
                        fullWidth
                    />
                </TwoColumnsForm>
                <TwoColumnsForm id="logradouro-bairro">
                    <TextField
                        id="logradouro"
                        label="Logradouro"
                        variant="outlined"
                        value={logradouro}
                        onChange={(e) => setLogradouro(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        id="bairro"
                        label="Bairro"
                        variant="outlined"
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                        fullWidth
                    />
                </TwoColumnsForm>
                <TwoColumnsForm id="numero-complemento">
                    <TextField
                        id="numero"
                        label="Número"
                        variant="outlined"
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        id="complemento"
                        label="Complemento"
                        variant="outlined"
                        value={complemento}
                        onChange={(e) => setComplemento(e.target.value)}
                        fullWidth
                    />
                </TwoColumnsForm>
                <TwoColumnsForm id="cidade-estado">
                    <TextField
                        id="cidade"
                        label="Cidade"
                        variant="outlined"
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        id="estado"
                        label="Estado"
                        variant="outlined"
                        select
                        SelectProps={{ native: true }}
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                        fullWidth
                    >
                        {estados.map((estado) => (
                            <option key={estado} value={estado}>
                                {estado}
                            </option>
                        ))}
                    </TextField>
                </TwoColumnsForm>
                <TwoColumnsForm id="salvar">
                    <Button variant="contained" color="primary" fullWidth onClick={handleSendAdress}>
                        Salvar Endereço
                    </Button>
                </TwoColumnsForm>

            </DialogContent>
        </Dialog>
    );
}