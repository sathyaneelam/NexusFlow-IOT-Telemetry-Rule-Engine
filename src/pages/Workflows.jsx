import { useNavigate } from "react-router-dom";

import {
  Plus,
  Search,
  MoreHorizontal,
  Workflow,
  Clock,
  Activity,
} from "lucide-react";

const workflows = [
  {
    name: "Temperature threshold",
    description: "Monitor boiler temperature and trigger alerts",
    device: "Boiler Unit A",
    status: "Active",
    updated: "2 minutes ago",
  },
  {
    name: "Vibration monitoring",
    description: "Detect abnormal motor vibration levels",
    device: "Motor Unit B",
    status: "Active",
    updated: "15 minutes ago",
  },
  {
    name: "Pressure regulation",
    description: "Monitor cooling system pressure",
    device: "Cooling System",
    status: "Paused",
    updated: "1 hour ago",
  },
  {
    name: "Humidity monitoring",
    description: "Track humidity in the storage facility",
    device: "Storage Facility",
    status: "Active",
    updated: "Yesterday",
  },
];

function Workflows() {
  const navigate = useNavigate();

  return (
    <div className="page-content">
      <section className="page-heading">
        <div>
          <div className="eyebrow">AUTOMATION MANAGEMENT</div>
          <h1>Workflows</h1>
          <p>Create, manage and monitor your industrial automation rules.</p>
        </div>

        <button className="primary-button" onClick={() => navigate("/workflows/builder")}>
          <Plus size={16} />
          Create workflow
        </button>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            <span>Total workflows</span>
            <Workflow size={18} />
          </div>
          <div className="stat-value">08</div>
          <div className="stat-note">Across your workspace</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Active workflows</span>
            <Activity size={18} />
          </div>
          <div className="stat-value">06</div>
          <div className="stat-note">Currently running</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Paused workflows</span>
            <Clock size={18} />
          </div>
          <div className="stat-value">02</div>
          <div className="stat-note">Not currently executing</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Executions today</span>
            <Activity size={18} />
          </div>
          <div className="stat-value">1,284</div>
          <div className="stat-note">Across all workflows</div>
        </div>
      </section>

      <section className="panel sensors-panel">
        <div className="panel-heading sensor-heading">
          <div>
            <span className="panel-kicker">YOUR AUTOMATIONS</span>
            <h2>All workflows</h2>
            <p>Manage your configured automation rules</p>
          </div>

          <button className="select-button">
            <Search size={15} />
            Search workflows
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>WORKFLOW</th>
                <th>CONNECTED DEVICE</th>
                <th>STATUS</th>
                <th>LAST UPDATED</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {workflows.map((item) => (
                <tr key={item.name}>
                  <td>
                    <div className="sensor-name">
                      <div className="sensor-icon">
                        <Workflow size={16} />
                      </div>
                      <div>
                        <strong>{item.name}</strong>
                        <small>{item.description}</small>
                      </div>
                    </div>
                  </td>

                  <td className="location-cell">{item.device}</td>

                  <td>
                    <span
                      className={`device-status ${item.status.toLowerCase()}`}
                    >
                      <span />
                      {item.status}
                    </span>
                  </td>

                  <td className="location-cell">{item.updated}</td>

                  <td>
                    <button className="more-button" aria-label="More options">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Workflows;
