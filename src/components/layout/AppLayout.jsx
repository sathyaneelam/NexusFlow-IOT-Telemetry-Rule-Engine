
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Workflow,
  Radio,
  Activity,
  Bell,
  Settings,
  Search,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react";

import "../../App.css";

const navigation = [
  { label: "Overview", path: "/", icon: LayoutDashboard },
  { label: "Workflows", path: "/workflows", icon: Workflow },
  { label: "Devices", path: "/devices", icon: Radio },
  { label: "Analytics", path: "/analytics", icon: Activity },
  { label: "Alerts", path: "/alerts", icon: Bell },
];

function AppLayout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">N</div>
          <div>
            <div className="brand-name">nexusflow</div>
            <div className="brand-caption">
              INDUSTRIAL INTELLIGENCE
            </div>
          </div>
        </div>

        <div className="workspace">
          <div className="workspace-icon">A</div>
          <div className="workspace-info">
            <span>Acme Industries</span>
            <small>Workspace</small>
          </div>
          <ChevronDown size={15} />
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav className="navigation">
          {navigation.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
              {label === "Alerts" && (
                <span className="nav-count">2</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <Settings size={17} />
            <span>Settings</span>
          </NavLink>

          <div className="profile">
            <div className="avatar">MZ</div>
            <div className="profile-info">
              <strong>Mohammed Zaid</strong>
              <small>Frontend Developer</small>
            </div>
            <MoreHorizontal size={18} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span>
            <strong>
              {navigation.find(
                (item) => item.path === window.location.pathname
              )?.label || "Settings"}
            </strong>
          </div>

          <div className="topbar-actions">
            <div className="system-status">
              <span className="status-dot" />
              All systems operational
            </div>

            <button className="icon-button" aria-label="Search">
              <Search size={18} />
            </button>

            <button
              className="icon-button notification-button"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span />
            </button>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
