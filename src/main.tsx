import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if (import.meta.env.VITE_PRIMARY_COLOR) {
  const style = document.documentElement.style;
  style.setProperty("--primary", import.meta.env.VITE_PRIMARY_COLOR);
  style.setProperty(
    "--primary-foreground",
    import.meta.env.VITE_PRIMARY_FOREGROUND,
  );
  style.setProperty("--ring", import.meta.env.VITE_PRIMARY_COLOR);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
