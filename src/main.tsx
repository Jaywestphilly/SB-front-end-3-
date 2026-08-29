import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { reportWebVitals } from "./utils/performance";
import { registerServiceWorker } from "./utils/serviceWorkerRegistration";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";

// Register Service Worker for offline support & 5:00 AM EST background sync
registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
reportWebVitals(console.log);

