import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppEntry } from "./app/AppEntry";
import "./app/styles.css";
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Build Wars root element was not found.");
createRoot(rootElement).render(
  <StrictMode>
    <AppEntry />
  </StrictMode>
);
