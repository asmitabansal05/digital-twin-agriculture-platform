import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const SIMULATOR_URL =
  "https://digital-twin-agriculture-simulator.onrender.com/generate";

function MainLayout() {

  useEffect(() => {
    const generateReading = () => {
      // Trigger the simulator without requiring CORS
      const img = new Image();
      img.src = `${SIMULATOR_URL}?t=${Date.now()}`;
    };

    // Generate immediately when the application opens
    generateReading();

    // Generate new sensor readings every 10 seconds
    const interval = setInterval(generateReading, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />

      <div
        style={{
          flex: 1,
          background: "#F5F7FA",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <Navbar />

        <div style={{ padding: "25px", flex: 1, overflow: "auto" }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default MainLayout;