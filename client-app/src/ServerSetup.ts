import { createServer, Model } from "miragejs";
import {
  GetCityResponse,
  GetContinentResponse,
  GetCountryResponse,
  GetRegionResponse,
  UpdateCityDetailsRequest,
  UpdateCityRegionRequest,
  UpdateContinentRequest,
  UpdateCountryContinentRequest,
  UpdateRegionCountryRequest,
  UpdateRegionDetailResponse,
  UpdateRegionDetailsRequest
} from "./clients/manager";

export default function makeServer(): ReturnType<typeof createServer> {
  return createServer({
    models: {
      continent: Model.extend<GetContinentResponse>({}),
      country: Model.extend<GetCountryResponse>({}),
      region: Model.extend<GetRegionResponse>({}),
      city: Model.extend<GetCityResponse>({})
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
      server.create("country", {
        countryId: 3,
        continentName: "Europe",
        countryName: "Lithuania",
        changedOn: "2024-12-26T08:01:02.0000000"
      });

      server.create("region", {
        regionId: 0,
        regionName: "Monaco",
        countryName: "Monaco",
        changedOn: "2024-12-23T08:01:02.0000000"
      });
      server.create("region", {
        regionId: 1,
        regionName: "Samogitia",
        countryName: "Lithuania",
        changedOn: "2024-12-22T08:01:02.0000000"
      });
      server.create("region", {
        regionId: 2,
        regionName: "Aukštaitija",
        countryName: "Lithuania",
        changedOn: "2024-12-21T08:01:02.0000000"
      });
      server.create("region", {
        regionId: 3,
        regionName: "Dzūkija",
        countryName: "Lithuania",
        changedOn: "2024-12-26T08:01:02.0000000"
      });

      server.create("city", {
        cityId: 0,
        cityName: "Monaco",
        regionName: "Monaco",
        countryName: "Monaco",
        changedOn: "2024-12-23T08:01:02.0000000"
      });
      server.create("city", {
        cityId: 1,
        cityName: "Šiauliai",
        regionName: "Samogitia",
        countryName: "Lithuanian",
        changedOn: "2024-12-23T08:01:02.0000000"
      });
      server.create("city", {
        cityId: 2,
        cityName: "Kaunas",
        regionName: "Aukštaitija",
        countryName: "Lithuania",
        changedOn: "2024-12-21T08:01:02.0000000"
      });
      server.create("city", {
        cityId: 3,
        cityName: "Vilnius ",
        regionName: "Dzūkija",
        countryName: "Lithuania",
        changedOn: "2024-12-26T08:01:02.0000000"
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

      this.get(
        "/countries/:id",
        (schema, request) => {
          const id = request.params.id;

          return schema.db.countries.findBy((data) => data.countryId == id);
        },
        { timing: 400 }
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

      this.put(
        "/countries/:id/details",
        (schema, request) => {
          const id = request.params.id;
          const newName = (
            JSON.parse(request.requestBody) as UpdateRegionDetailResponse
          ).countryName;

          const element = schema.db.countries.findBy((data) => {
            return data.countryId == id;
          });
          schema.db.countries.update(element.id, { countryName: newName });
        },
        { timing: 600 }
      );

      this.put(
        "/countries/:id/continent",
        (schema, request) => {
          const id = request.params.id;
          const newName = (
            JSON.parse(request.requestBody) as UpdateCountryContinentRequest
          ).continentName;

          const element = schema.db.countries.findBy((data) => {
            return data.countryId == id;
          });
          schema.db.countries.update(element.id, { continentName: newName });
        },
        { timing: 600 }
      );

      this.get("/search", (schema, request) => {
        const query = request.queryParams.q;
        const inElement = request.queryParams.i;

        if (inElement == "COUNTRY") {
          let result = schema.db.countries
            .sort()
            .filter((data) => data.countryName.includes(query))
            .map((country) => {
              return {
                value: country.countryName,
                id: country.countryId,
                strategyType: "RANK"
              };
            });

          return { prefix: query, suggestions: result };
        } else if (inElement == "REGION") {
          let result = schema.db.regions
            .sort()
            .filter((data) => data.regionName.includes(query))
            .map((region) => {
              return {
                value: region.regionName,
                id: region.regionId,
                strategyType: "RANK"
              };
            });

          return { prefix: query, suggestions: result };
        } else if (inElement == "CITY") {
          let result = schema.db.cities
            .sort()
            .filter((city) => city.cityName.includes(query))
            .map((city) => {
              return {
                value:
                  city.cityName +
                  ", " +
                  city.regionName +
                  ", " +
                  city.countryName,
                id: city.cityId,
                strategyType: "RANK"
              };
            });

          return { prefix: query, suggestions: result };
        }
      });

      this.get(
        "/regions",
        (schema, request) => {
          const sortDirection = request.queryParams.sd;
          const regionId = request.queryParams.regionId;
          let result = schema.db.regions.sort() as GetRegionResponse[];
          if (sortDirection != "ASC") {
            result = result.toReversed();
          }

          if (regionId) {
            result = result.slice(
              result.findIndex(
                (region) => region.regionId == (regionId as unknown as number)
              ) + 1
            );
          }
          return result.slice(0, 2);
        },
        { timing: 600 }
      );

      this.delete(
        "/regions/:id",
        (schema, request) => {
          const id = request.params.id;

          const element = schema.db.regions.findBy(
            (data) => data.regionId == id
          );

          schema.db.regions.remove(element);
        },
        { timing: 600 }
      );

      this.put(
        "/regions/:id/details",
        (schema, request) => {
          const id = request.params.id;
          const newName = (
            JSON.parse(request.requestBody) as UpdateRegionDetailsRequest
          ).regionName;

          const element = schema.db.regions.findBy((data) => {
            return data.regionId == id;
          });
          schema.db.regions.update(element.id, { regionName: newName });
        },
        { timing: 600 }
      );

      this.put(
        "/regions/:id/country",
        (schema, request) => {
          const id = request.params.id;
          const countryId = (
            JSON.parse(request.requestBody) as UpdateRegionCountryRequest
          ).countryId;
          const newName = schema.db.countries.findBy(
            (data) => data.countryId == countryId
          ).countryName;

          const element = schema.db.regions.findBy((data) => {
            return data.regionId == id;
          });
          schema.db.regions.update(element.id, { countryName: newName });
        },
        { timing: 600 }
      );

      this.get(
        "/regions/:id",
        (schema, request) => {
          const id = request.params.id;

          return schema.db.regions.findBy((data) => data.regionId == id);
        },
        { timing: 400 }
      );

      this.get(
        "/cities",
        (schema, request) => {
          const sortDirection = request.queryParams.sd;
          const cityId = request.queryParams.cityId;
          let result = schema.db.cities.sort() as GetCityResponse[];
          if (sortDirection != "ASC") {
            result = result.toReversed();
          }

          if (cityId) {
            result = result.slice(
              result.findIndex(
                (city) => city.cityId == (cityId as unknown as number)
              ) + 1
            );
          }
          return result.slice(0, 2);
        },
        { timing: 600 }
      );

      this.delete(
        "/cities/:id",
        (schema, request) => {
          const id = request.params.id;

          const element = schema.db.cities.findBy((data) => data.cityId == id);
          schema.db.cities.remove(element);
        },
        { timing: 600 }
      );

      this.get(
        "/cities/:id",
        (schema, request) => {
          const id = request.params.id;

          return schema.db.cities.findBy((data) => data.cityId == id);
        },
        { timing: 400 }
      );

      this.put(
        "/cities/:id/details",
        (schema, request) => {
          const id = request.params.id;
          const newName = (
            JSON.parse(request.requestBody) as UpdateCityDetailsRequest
          ).cityName;

          const element = schema.db.cities.findBy((data) => data.cityId == id);
          schema.db.cities.update(element.id, { cityName: newName });
        },
        { timing: 600 }
      );

      this.put(
        "/cities/:id/region",
        (schema, request) => {
          const id = request.params.id;
          const regionId = (
            JSON.parse(request.requestBody) as UpdateCityRegionRequest
          ).regionId;
          const newName = schema.db.regions.findBy(
            (data) => data.regionId == regionId
          ).regionName;

          const element = schema.db.cities.findBy((data) => {
            return data.cityId == id;
          });
          schema.db.cities.update(element.id, { regionName: newName });
        },
        { timing: 600 }
      );
    }
  });
}
