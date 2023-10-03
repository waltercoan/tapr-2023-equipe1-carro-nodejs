# tapr-2023-equipe1-carro-nodejs

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