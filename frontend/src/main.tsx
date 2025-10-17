import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom"; // 1. HIER importieren

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
 <BrowserRouter>
    <App />
  </BrowserRouter>
);