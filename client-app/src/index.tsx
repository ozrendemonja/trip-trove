import { PartialTheme, ThemeProvider } from "@fluentui/react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import ContinentList from "./features/continent/pages/list-continent/ListContinent";
import AddContinent from "./features/continent/pages/add-continent/AddContinent";
import Home from "./features/home/Home";
import CountryList from "./features/continent/pages/list-country/ListCountry";
import AddCountry from "./features/continent/pages/add-country/AddCountry";
import AddRegion from "./features/continent/pages/add-region/AddRegion";
import RegionList from "./features/continent/pages/list-region/ListRegion";
import CityList from "./features/continent/pages/list-city/ListCity";
import AddCity from "./features/continent/pages/add-city/AddCity";
import AttractionList from "./features/continent/pages/list-attraction/ListAttraction";
import AddAttraction from "./features/continent/pages/add-attraction/AddAttraction";
import AttractionListUser from "./features/continent/pages/list-attraction-user/ListAttractionUser";
import MyTrip from "./features/my-trip/MyTrip";
import MyTripList from "./features/my-trip/MyTripList";

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
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/my-trips" element={<MyTripList />} />
        <Route path="/my-trips/:tripId" element={<MyTrip />} />
        <Route path="/continents" element={<ContinentList />} />
        <Route path="/add-continent" element={<AddContinent />} />
        <Route path="/countries" element={<CountryList />} />
        <Route path="/add-country" element={<AddCountry />} />
        <Route path="/regions" element={<RegionList />} />
        <Route path="/add-region" element={<AddRegion />} />
        <Route path="/cities" element={<CityList />} />
        <Route path="/add-city" element={<AddCity />} />
        <Route path="/attractions" element={<AttractionList />} />
        <Route
          path="/search/:whereToSearch/:id/attractions"
          element={<AttractionListUser />}
        />
        <Route path="/add-attraction" element={<AddAttraction />} />
      </Routes>
    </BrowserRouter>
    <style>{styleOverrides}</style>
  </ThemeProvider>
);
