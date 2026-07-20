import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function MainLayout() {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar fills the full height via align-items:stretch (flex default) */}
      <Sidebar />

      {/* Content column */}
      <div style={{ flex: 1, background: "#F5F7FA", display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        {/* Navbar — hidden on /digital-twin (see Navbar.jsx) */}
        <Navbar />

        {/* Page content */}
        <div style={{ padding: "25px", flex: 1, overflow: "auto" }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default MainLayout;