import { DaprClient } from "@dapr/dapr";

const daprClient:DaprClient = new DaprClient({
        daprHost: process.env.DAPR_HOST as string,
        daprPort: process.env.DAPR_HTTP_PORT as string
});

export default daprClient;