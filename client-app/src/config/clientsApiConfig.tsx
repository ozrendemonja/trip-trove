import { Config } from "@hey-api/client-fetch";
import { client } from "../clients/manager";

const managerClient = (): Config =>
  client.setConfig({
    // set default base url for requests
    baseUrl: "http://localhost:8080"
  });

export default managerClient;
