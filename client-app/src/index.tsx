import { FluentProvider } from "@fluentui/react-components";
import { ComponentType } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { LoadingSpinner } from "./shared/loading-spinner/LoadingSpinner";
import { appTheme } from "./shared/fluent/AppTheme";

const lazyComponent = (load: () => Promise<{ default: ComponentType }>) => ({
  Component: async () => (await load()).default
});

const RouteFallback = () => <LoadingSpinner text="Loading page" />;

const router = createBrowserRouter([
  {
    path: "/",
    HydrateFallback: RouteFallback,
    lazy: lazyComponent(() => import("./features/home/Home"))
  },
  {
    path: "/countries-map",
    HydrateFallback: RouteFallback,
    lazy: lazyComponent(
      () => import("./features/countries-map/CountriesVisitedMap")
    )
  },
  {
    path: "/my-trips",
    HydrateFallback: RouteFallback,
    lazy: lazyComponent(() => import("./features/my-trip/MyTripList"))
  },
  {
    path: "/my-trips/:tripId",
    HydrateFallback: RouteFallback,
    lazy: lazyComponent(() => import("./features/my-trip/MyTrip"))
  },
  {
    path: "/continents",
    HydrateFallback: RouteFallback,
    lazy: lazyComponent(
      () => import("./features/continent/pages/list-continent/ListContinent")
    )
  },
  {
    path: "/add-continent",
    HydrateFallback: RouteFallback,
    lazy: lazyComponent(
      () => import("./features/continent/pages/add-continent/AddContinent")
    )
  },
  {
    path: "/countries",
    HydrateFallback: RouteFallback,
    lazy: lazyComponent(
      () => import("./features/continent/pages/list-country/ListCountry")
    )
  },
  {
    path: "/add-country",
    HydrateFallback: RouteFallback,
    lazy: lazyComponent(
      () => import("./features/continent/pages/add-country/AddCountry")
    )
  },
  {
    path: "/regions",
    HydrateFallback: RouteFallback,
    lazy: lazyComponent(
      () => import("./features/continent/pages/list-region/ListRegion")
    )
  },
  {
    path: "/add-region",
    HydrateFallback: RouteFallback,
    lazy: lazyComponent(
      () => import("./features/continent/pages/add-region/AddRegion")
    )
  },
  {
    path: "/cities",
    HydrateFallback: RouteFallback,
    lazy: lazyComponent(
      () => import("./features/continent/pages/list-city/ListCity")
    )
  },
  {
    path: "/add-city",
    HydrateFallback: RouteFallback,
    lazy: lazyComponent(
      () => import("./features/continent/pages/add-city/AddCity")
    )
  },
  {
    path: "/attractions",
    HydrateFallback: RouteFallback,
    lazy: lazyComponent(
      () => import("./features/continent/pages/list-attraction/ListAttraction")
    )
  },
  {
    path: "/search/:whereToSearch/:id/attractions",
    HydrateFallback: RouteFallback,
    lazy: lazyComponent(
      () =>
        import("./features/continent/pages/list-attraction-user/ListAttractionUser")
    )
  },
  {
    path: "/add-attraction",
    HydrateFallback: RouteFallback,
    lazy: lazyComponent(
      () => import("./features/continent/pages/add-attraction/AddAttraction")
    )
  }
]);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

const styleOverrides = `
    body {
      background: radial-gradient(#C3E0E7, #61A9B4);;
    }`;

root.render(
  <FluentProvider theme={appTheme} style={{ backgroundColor: "transparent" }}>
    <RouterProvider router={router} useTransitions />
    <style>{styleOverrides}</style>
  </FluentProvider>
);
