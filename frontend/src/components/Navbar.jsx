import { useLocation } from "react-router-dom";

/**
 * Navbar — global top bar for all routes.
 * The Digital Twin page manages its own top control bar (ControlBar.jsx),
 * so this component returns null on that route to avoid wasting viewport space.
 */
function Navbar() {
  const { pathname } = useLocation();

  // These pages manage their own headers — no global Navbar needed
  if (["/digital-twin", "/simulation", "/analytics"].includes(pathname)) return null;

  return (
    <div
      style={{
        height: "70px",
        background: "white",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 30px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      }}
    >
      <h2>Digital Twin Agriculture Platform</h2>
      <div>
        <strong>PAU Research Farm</strong>
      </div>
    </div>
  );
}

export default Navbar;