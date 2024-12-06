import { client } from "../clients/manager";

const managerClient = () => client.setConfig({
    // set default base url for requests
    baseUrl: 'http://localhost:8080'
});

export default managerClient;