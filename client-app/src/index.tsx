import { IFontStyles, IPalette, PartialTheme, ThemeProvider } from '@fluentui/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Navigation } from './features/navigation/Navigation';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);


const appTheme: PartialTheme = {
  components: {
    Nav: {
      styles: {
        root: {
          width: "180px",
          maxHeight: "400px",
          boxSizing: 'border-box',
          overflowY: 'auto',
          selectors: {
            '& .navigationHeaders': {
              marginLeft: "5px",
              fontWeight: "bold",
            },
          }
        },
        chevronButton: {
          right: 0,
          left: 'none',
        },
      }
    },
  },
};

root.render(
  <React.StrictMode>
    <ThemeProvider theme={appTheme}>
      <Navigation />
    </ThemeProvider >
  </React.StrictMode>
);