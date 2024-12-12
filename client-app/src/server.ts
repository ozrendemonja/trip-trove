import { createServer, Model } from "miragejs";
import { GetContinentResponse } from "./clients/manager";

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
    },
  })
}