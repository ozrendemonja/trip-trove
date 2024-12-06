import { PartialTheme, ThemeProvider } from '@fluentui/react';
import ReactDOM from 'react-dom/client';
import ListElement from './shared/ListElement/ListElement';
import DetailsListAdvancedExampleAAA from './features/continent/Continent';
import ContinentList from './features/continent/pages/Continent';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);


const appTheme: PartialTheme = {
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
          left: 'none',
        },
      }
    },
  },
};

const styleOverrides = `
    body {
      background: radial-gradient(#C3E0E7, #61A9B4);;
    }`;


root.render(
  // <React.StrictMode>
  <ThemeProvider theme={appTheme}>
    <ContinentList />
    <style>{styleOverrides}</style>
  </ThemeProvider >
  // </React.StrictMode>
);
