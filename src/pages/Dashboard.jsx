
import {
  Activity,
  Workflow,
  Bell,
  Radio,
  Thermometer,
  Zap,
  ChevronDown,
  ArrowUpRight,
  ArrowRight,
  MoreHorizontal,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const chartData = [
  { time: "08:00", value: 62 },
  { time: "09:00", value: 65 },
  { time: "10:00", value: 61 },
  { time: "11:00", value: 69 },
  { time: "12:00", value: 72 },
  { time: "13:00", value: 67 },
  { time: "14:00", value: 76 },
  { time: "15:00", value: 73 },
  { time: "16:00", value: 81 },
  { time: "17:00", value: 78 },
  { time: "18:00", value: 74 },
];

const sensors = [
  { id: "SNS-001", name: "Boiler Temperature", location: "Production Unit A", value: "74.2", unit: "°C", status: "Normal" },
  { id: "SNS-002", name: "Motor Vibration", location: "Production Unit B", value: "2.4", unit: "mm/s", status: "Normal" },
  { id: "SNS-003", name: "Pressure Sensor", location: "Cooling System", value: "86.5", unit: "PSI", status: "Warning" },
  { id: "SNS-004", name: "Humidity Sensor", location: "Storage Facility", value: "48.2", unit: "%", status: "Normal" },
];

function StatCard({ label, value, note, icon: Icon, warning }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <div className={`stat-icon ${warning ? "warning-icon" : ""}`}>
          <Icon size={17} strokeWidth={1.8} />
        </div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-note">{note}</div>
    </div>
  );
}

function WorkflowItem({ name, detail }) {
  return (
    <div className="workflow-item">
      <div className="workflow-icon"><Zap size={16} /></div>
      <div className="workflow-info">
        <strong>{name}</strong>
        <small>{detail}</small>
      </div>
      <span className="running-status"><span />Active</span>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="page-content">
      <section className="page-heading">
        <div>
          <div className="eyebrow">FRIDAY, NOVEMBER 20, 2026</div>
          <h1>Overview</h1>
          <p>Monitor your industrial operations and system performance.</p>
        </div>
        <button className="primary-button">
          <Workflow size={16} />
          Create workflow
        </button>
      </section>

      <section className="stats-grid">
        <StatCard label="Connected sensors" value="24" note="Across 4 production units" icon={Radio} />
        <StatCard label="Active workflows" value="08" note="All workflows running" icon={Workflow} />
        <StatCard label="Events processed" value="12,840" note="+8.2% from yesterday" icon={Activity} />
        <StatCard label="Active alerts" value="02" note="1 requires attention" icon={Bell} warning />
      </section>

      <section className="dashboard-grid">
        <div className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">TELEMETRY OVERVIEW</span>
              <h2>Sensor activity</h2>
              <p>Average temperature across production units</p>
            </div>
            <button className="select-button">
              Last 24 hours <ChevronDown size={14} />
            </button>
          </div>

          <div className="chart-summary">
            <strong>74.8°C</strong>
            <span className="trend"><ArrowUpRight size={14} /> 4.2%</span>
            <span className="summary-caption">Average temperature</span>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 12, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="temperatureFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#648675" stopOpacity={0.19} />
                    <stop offset="100%" stopColor="#648675" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#ECEDE8" vertical={false} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#92968F", fontSize: 11 }} dy={10} />
                <YAxis domain={[40, 100]} axisLine={false} tickLine={false} tick={{ fill: "#92968F", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ border: "1px solid #E7E9E3", borderRadius: 8, fontSize: 12 }}
                  formatter={(value) => [`${value}°C`, "Temperature"]}
                />
                <Area type="monotone" dataKey="value" stroke="#648675" strokeWidth={2.2} fill="url(#temperatureFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-footer">
            <span><span className="legend-dot" /> Temperature readings</span>
            <span>Updated just now</span>
          </div>
        </div>

        <div className="panel workflow-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">AUTOMATION</span>
              <h2>Recent workflows</h2>
              <p>Your active rule configurations</p>
            </div>
            <button className="more-button"><MoreHorizontal size={19} /></button>
          </div>

          <div className="workflow-list">
            <WorkflowItem name="Temperature threshold" detail="Boiler Unit A" />
            <WorkflowItem name="Vibration monitoring" detail="Motor Unit B" />
            <WorkflowItem name="Pressure regulation" detail="Cooling System" />
            <WorkflowItem name="Humidity monitoring" detail="Storage Facility" />
          </div>

          <button className="text-link" onClick={() => window.location.assign("/workflows")}>
            View all workflows <ArrowRight size={15} />
          </button>
        </div>
      </section>

      <section className="panel sensors-panel">
        <div className="panel-heading sensor-heading">
          <div>
            <span className="panel-kicker">DEVICE MANAGEMENT</span>
            <h2>Connected sensors</h2>
            <p>Current readings from your connected devices</p>
          </div>
          <button className="select-button">
            All devices <ChevronDown size={14} />
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SENSOR</th>
                <th>LOCATION</th>
                <th>CURRENT READING</th>
                <th>STATUS</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sensors.map((sensor) => (
                <tr key={sensor.id}>
                  <td>
                    <div className="sensor-name">
                      <div className="sensor-icon"><Thermometer size={16} /></div>
                      <div>
                        <strong>{sensor.name}</strong>
                        <small>{sensor.id}</small>
                      </div>
                    </div>
                  </td>
                  <td className="location-cell">{sensor.location}</td>
                  <td className="reading-cell">{sensor.value}<span>{sensor.unit}</span></td>
                  <td>
                    <span className={`device-status ${sensor.status.toLowerCase()}`}>
                      <span />{sensor.status}
                    </span>
                  </td>
                  <td><button className="more-button"><MoreHorizontal size={18} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button className="text-link sensor-link" onClick={() => window.location.assign("/devices")}>
          View all sensors <ArrowRight size={15} />
        </button>
      </section>

      <footer className="footer">
        <span>© 2026 NexusFlow</span>
        <span>Industrial intelligence, simplified.</span>
      </footer>
    </div>
  );
}

export default Dashboard;
