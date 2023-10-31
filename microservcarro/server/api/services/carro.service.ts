import { Container } from "@azure/cosmos";
import cosmosDb from "../../common/cosmosdb";
import { Carro } from "../entites/carro";

class CarroService{
    private container:Container =
        cosmosDb.container("carro");
    
    async all(): Promise<Carro[]>{
        const {resources: listaCarros}
            = await this.container.items.readAll<Carro>().fetchAll();
        
        return Promise.resolve(listaCarros);
    }
}

export default new CarroService();