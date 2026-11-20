
import {
  Activity,
  TrendingUp,
  Radio,
  Clock,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const telemetryData = [
  { time: "08:00", temperature: 62, pressure: 45 },
  { time: "09:00", temperature: 65, pressure: 52 },
  { time: "10:00", temperature: 61, pressure: 48 },
  { time: "11:00", temperature: 69, pressure: 58 },
  { time: "12:00", temperature: 72, pressure: 55 },
  { time: "13:00", temperature: 67, pressure: 63 },
  { time: "14:00", temperature: 76, pressure: 59 },
  { time: "15:00", temperature: 73, pressure: 68 },
  { time: "16:00", temperature: 81, pressure: 64 },
  { time: "17:00", temperature: 78, pressure: 72 },
];

const eventData = [
  { name: "Mon", events: 420 },
  { name: "Tue", events: 580 },
  { name: "Wed", events: 490 },
  { name: "Thu", events: 720 },
  { name: "Fri", events: 640 },
  { name: "Sat", events: 810 },
  { name: "Sun", events: 560 },
];

function Analytics() {
  return (
    <div className="page-content">
      <section className="page-heading">
        <div>
          <div className="eyebrow">SYSTEM INSIGHTS</div>
          <h1>Analytics</h1>
          <p>Understand your industrial performance through telemetry data.</p>
        </div>

        <button className="select-button">
          Last 7 days
        </button>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            <span>Events processed</span>
            <Activity size={18} />
          </div>
          <div className="stat-value">12,840</div>
          <div className="stat-note">+8.2% from last week</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Average temperature</span>
            <TrendingUp size={18} />
          </div>
          <div className="stat-value">74.8°C</div>
          <div className="stat-note">Across production units</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Active sensors</span>
            <Radio size={18} />
          </div>
          <div className="stat-value">22</div>
          <div className="stat-note">Out of 24 registered</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>System uptime</span>
            <Clock size={18} />
          </div>
          <div className="stat-value">99.8%</div>
          <div className="stat-note">Over the last 7 days</div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">TELEMETRY ANALYSIS</span>
              <h2>Temperature trends</h2>
              <p>Average readings throughout the day</p>
            </div>
          </div>

          <div className="chart-summary">
            <strong>74.8°C</strong>
            <span className="summary-caption">Average temperature</span>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryData}>
                <defs>
                  <linearGradient id="analyticsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#648675" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#648675" stopOpacity={0.01} />
                  </linearGradient>
                </defs>

                <CartesianGrid stroke="#ECEDE8" vertical={false} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} />
                <YAxis domain={[40, 100]} axisLine={false} tickLine={false} />

                <Tooltip
                  contentStyle={{
                    border: "1px solid #E7E9E3",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value) => [`${value}°C`, "Temperature"]}
                />

                <Area
                  type="monotone"
                  dataKey="temperature"
                  stroke="#648675"
                  strokeWidth={2.2}
                  fill="url(#analyticsFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">WEEKLY ACTIVITY</span>
              <h2>Events processed</h2>
              <p>Daily telemetry event volume</p>
            </div>
          </div>

          <div className="chart-summary">
            <strong>4,220</strong>
            <span className="summary-caption">This week's events</span>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventData}>
                <CartesianGrid stroke="#ECEDE8" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />

                <Tooltip
                  contentStyle={{
                    border: "1px solid #E7E9E3",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />

                <Bar
                  dataKey="events"
                  fill="#648675"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Analytics;
