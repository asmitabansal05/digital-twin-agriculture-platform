import { NavLink } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import DeviceHubIcon from "@mui/icons-material/DeviceHub";
import ScienceIcon from "@mui/icons-material/Science";
import BarChartIcon from "@mui/icons-material/BarChart";

const NAV_LINKS = [
  { to: "/dashboard",    label: "Dashboard",    Icon: DashboardIcon,   desc: "Overview & KPIs"    },
  { to: "/digital-twin", label: "Digital Twin", Icon: DeviceHubIcon,   desc: "Live field map"     },
  { to: "/farms",        label: "Farms",        Icon: AgricultureIcon, desc: "Manage farms"       },
  { to: "/simulation",   label: "Simulation",   Icon: ScienceIcon,     desc: "AI crop scenarios"  },
  { to: "/analytics",    label: "Analytics",    Icon: BarChartIcon,    desc: "Reports & trends"   },
];

/* Live status data — static for now, replace with real system health endpoint later */
const SYSTEM_STATUS = [
  { label: "Twin Engine",  value: "Online",  ok: true  },
  { label: "AI Model",     value: "Ready",   ok: true  },
  { label: "Sensor Feed",  value: "Active",  ok: true  },
  { label: "Last Sync",    value: "2m ago",  ok: true  },
];

function Sidebar() {
  return (
    <div
      style={{
        width: "228px",
        background: "linear-gradient(180deg, #14532d 0%, #166534 55%, #14532d 100%)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        flexShrink: 0,
        borderRight: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* ── Brand ── */}
      <div
        style={{
          padding: "18px 18px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.10)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              background: "rgba(255,255,255,0.14)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            🌱
          </div>
          <div>
            <div style={{ fontWeight: "700", fontSize: "16px", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
              AgriTwin
            </div>
            <div style={{ fontSize: "10px", opacity: 0.5, fontWeight: "600", letterSpacing: "0.1em", marginTop: "2px" }}>
              DIGITAL TWIN AI
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{ padding: "14px 10px 10px", flexShrink: 0 }}>
        <p
          style={{
            fontSize: "10px",
            fontWeight: "700",
            letterSpacing: "0.16em",
            opacity: 0.4,
            padding: "0 10px 10px",
            textTransform: "uppercase",
          }}
        >
          Menu
        </p>
        {NAV_LINKS.map(({ to, label, Icon, desc }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "11px 12px",
              marginBottom: "3px",
              borderRadius: "9px",
              textDecoration: "none",
              color: "white",
              background: isActive ? "rgba(255,255,255,0.16)" : "transparent",
              borderLeft: isActive
                ? "3px solid rgba(255,255,255,0.75)"
                : "3px solid transparent",
              transition: "all 0.18s ease",
              opacity: isActive ? 1 : 0.68,
            })}
          >
            {({ isActive }) => (
              <>
                <Icon style={{ fontSize: "20px", flexShrink: 0, opacity: isActive ? 1 : 0.85 }} />
                <div>
                  <div style={{ fontSize: "14px", fontWeight: isActive ? "700" : "500", lineHeight: 1.2 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: "11px", opacity: 0.5, marginTop: "1px", fontWeight: "400" }}>
                    {desc}
                  </div>
                </div>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── System Status — fills the visual middle space ── */}
      <div
        style={{
          margin: "4px 14px 0",
          borderRadius: "10px",
          background: "rgba(0,0,0,0.18)",
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "12px 14px",
          flexShrink: 0,
        }}
      >
        <p
          style={{
            fontSize: "10px",
            fontWeight: "700",
            letterSpacing: "0.14em",
            opacity: 0.45,
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          System Status
        </p>
        {SYSTEM_STATUS.map(({ label, value, ok }) => (
          <div
            key={label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <span style={{ fontSize: "12px", opacity: 0.6, fontWeight: "500" }}>{label}</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "11px",
                fontWeight: "700",
                color: ok ? "#86efac" : "#fca5a5",
              }}
            >
              <span
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: ok ? "#4ade80" : "#f87171",
                  boxShadow: ok ? "0 0 5px #4ade80" : "0 0 5px #f87171",
                  display: "inline-block",
                }}
              />
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Push footer to bottom */}
      <div style={{ flex: 1 }} />

      {/* ── Footer ── */}
      <div
        style={{
          padding: "14px 18px 16px",
          borderTop: "1px solid rgba(255,255,255,0.09)",
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: "12px", fontWeight: "700", opacity: 0.75, marginBottom: "3px" }}>
          PAU Research Station
        </div>
        <div style={{ fontSize: "11px", opacity: 0.42 }}>
          Ludhiana, Punjab · India
        </div>
        <div style={{ fontSize: "11px", opacity: 0.38, marginTop: "2px" }}>
          30.9010°N · 75.8573°E
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
