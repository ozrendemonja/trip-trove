import { PartialTheme, ThemeProvider } from "@fluentui/react";
import { ComponentType } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { LoadingSpinner } from "./shared/loading-spinner/LoadingSpinner";

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
    lazy: lazyComponent(() =>
      import("./features/countries-map/CountriesVisitedMap")
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
    lazy: lazyComponent(() =>
      import("./features/continent/pages/list-continent/ListContinent")
    )
  },
  {
    path: "/add-continent",
    HydrateFallback: RouteFallback,
    lazy: lazyComponent(() =>
      import("./features/continent/pages/add-continent/AddContinent")
    )
  },
  {
    path: "/countries",
    HydrateFallback: RouteFallback,
    lazy: lazyComponent(() =>
      import("./features/continent/pages/list-country/ListCountry")
    )
  },
  {
    path: "/add-country",
    HydrateFallback: RouteFallback,
    lazy: lazyComponent(() =>
      import("./features/continent/pages/add-country/AddCountry")
    )
  },
  {
    path: "/regions",
    HydrateFallback: RouteFallback,
    lazy: lazyComponent(() =>
      import("./features/continent/pages/list-region/ListRegion")
    )
  },
  {
    path: "/add-region",
    HydrateFallback: RouteFallback,
    lazy: lazyComponent(() =>
      import("./features/continent/pages/add-region/AddRegion")
    )
  },
  {
    path: "/cities",
    HydrateFallback: RouteFallback,
    lazy: lazyComponent(() =>
      import("./features/continent/pages/list-city/ListCity")
    )
  },
  {
    path: "/add-city",
    HydrateFallback: RouteFallback,
    lazy: lazyComponent(() =>
      import("./features/continent/pages/add-city/AddCity")
    )
  },
  {
    path: "/attractions",
    HydrateFallback: RouteFallback,
    lazy: lazyComponent(() =>
      import("./features/continent/pages/list-attraction/ListAttraction")
    )
  },
  {
    path: "/search/:whereToSearch/:id/attractions",
    HydrateFallback: RouteFallback,
    lazy: lazyComponent(() =>
      import(
        "./features/continent/pages/list-attraction-user/ListAttractionUser"
      )
    )
  },
  {
    path: "/add-attraction",
    HydrateFallback: RouteFallback,
    lazy: lazyComponent(() =>
      import("./features/continent/pages/add-attraction/AddAttraction")
    )
  }
]);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

const appTheme: PartialTheme = {
  palette: {
    orange: "#fec703",
    themePrimary: "#fec703",
    themeDark: "#d4a600",
    themeDarker: "#a88200",
    themeLight: "#fff0a8",
    themeLighter: "#fff7d4",
    themeLighterAlt: "#fffdf5",
    tealLight: "#61A9B4",
    tealDark: "#3d7f8a",
    greenLight: "#e6f4ea",
    greenDark: "#2e7d32"
  },
  semanticColors: {
    bodyBackground: "transparent",
    inputBackgroundChecked: "#FEC703",
    buttonText: "#323130",
    primaryButtonText: "#323130",
    primaryButtonTextHovered: "#323130",
    primaryButtonTextPressed: "#323130"
  },
  components: {
    Nav: {
      styles: {
        chevronButton: {
          right: "5px",
          left: "none"
        }
      }
    }
  }
};

const styleOverrides = `
    body {
      background: radial-gradient(#C3E0E7, #61A9B4);;
    }`;

root.render(
  <ThemeProvider theme={appTheme}>
    <RouterProvider router={router} useTransitions />
    <style>{styleOverrides}</style>
  </ThemeProvider>
);
