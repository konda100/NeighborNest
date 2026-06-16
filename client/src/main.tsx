import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./auth";
import { NeighborhoodProvider } from "./neighborhood";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NeighborhoodProvider>
          <App />
        </NeighborhoodProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
