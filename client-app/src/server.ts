import { createServer, Model } from "miragejs";
import { GetContinentResponse, UpdateContinentRequest } from "./clients/manager";

export default function makeServer() {
  return createServer({
    models: {
      continent: Model.extend<Partial<GetContinentResponse>>({}),
    },

    seeds(server) {
      server.create("continent", { continentName: "Australia" });
      server.create("continent", { continentName: "Europe" });
      server.create("continent", { continentName: "Asia" });
    },

    routes() {
      this.urlPrefix = "http://localhost:8080"
      this.get("/continents", (schema) => {
        return schema.db.continents;
      })

      this.delete("/continents/:name", (schema, request) => {
        const name = request.params.name;

        const element = schema.db.continents.findBy(data => data.continentName === name);
        schema.db.continents.remove(element);
      },
        { timing: 400 }
      )

      this.put("/continents/:name", (schema, request) => {
        const oldName = request.params.name;
        const newName = (JSON.parse(request.requestBody) as UpdateContinentRequest).continentName;

        const element = schema.db.continents.findBy(data => data.continentName === oldName);
        schema.db.continents.update(element.id, { continentName: newName });
      },
        { timing: 400 }
      )
    },
  })
}