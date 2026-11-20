
import { Bell, AlertTriangle, CheckCircle2, Info } from "lucide-react";

const alerts = [
  {
    title: "High pressure detected",
    description: "Pressure reached 86.5 PSI in the Cooling System.",
    time: "10 minutes ago",
    severity: "Warning",
    icon: AlertTriangle,
  },
  {
    title: "Temperature threshold exceeded",
    description: "Boiler Unit A crossed its configured temperature threshold.",
    time: "35 minutes ago",
    severity: "Critical",
    icon: AlertTriangle,
  },
  {
    title: "Workflow executed successfully",
    description: "Vibration monitoring completed its latest execution.",
    time: "1 hour ago",
    severity: "Success",
    icon: CheckCircle2,
  },
  {
    title: "Device connection restored",
    description: "Humidity Sensor is connected again.",
    time: "3 hours ago",
    severity: "Information",
    icon: Info,
  },
];

function Alerts() {
  return (
    <div className="page-content">
      <section className="page-heading">
        <div>
          <div className="eyebrow">SYSTEM NOTIFICATIONS</div>
          <h1>Alerts & Events</h1>
          <p>Review important events from your industrial operations.</p>
        </div>
        <button className="select-button">Mark all as read</button>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-top"><span>Total alerts</span><Bell size={18} /></div>
          <div className="stat-value">12</div>
          <div className="stat-note">Recorded notifications</div>
        </div>
        <div className="stat-card">
          <div className="stat-top"><span>Critical</span><AlertTriangle size={18} /></div>
          <div className="stat-value">02</div>
          <div className="stat-note">Require attention</div>
        </div>
        <div className="stat-card">
          <div className="stat-top"><span>Resolved</span><CheckCircle2 size={18} /></div>
          <div className="stat-value">08</div>
          <div className="stat-note">Successfully resolved</div>
        </div>
        <div className="stat-card">
          <div className="stat-top"><span>Unread</span><Info size={18} /></div>
          <div className="stat-value">04</div>
          <div className="stat-note">New notifications</div>
        </div>
      </section>

      <section className="panel sensors-panel">
        <div className="panel-heading sensor-heading">
          <div>
            <span className="panel-kicker">RECENT ACTIVITY</span>
            <h2>All notifications</h2>
            <p>Latest events across your workspace</p>
          </div>
        </div>

        <div className="workflow-list">
          {alerts.map((alert) => {
            const Icon = alert.icon;
            return (
              <div className="workflow-item" key={alert.title}>
                <div className="workflow-icon">
                  <Icon size={17} />
                </div>
                <div className="workflow-info">
                  <strong>{alert.title}</strong>
                  <small>{alert.description}</small>
                  <small>{alert.time}</small>
                </div>
                <span className={`device-status ${alert.severity.toLowerCase()}`}>
                  <span />
                  {alert.severity}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default Alerts;
