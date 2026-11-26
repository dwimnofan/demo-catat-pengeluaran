import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/demo-catat-pengeluaran/sw.js").then((reg) => {
      reg.addEventListener("updatefound", () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener("statechange", () => {
          if (nw.state === "installed" && navigator.serviceWorker.controller) {
            window.location.reload();
          }
        });
      });
    }).catch(() => {});
  });
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // no-op to allow reload flow above
  });
}

