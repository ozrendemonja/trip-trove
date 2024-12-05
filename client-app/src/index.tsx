import { IFontStyles, IPalette, PartialTheme, ThemeProvider } from '@fluentui/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Navigation } from './shared/navigation/Navigation';
import App from './pages/App';
import { ListContinents } from './features/continent/pages/listContinents';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);


const appTheme: PartialTheme = {
  palette: {
    orange: "#fec703"
  },
  semanticColors: {
    bodyBackground: "radial-gradient(#C3E0E7, #61A9B4)"
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
  <React.StrictMode>
    <ThemeProvider theme={appTheme}>
      <ListContinents />
      <style>{styleOverrides}</style>
    </ThemeProvider >
  </React.StrictMode>
);