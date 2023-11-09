import { ConnectionMode, CosmosClient } from "@azure/cosmos";
import { DefaultAzureCredential } from "@azure/identity";


const cosmosClient = new CosmosClient({
    endpoint: process.env.COSMOSDBURL as string,
    aadCredentials: new DefaultAzureCredential(),
    connectionPolicy: {
        connectionMode: ConnectionMode.Gateway
    }
});

export default cosmosClient.database(process.env.COSMOSDBDB as string);