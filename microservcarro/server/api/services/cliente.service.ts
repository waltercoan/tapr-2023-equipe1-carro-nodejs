import { Container, SqlQuerySpec } from "@azure/cosmos";
import cosmosDb from "../../common/cosmosdb";
import { Cliente } from "../entites/cliente";

class ClienteService{
    private container:Container =
        cosmosDb.container("cliente");
    
    async all(): Promise<Cliente[]>{
        const {resources: listaClientes}
            = await this.container.items.readAll<Cliente>().fetchAll();
        
        return Promise.resolve(listaClientes);
    }
    async getById(id:string): Promise<Cliente>{
        const querySpec: SqlQuerySpec = {
            query: "SELECT * FROM Cliente c WHERE c.id = @id",
            parameters: [
                {name: "@id", value: id}
            ]
            };
        const {resources: listaClientes}
            = await this.container.items.query(querySpec).fetchAll();
        
        return Promise.resolve(listaClientes[0]);
    }
    async saveNew(cliente:Cliente): Promise<Cliente>{
        cliente.id = "";
        await this.container.items.create(cliente);
        
        return Promise.resolve(cliente);
    }
    async update(id:string, cliente:Cliente): Promise<Cliente>{
        const querySpec: SqlQuerySpec = {
            query: "SELECT * FROM Cliente c WHERE c.id = @id",
            parameters: [
                {name: "@id", value: id}
            ]
            };
        const {resources: listaClientes}
            = await this.container.items.query(querySpec).fetchAll();
        const clienteAntigo = listaClientes[0];
        if(clienteAntigo == undefined){
            return Promise.reject();
        }
        //Atualizar os campos
        clienteAntigo.nome = cliente.nome;
        clienteAntigo.endereco = cliente.endereco;
        
        await this.container.items.upsert(clienteAntigo)
        
        return Promise.resolve(clienteAntigo);
    }
    async delete(id:string): Promise<string>{

        const querySpec: SqlQuerySpec = {
            query: "SELECT * FROM Cliente c WHERE c.id = @id",
            parameters: [
                {name: "@id", value: id}
            ]
            };
        const {resources: listaClientes}
            = await this.container.items.query(querySpec).fetchAll();
        for (const cliente of listaClientes) {
            await this.container.item(cliente.id).delete();
        }
        
        return Promise.resolve(id);
    }
}

export default new ClienteService();