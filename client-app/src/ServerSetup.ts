import { createServer, Model } from "miragejs";
import {
  GetContinentResponse,
  GetCountryResponse,
  UpdateContinentRequest
} from "./clients/manager";

export default function makeServer(): ReturnType<typeof createServer> {
  return createServer({
    models: {
      continent: Model.extend<GetContinentResponse>({}),
      country: Model.extend<GetCountryResponse>({})
    },

    seeds(server) {
      server.create("continent", { continentName: "Australia" });
      server.create("continent", { continentName: "Europe" });
      server.create("continent", { continentName: "Asia" });

      server.create("country", {
        countryId: 0,
        continentName: "Europe",
        countryName: "Monaco",
        changedOn: "2024-12-23T08:01:02.0000000"
      });
      server.create("country", {
        countryId: 1,
        continentName: "Europe",
        countryName: "San Marino",
        changedOn: "2024-12-22T08:01:02.0000000"
      });
      server.create("country", {
        countryId: 2,
        continentName: "Europe",
        countryName: "Liechtenstein",
        changedOn: "2024-12-21T08:01:02.0000000"
      });
    },

    routes() {
      this.urlPrefix = "http://localhost:8080";
      this.get(
        "/continents",
        (schema, request) => {
          const sortDirection = request.queryParams.sd;
          const result = schema.db.continents.sort();
          if (sortDirection == "ASC") {
            return result;
          }
          return result.reverse();
        },
        { timing: 600 }
      );

      this.delete(
        "/continents/:name",
        (schema, request) => {
          const name = request.params.name;

          const element = schema.db.continents.findBy(
            (data) => data.continentName === name
          );
          schema.db.continents.remove(element);
        },
        { timing: 600 }
      );

      this.put(
        "/continents/:name",
        (schema, request) => {
          const oldName = request.params.name;
          const newName = (
            JSON.parse(request.requestBody) as UpdateContinentRequest
          ).continentName;

          const element = schema.db.continents.findBy(
            (data) => data.continentName === oldName
          );
          schema.db.continents.update(element.id, { continentName: newName });
        },
        { timing: 600 }
      );

      this.get(
        "/countries",
        (schema, request) => {
          const sortDirection = request.queryParams.sd;
          const countryId = request.queryParams.countryId;
          let result = schema.db.countries.sort() as GetCountryResponse[];
          if (sortDirection != "ASC") {
            result = result.toReversed();
          }

          if (countryId) {
            result = result.slice(
              result.findIndex(
                (country) =>
                  country.countryId == (countryId as unknown as number)
              ) + 1
            );
          }
          return result.slice(0, 2);
        },
        { timing: 600 }
      );

      this.delete(
        "/countries/:id",
        (schema, request) => {
          const id = request.params.id;

          const element = schema.db.countries.findBy(
            (data) => data.countryId == id
          );

          schema.db.countries.remove(element);
        },
        { timing: 600 }
      );
    }
  });
}
