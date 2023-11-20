import { Container, SqlQuerySpec } from "@azure/cosmos";
import cosmosDb from "../../common/cosmosdb";
import daprClient from "../../common/daprclient";
import { Carro } from "../entites/carro";

class CarroService{
    private container:Container =
        cosmosDb.container("carro");
    
    async all(): Promise<Carro[]>{
        const {resources: listaCarros}
            = await this.container.items.readAll<Carro>().fetchAll();
        
        return Promise.resolve(listaCarros);
    }
    async getById(id:string): Promise<Carro>{
        const querySpec: SqlQuerySpec = {
            query: "SELECT * FROM Carro c WHERE c.id = @id",
            parameters: [
                {name: "@id", value: id}
            ]
            };
        const {resources: listaCarros}
            = await this.container.items.query(querySpec).fetchAll();
        
        return Promise.resolve(listaCarros[0]);
    }
    async saveNew(carro:Carro): Promise<Carro>{
        carro.id = "";
        await this.container.items.create(carro);
        await this.publishEvent(carro);
        return Promise.resolve(carro);
    }
    async update(id:string, carro:Carro): Promise<Carro>{
        const querySpec: SqlQuerySpec = {
            query: "SELECT * FROM Carro c WHERE c.id = @id",
            parameters: [
                {name: "@id", value: id}
            ]
            };
        const {resources: listaCarros}
            = await this.container.items.query(querySpec).fetchAll();
        const carroAntigo = listaCarros[0];
        
        if(carroAntigo == undefined){
            return Promise.reject();
        }

        //Atualizar os campos
        carroAntigo.placa = carro.placa;
        
        await this.container.items.upsert(carroAntigo);
        await this.publishEvent(carroAntigo);

        return Promise.resolve(carroAntigo);
    }
    async delete(id:string): Promise<string>{

        const querySpec: SqlQuerySpec = {
            query: "SELECT * FROM Carro c WHERE c.id = @id",
            parameters: [
                {name: "@id", value: id}
            ]
            };
        const {resources: listaCarros}
            = await this.container.items.query(querySpec).fetchAll();
        for (const carro of listaCarros) {
            await this.container.item(carro.id).delete();
        }
        
        return Promise.resolve(id);
    }

    async publishEvent(carro:Carro): Promise<Carro>{
        daprClient.pubsub.publish(process.env.APPCOMPONENTSERVICE as string,
                                  process.env.APPCOMPONENTTOPICCARRO as string,
                                  carro);
        return Promise.resolve(carro);

    }
}

export default new CarroService();