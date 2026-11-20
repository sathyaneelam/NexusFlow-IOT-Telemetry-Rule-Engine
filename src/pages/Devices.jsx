
import {
  Plus,
  Radio,
  Thermometer,
  Activity,
  MoreHorizontal,
  Wifi,
} from "lucide-react";

const devices = [
  {
    id: "SNS-001",
    name: "Boiler Temperature",
    location: "Production Unit A",
    reading: "74.2",
    unit: "°C",
    status: "Normal",
    type: "Temperature sensor",
  },
  {
    id: "SNS-002",
    name: "Motor Vibration",
    location: "Production Unit B",
    reading: "2.4",
    unit: "mm/s",
    status: "Normal",
    type: "Vibration sensor",
  },
  {
    id: "SNS-003",
    name: "Pressure Sensor",
    location: "Cooling System",
    reading: "86.5",
    unit: "PSI",
    status: "Warning",
    type: "Pressure sensor",
  },
  {
    id: "SNS-004",
    name: "Humidity Sensor",
    location: "Storage Facility",
    reading: "48.2",
    unit: "%",
    status: "Normal",
    type: "Humidity sensor",
  },
];

function Devices() {
  return (
    <div className="page-content">
      <section className="page-heading">
        <div>
          <div className="eyebrow">DEVICE MANAGEMENT</div>
          <h1>Devices</h1>
          <p>Monitor and manage your connected industrial sensors.</p>
        </div>

        <button className="primary-button">
          <Plus size={16} />
          Add device
        </button>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            <span>Total devices</span>
            <Radio size={18} />
          </div>
          <div className="stat-value">24</div>
          <div className="stat-note">Registered devices</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Online devices</span>
            <Wifi size={18} />
          </div>
          <div className="stat-value">22</div>
          <div className="stat-note">Currently connected</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Warnings</span>
            <Activity size={18} />
          </div>
          <div className="stat-value">02</div>
          <div className="stat-note">Require attention</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Sensor readings</span>
            <Thermometer size={18} />
          </div>
          <div className="stat-value">8,420</div>
          <div className="stat-note">Received today</div>
        </div>
      </section>

      <section className="panel sensors-panel">
        <div className="panel-heading sensor-heading">
          <div>
            <span className="panel-kicker">CONNECTED HARDWARE</span>
            <h2>All devices</h2>
            <p>Current status and latest sensor readings</p>
          </div>

          <button className="select-button">
            All devices
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>DEVICE</th>
                <th>LOCATION</th>
                <th>TYPE</th>
                <th>LAST READING</th>
                <th>STATUS</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {devices.map((device) => (
                <tr key={device.id}>
                  <td>
                    <div className="sensor-name">
                      <div className="sensor-icon">
                        <Thermometer size={16} />
                      </div>
                      <div>
                        <strong>{device.name}</strong>
                        <small>{device.id}</small>
                      </div>
                    </div>
                  </td>

                  <td className="location-cell">{device.location}</td>
                  <td className="location-cell">{device.type}</td>

                  <td className="reading-cell">
                    {device.reading}
                    <span>{device.unit}</span>
                  </td>

                  <td>
                    <span
                      className={`device-status ${device.status.toLowerCase()}`}
                    >
                      <span />
                      {device.status}
                    </span>
                  </td>

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

export default Devices;
