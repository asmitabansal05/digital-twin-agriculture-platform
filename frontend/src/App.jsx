import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import DigitalTwin from "./pages/DigitalTwin";
import Farms from "./pages/Farms";
import Simulation from "./pages/Simulation";
import Analytics from "./pages/Analytics";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/digital-twin" element={<DigitalTwin />} />
          <Route path="/farms" element={<Farms />} />
          <Route path="/simulation" element={<Simulation />} />
          <Route path="/analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
