# tapr-2023-equipe1-carro-nodejs

![Diagrama](diagramas/tapr-microsservico2023.png "Diagrama")
- [Diagrama](diagramas/tapr-microsservico2023.vsdx)

## Autenticação no AZURE
[DOC](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli-linux?pivots=apt)

```
az login -u walter.s@univille.br
az login --use-device-code
az ad signed-in-user show
```

## Extensões do VSCode
[Typescript](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-next)
[Rest Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)

## Criação do projeto
```
npm install -g yo generator-express-no-stress-typescript
yo express-no-stress-typescript
```

## Execução do projeto
```
cd microservcarro/
npm install
npm run dev
```

## Dependências do projeto
```
npm install @azure/cosmos
npm install @azure/identity
```

## CosmosDB
- [Introdução](https://learn.microsoft.com/en-us/azure/cosmos-db/introduction)
- [Databases, containers, and items](https://learn.microsoft.com/en-us/azure/cosmos-db/resource-model)

### Configuração RBAC de permissão
```
az cosmosdb sql role assignment create --account-name COSMOSDBACCOUNT --resource-group GRUPODERECURSO --role-assignment-id 00000000-0000-0000-0000-000000000002 --role-definition-name "Cosmos DB Built-in Data Contributor" --scope "/" --principal-id GUIDUSUARIOAD
```

### Falha de conexão com o CosmosDB devido bloqueio na rede da UNIVILLE
- Alunos que utilizarem seus notebooks pessoais conectados a rede UNIVILLE devem alterar o arquivo cosmosdb.ts para modificar o método de conexão da aplicação com o CosmosDB
- [CosmosDB Gateway Connection](https://learn.microsoft.com/en-us/azure/cosmos-db/dedicated-gateway)
```
const cosmosClient = new CosmosClient({
    endpoint: process.env.COSMOSDBURL as string,
    aadCredentials: new DefaultAzureCredential(),
    connectionPolicy: {
        connectionMode: ConnectionMode.Gateway
    }
});
```

## CRUD API REST
- [Documentação oficial da API do CosmosDB para JS](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/cosmosdb/cosmos#azure-cosmos-db-client-library-for-javascripttypescript)
### Verbo GET
- Objetivo: Retornar uma lista de objetos ou um objeto específico a partir da chave

#### carro.service.ts
- Criar os métodos na classe do serviço
```
import { Container, SqlQuerySpec } from "@azure/cosmos";
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
}

export default new CarroService();
```

#### controllers/carros/carrocontroller.ts
- Implememntar no controlador os métodos para buscar do banco todos os carros e para buscar um único carro pelo ID

```
import {Request, Response} from 'express';
import CarroService from '../../services/carro.service';

class CarroController{
    all(_:Request, res:Response): void{
        CarroService.all().then((r) => res.json(r));
    }
    getById(req:Request, res:Response): void{
        CarroService.getById(req.params['id']).then((r) => res.json(r));
    }
}
export default new CarroController();
```
#### controllers/carros/router.ts
- Registrar os endpoints no mecanismo de rotas
```
import express from 'express';
import controller from './carrocontroller';

export default express
    .Router()
    .get('/', controller.all)
    .get('/:id', controller.getById);
```

#### api.yml
- Registrar os enpoints na documentação da API
```
paths:
  /carros:
    get:
      responses:
        200:
          description: Return all
          content: {}
  /carros/{id}:
    get:
      responses:
        200:
          description: Return all
          content: {}
```

#### teste.rest
- Implementação do teste do verbo GET
```
### Buscar todos os carros
GET http://localhost:3000/api/v1/carros
### Buscar carro pelo ID
GET http://localhost:3000/api/v1/carros/3f840c63-130c-436b-8543-97ab14caf16f
```

### Verbo POST
- Objetivo: Inserir uma nova instância da entidade no banco de dados

#### carro.service.ts
- Criar os métodos na classe do serviço
```
async saveNew(carro:Carro): Promise<Carro>{
    carro.id = "";
    await this.container.items.create(carro);
    
    return Promise.resolve(carro);
}
```

#### controllers/carros/carrocontroller.ts
- Implememntar no controlador o metodo para inserir o novo carro no sistema.
```
post(req:Request, res:Response): void{
    CarroService.saveNew(req.body).then((r) => res.json(r));
}
```
#### controllers/carros/router.ts
- Registrar os endpoints no mecanismo de rotas
```
export default express
    .Router()
    .get('/', controller.all)
    .get('/:id', controller.getById)
    .post('/', controller.post);
```

#### api.yml
- Registrar os enpoints na documentação da API
```
paths:
  /carros:
    get:
      responses:
        200:
          description: Return all
          content: {}
    post:
      responses:
          200:
            description: Return all
            content: {}
```
#### teste.rest
- Implementação do teste do verbo POST
```
### Inserir um novo Carro
POST http://localhost:3000/api/v1/carros
Content-Type: application/json

{
  "placa": "MDB3389"
}
```

### Verbo PUT
- Objetivo: Alterar os dados de uma determinada instância da entidade

#### carro.service.ts
- Criar o método update na interface de serviço
```
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

    //Atualizar os campos
    carroAntigo.placa = carro.placa;
    
    await this.container.items.upsert(carroAntigo)
    
    return Promise.resolve(carroAntigo);
}
```
#### controllers/carros/carrocontroller.ts
- Implememntar no controlador o metodo para realizar o update do registro
```
update(req:Request, res:Response): void{
    CarroService.update(req.params['id'],req.body).then((r) => res.json(r));
}
```
#### controllers/carros/router.ts
- Registrar os endpoints no mecanismo de rotas
```
import express from 'express';
import controller from './carrocontroller';

export default express
    .Router()
    .get('/', controller.all)
    .get('/:id', controller.getById)
    .post('/', controller.post)
    .put('/:id', controller.update);
```
#### api.yml
- Registrar os enpoints na documentação da API
```
  /carros/{id}:
    get:
      responses:
        200:
          description: Return all
          content: {}
    put:
      responses:
        200:
          description: Return all
          content: {}
```

#### teste.rest
- Implementação do teste do verbo PUT
```
### Atualizar o  Carro
PUT http://localhost:3000/api/v1/carros/bed1c3ec-fd13-433e-986f-c23419a9cdf9
Content-Type: application/json

{
  "placa": "MAS1334-2"
}
```

### Verbo DELETE
- Objetivo: Remover uma instância da entidade

#### carro.service.ts
- Criar os métodos na classe do serviço
```
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
        await this.container.item(carro.id,carro.placa).delete();
    }
    
    return Promise.resolve(id);
}
```

#### controllers/carros/carrocontroller.ts
- Implememntar no controlador o metodo para realizar a exclusão do registro
```
delete(req:Request, res:Response): void{
    CarroService.delete(req.params['id']).then((r) => res.json(r));
}
```
#### controllers/carros/router.ts
- Registrar os endpoints no mecanismo de rotas
```
import express from 'express';
import controller from './carrocontroller';

export default express
    .Router()
    .get('/', controller.all)
    .get('/:id', controller.getById)
    .post('/', controller.post)
    .put('/:id', controller.update)
    .delete('/:id', controller.delete);
```
#### api.yml
- Registrar os enpoints na documentação da API
```
  /carros/{id}:
    get:
      responses:
        200:
          description: Return all
          content: {}
    put:
      responses:
        200:
          description: Return all
          content: {}
    delete:
      responses:
        200:
          description: Return all
          content: {}
```
#### teste.rest
- Implementação do teste do verbo DELETE
```
### Remover o Carro
DELETE  http://localhost:3000/api/v1/carros/bed1c3ec-fd13-433e-986f-c23419a9cdf9
Content-Type: application/json
```

## Chaves de partição
- [DOC: Particionamento](https://learn.microsoft.com/en-us/azure/cosmos-db/partitioning-overview)
- Correção no código /server/api/services/carro.service.ts
```
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
```
## Modelagem de bancos de dados NoSQL
- [DOC: Modelagem de dados](https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/modeling-data)
