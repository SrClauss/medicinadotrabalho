import { ulid } from "ulid";

interface IEndereco{

    id: string;
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;

    toArray(): string[];
    toString(): string;

    
}

class Endereco implements IEndereco {
    id: string;
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;

    constructor(
        id: string,
        cep: string,
        logradouro: string,
        numero: string,
        complemento: string,
        bairro: string,
        cidade: string,
        estado: string,
    ) {
        this.id = id;
        this.cep = cep;
        this.logradouro = logradouro;
        this.numero = numero;
        this.complemento = complemento;
        this.bairro = bairro;
        this.cidade = cidade;
        this.estado = estado;
    }

    static newFromObject(obj: any): IEndereco {
        const id = ulid();
        return new Endereco(
            id,
            obj.cep,
            obj.logradouro,
            obj.numero,
            obj.complemento,
            obj.bairro,
            obj.cidade,
            obj.estado
        );
    }
    toArray(): string[] {
        return [
            this.id,
            this.cep,
            this.logradouro,
            this.numero,
            this.complemento,
            this.bairro,
            this.cidade,
            this.estado,
        ];
    }
    toString(): string {
        return `${this.logradouro}, ${this.numero} ${this.complemento} - ${this.bairro}, ${this.cidade} - ${this.estado}`;
    }
  
}

export default Endereco;


