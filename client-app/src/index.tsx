import { PartialTheme, ThemeProvider } from "@fluentui/react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import ContinentList from "./features/continent/pages/list-continent/ListContinent";
import AddContinent from "./features/continent/pages/add-continent/AddContinent";
import Home from "./features/home/Home";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

export const appTheme: PartialTheme = {
  palette: {
    orange: "#fec703"
  },
  semanticColors: {
    bodyBackground: "transparent"
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
        <Route path="/continents" element={<ContinentList />} />
        <Route path="/add-continent" element={<AddContinent />} />
      </Routes>
    </BrowserRouter>
    <style>{styleOverrides}</style>
  </ThemeProvider>
);
