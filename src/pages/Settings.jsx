
import { User, Bell, Shield, Building2, Save } from "lucide-react";

function Settings() {
  return (
    <div className="page-content">
      <section className="page-heading">
        <div>
          <div className="eyebrow">WORKSPACE CONFIGURATION</div>
          <h1>Settings</h1>
          <p>Manage your workspace preferences and account information.</p>
        </div>
      </section>

      <section className="panel sensors-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">GENERAL</span>
            <h2>Workspace settings</h2>
            <p>Basic information about your workspace</p>
          </div>
          <Building2 size={20} />
        </div>

        <div className="workflow-list">
          <div className="workflow-item">
            <div className="workflow-icon"><Building2 size={17} /></div>
            <div className="workflow-info">
              <strong>Workspace name</strong>
              <small>Acme Industries</small>
            </div>
          </div>

          <div className="workflow-item">
            <div className="workflow-icon"><User size={17} /></div>
            <div className="workflow-info">
              <strong>Account</strong>
              <small>Mohammed Zaid · Frontend Developer</small>
            </div>
          </div>

          <div className="workflow-item">
            <div className="workflow-icon"><Bell size={17} /></div>
            <div className="workflow-info">
              <strong>Notifications</strong>
              <small>Manage system notification preferences</small>
            </div>
          </div>

          <div className="workflow-item">
            <div className="workflow-icon"><Shield size={17} /></div>
            <div className="workflow-info">
              <strong>Security</strong>
              <small>Account security and access preferences</small>
            </div>
          </div>
        </div>

        <div style={{ padding: "20px 0 0" }}>
          <button className="primary-button" disabled>
            <Save size={16} />
            Save settings
          </button>
        </div>
      </section>
    </div>
  );
}

export default Settings;
