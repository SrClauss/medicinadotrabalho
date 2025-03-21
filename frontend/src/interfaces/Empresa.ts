import Endereco from "./Endereco";
import IEndereco from "./Endereco";
import { ulid } from "ulid";

interface IEmpresa {
    id: string;
    name: string;
    email: string;
    address: IEndereco | null;
    phone: string | null;
    cnpj: string;
    ativo: boolean;
    created_at: string;
    updated_at: string;

    // Métodos similares a Usuario
    toArray(): string[];
    toString(): string;
}

class Empresa implements IEmpresa {
    id: string;
    name: string;
    email: string;
    address: Endereco | null;
    phone: string | null;
    cnpj: string;
    ativo: boolean;
    created_at: string;
    updated_at: string;

    constructor(
        id: string,
        name: string,
        email: string,
        address: Endereco | null,
        phone: string | null,
        cnpj: string,
        ativo: boolean,
        created_at: string,
        updated_at: string,
    ) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.address = address;
        this.phone = phone;
        this.cnpj = cnpj;
        this.ativo = ativo;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }

    toArray(): string[] {
        return [
            this.id,
            this.name,
            this.email,
            this.address ? this.address.toString() : '',
            this.phone || '',
            this.cnpj,
            this.ativo.toString(),
            this.created_at,
            this.updated_at,
        ];
    }

    toString(): string {
        return `${this.name} - ${this.email} - ${this.cnpj}`;
    }

    static newFromObject(obj: any): IEmpresa {
        const id = ulid();
        const address = obj.address ? Endereco.newFromObject(obj.address) : null;
        return new Empresa(
            id,
            obj.name,
            obj.email,
            address,
            obj.phone || null,
            obj.cnpj,
            obj.ativo || false,
            obj.created_at || new Date().toISOString(),
            obj.updated_at || new Date().toISOString()
        );
    }
}

export default Empresa;