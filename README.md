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

# Azure Service Bus
- [Documentação](https://azure.microsoft.com/pt-br/products/service-bus)
- Passo 1: Criar uma instância do recurso Service Bus, informando o namespace name e o pricing tier Standard (a partir desse SKU há suporte a tópicos)
![servicebus001](diagramas/servicebus001.png "servicebus001")
- Passo 2: Uma vez provisionado, clicar no menu tópicos
![servicebus002](diagramas/servicebus002.png "servicebus002")
- Passo 3: Clicar no link para criar um novo tópico
![servicebus003](diagramas/servicebus003.png "servicebus003")
- Passo 4: Informar o nome do tópico no padrão topico-equipe-<NUMERODASUAEQUIPE>-<NOMEDAENTIDADE>
![servicebus004](diagramas/servicebus004.png "servicebus004")
- Passo 5: Uma vez que o tópico seja provisionado, clicar em subscriptions
![servicebus005](diagramas/servicebus005.png "servicebus005")
- Passo 6: Clicar no link para criar uma nova subscription
![servicebus006](diagramas/servicebus006.png "servicebus006")
- Passo 7: Informar o nome da assinatura no padrão subs-topico-equipe-<NUMERODASUAEQUIPE>-<NOMEDAENTIDADE>
![servicebus007](diagramas/servicebus007.png "servicebus007")
- Passo 8: Clicar no ícone Service Bus Explorer para monitorar as mensagens
![servicebus008](diagramas/servicebus008.png "servicebus008")


# Dapr
- Dapr é um runtime para construção, integração, execução e monitoramento de aplicações distribuídas no formato de microsserviços
![Dapr](https://docs.dapr.io/images/overview.png "Dapr")
- [Building blocks](https://docs.dapr.io/concepts/overview/#microservice-building-blocks-for-cloud-and-edge)

## Instalação
- [Instalação do Dapr CLI](https://docs.dapr.io/getting-started/install-dapr-cli/)

## Inicialização
```
cd microservcarro
dapr init
```

- Verificando a instalação
```
$ docker ps
CONTAINER ID   IMAGE                COMMAND                  CREATED          STATUS                    PORTS                                                                                                                                     NAMES
f377a492bae6   daprio/dapr:1.12.1   "./placement"            43 seconds ago   Up 42 seconds             0.0.0.0:50005->50005/tcp, :::50005->50005/tcp, 0.0.0.0:58080->8080/tcp, :::58080->8080/tcp, 0.0.0.0:59090->9090/tcp, :::59090->9090/tcp   dapr_placement
a5009c20daa7   redis:6              "docker-entrypoint.s…"   47 seconds ago   Up 44 seconds             0.0.0.0:6379->6379/tcp, :::6379->6379/tcp                                                                                                 dapr_redis
1d669098ac80   openzipkin/zipkin    "start-zipkin"           48 seconds ago   Up 44 seconds (healthy)   9410/tcp, 0.0.0.0:9411->9411/tcp, :::9411->9411/tcp                                                                                       dapr_zipkin
```

## Dependências no POM
- [SDK JavaScript](https://docs.dapr.io/developing-applications/sdks/js/)
```
    npm install --save @dapr/dapr
```
## Componentes Dapr
- Os componentes do Dapr são recursos utilizados pelos microsserviços que são acessados através do sidecar.
- [Dapr Components](https://docs.dapr.io/reference/components-reference/)
- Passo 1: criar uma pasta dentro de microservcarro -> components
- Passo 2: na pasta components criar o arquivo servicebus-pubsub.yaml

```
# Documentação: https://docs.dapr.io/reference/components-reference/supported-pubsub/setup-azure-servicebus/
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: servicebus-pubsub
spec:
  type: pubsub.azure.servicebus.topics
  version: v1
  metadata:
  - name: namespaceName
    value: "tapr2023.servicebus.windows.net"
```

- Passo 3.1: na pasta do projeto executar o comando.

```
npm run compile
```

- Passo 3.2: na pasta principal do projeto (mesma pasta do arquivo package.json), criar um novo arquivo com o nome dapr.yaml
```
version: 1
common:
  resourcesPath: ./components/
apps:
  - appID: tapr-2023-equipe1-carro-javascript
    appDirPath: .
    appPort: 3000
    command: ["npm", "run", "dev"]
```

## Publicação de atualizações da entidade principal do agregado

- Passo 4: alterar o arquivo .env para incluir dois novos parametros:
  - APPCOMPONENTTOPICCARRO=<nome do tópico registrado no service bus>
  - APPCOMPONENTSERVICE=servicebus-pubsub
```
#Exemplo
APPCOMPONENTTOPICCARRO=topico-equipe-0-carro
APPCOMPONENTSERVICE=servicebus-pubsub
```
- Passo 5.1: na pasta common criar um arquivo daprclient.ts
```
import { DaprClient } from "@dapr/dapr";

const daprClient:DaprClient = new DaprClient({
        daprHost: process.env.DAPR_HOST as string,
        daprPort: process.env.DAPR_HTTP_PORT as string
});

export default daprClient;
```

- Passo 5.2:  na classe de serviço da entidade root do agregado, incluir os seguintes códigos:

```
//outros imports...
import { DaprClient } from "@dapr/dapr";
class CarroService{
    //muitas linhas de código...

    async publishEvent(carro:Carro): Promise<Carro>{
        daprClient.pubsub.publish(process.env.APPCOMPONENTSERVICE as string,
                                  process.env.APPCOMPONENTTOPICCARRO as string,
                                  carro);
        return Promise.resolve(carro);

    }
    async saveNew(carro:Carro): Promise<Carro>{
        carro.id = "";
        await this.container.items.create(carro);
        //chamar o método para publicar o evento de atualização da entidade
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
        //chamar o método para publicar o evento de atualização da entidade
        await this.publishEvent(carroAntigo);

        return Promise.resolve(carroAntigo);
    }
```

## Executar o teste de publicação de eventos
```
#Executar esse comando dentro da pasta do projeto
dapr run -f .
```
- Passo 6: Usar o arquivo teste.rest para invocar a API REST nos métodos POST e PUT, verificar no Azure Service Bus se os eventos foram publicados no tópico.

## Assinatura das atualizações em um tópico
- Escolher uma das entidades externas aos agregados.

- Passo 1: alterar o arquivo server.ts para modificar a configuração do tipo de objeto suportado pela biblioteca do body parser

```
    app.use(bodyParser.json({ limit: process.env.REQUEST_LIMIT || '100kb',
                              type: 'application/*+json' }));
```

- Passo 2.1: criar na classe Controller da entidade externa ao agregado um novo end point chamado atualizar, que será automaticamente chamado pelo Dapr toda vez que um novo evento for publicado no Service Bus

```
    updateEvent(req:Request, res:Response): void{
        ClienteService.updateEvent(req.body.data).then((r) => res.json(r)).catch(() => res.status(404).end());
    }
```
- Passo 2.2: alterar o arquivo de rotas do controlador para registrar o novo endpoint
```
export default express
    .Router()
    .get('/', controller.all)
    .get('/:id', controller.getById)
    .post('/', controller.post)
    .put('/:id', controller.update)
    .delete('/:id', controller.delete)
    .post('/event', controller.updateEvent);
```
- Passo 2.3: alterar o arquivo api.yml para registrar a nova rota da API REST.
``` 
  /clientes/event:
    post:
      responses:
        200:
          description: Return all
          content: {}
```
- Passo 3: incluir na classe de implementação do serviço da entidade, o código do método abaixo para receber a entidade e atualizar no banco de dados local do serviço.

```
    async updateEvent(cliente:Cliente): Promise<Cliente>{
        await this.container.items.upsert(cliente);
        return Promise.resolve(cliente);
    }
```
- Passo 4: criar um novo arquivo dentro da pasta components chamado servicebus-subscription.yaml com o objetivo de registrar de forma declarativa a assinatura ao tópico do Service Bus
    - topic é o nome do tópico no Service Bus
    - routes -> default: é a URL da API REST que será executada
    - pubsubname é o nome do componente que conecta no Service Bus
    - scopes são o nome das aplicações envolvidas na assinatura
```
apiVersion: dapr.io/v2alpha1
kind: Subscription
metadata:
  name: substopico-equipe-0-cliente
spec:
  topic: topico-equipe-0-cliente
  routes:
    default: /api/v1/clientes/event
  pubsubname: servicebus-pubsub
scopes:
- tapr-2023-equipe1-carro-javascript

```

## Executar o teste de assinatura dos eventos
```
#Executar esse comando dentro da pasta do projeto
dapr run -f .
```
- Mantendo a aplicação em execução, abrir um novo terminal e executar o exemplo do comando abaixo alterando os parametros para simular a publicação de um evento.

```
#Exemplo de publicação de atualização do evento
# dapr publish --publish-app-id <nome da aplicação no arquivo dapr.yaml> --pubsub <nome do componente do service bus no arquivo /componenets/servicebus-pubsub.yaml> --topic <nome do topico registrado no service bus> --data '<objeto JSON contendo os campos da entidade>'

dapr publish --publish-app-id tapr-2023-equipe1-carro-javascript --pubsub servicebus-pubsub --topic topico-equipe-0-cliente --data '{"id": "123","nome": "Zezinho","endereco": "Rua lalala 100"}'
```

- Verificar no banco de dados se a entidade foi registrada.