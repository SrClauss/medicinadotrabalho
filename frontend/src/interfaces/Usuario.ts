import Endereco from "./Endereco";



import IEndereco from "./Endereco";

interface IUsuario {
    id: string;
    name: string;
    email: string;
    address: IEndereco | null;
    phone: string | null;
    cpf: string | null;
    role: number;
    ativo: boolean;
    created_at: string;
    updated_at: string;
}

class Usuario implements IUsuario {
    id: string;
    name: string;
    email: string;
    address: Endereco | null;
    phone: string | null;
    cpf: string | null;
    role: number;
    ativo: boolean;
    created_at: string;
    updated_at: string;

    constructor(
        id: string,
        name: string,
        email: string,
        address: Endereco | null,
        phone: string | null,
        cpf: string | null,
        role: number,
        ativo: boolean,
        created_at: string,
        updated_at: string,
    ) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.address = address;
        this.phone = phone;
        this.cpf = cpf;
        this.role = role;
        this.ativo = ativo;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }
}

export default Usuario;

