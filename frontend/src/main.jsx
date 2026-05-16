import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/index";
import App from "./App.jsx";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "sonner";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <Toaster 
            position="top-center" 
            theme="dark" 
            closeButton
            toastOptions={{
              style: {
                fontSize: '11px',
                fontWeight: '900',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                padding: '12px 20px',
                minHeight: 'auto',
                width: 'fit-content',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.2)',
                borderLeft: '4px solid #6C75BD',
                background: '#2A2B36',
                color: '#ffffff',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(12px)',
                marginTop: '100px',
                marginLeft: '50px',
              }
            }}
          />
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
