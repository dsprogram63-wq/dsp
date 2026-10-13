import React from 'react';
import { 
  Check, 
  Clock, 
  Calendar, 
  Sparkles, 
  Layers,
  ArrowUpRight
} from 'lucide-react';
import './DashboardPreview.css';

export default function DashboardPreview() {
  const stats = [
    { label: 'Assigned Projects', value: '12', isAccent: true },
    { label: 'Completed', value: '8' },
    { label: 'In Progress', value: '3' },
    { label: 'Pending Review', value: '1' }
  ];

  const tasks = [
    { title: 'Homepage Layout & Navigation', done: true },
    { title: 'About Page & Brand Story', done: true },
    { title: 'Contact Form & Lead Routing', done: true },
    { title: 'Responsive Mobile Optimization', done: false }
  ];

  return (
    <section id="workspace" className="dashboard-preview-section">
      <div className="container">
        <div className="section-header-row">
          <div>
            <div className="badge-featured">
              <Sparkles size={13} className="badge-icon" />
              <span>Workspace Preview</span>
            </div>
            <h2 className="heading-section">Everything You Need to Manage Your Projects</h2>
            <p style={{ color: '#5F6B76', marginTop: '6px', fontSize: '0.98rem' }}>
              Your freelancer workspace gives you a clear view of assigned projects, requirements, deadlines and progress.
            </p>
          </div>
        </div>

        <div className="preview-document-wrapper">
          {/* Header Bar */}
          <div className="preview-header-bar">
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F3821D', textTransform: 'uppercase' }}>
                WORKSPACE DEMO
              </span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0A3D75' }}>
                Dahej Support Freelancer Workspace
              </h3>
            </div>
            <span className="badge-verified-pill">Active Interface</span>
          </div>

          {/* Stats Bar (Screenshot 2 & 3 stats style) */}
          <div className="preview-stats-bar-grid">
            {stats.map((st, i) => (
              <div key={i} className={`preview-metric-box ${st.isAccent ? 'active-accent' : ''}`}>
                <span className="preview-metric-lbl">{st.label}</span>
                <span className="preview-metric-num">{st.value}</span>
              </div>
            ))}
          </div>

          {/* Inner Grid */}
          <div className="preview-inner-grid">
            {/* Active Project Card */}
            <div className="preview-project-panel">
              <div className="preview-proj-title-row">
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#F3821D', textTransform: 'uppercase' }}>
                    MY PROJECTS
                  </span>
                  <div className="preview-proj-title">Business Website Development</div>
                  <div className="preview-proj-sub">Client: Dahej Support Project</div>
                </div>
                <span className="tag-blue-category">
                  <Clock size={12} />
                  <span>In Progress</span>
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
                  <span style={{ color: '#0A3D75' }}>Project Progress</span>
                  <span style={{ color: '#F3821D' }}>72%</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '72%', height: '100%', backgroundColor: '#F3821D', borderRadius: '4px' }} />
                </div>
              </div>

              {/* Deadline */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#17212B', fontWeight: 600 }}>
                <Calendar size={15} color="#0A3D75" />
                <span>Deadline: <strong>12 Oct 2026</strong></span>
              </div>

              {/* Tasks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0A3D75', textTransform: 'uppercase' }}>
                  Milestone Deliverables
                </span>
                {tasks.map((t, idx) => (
                  <div key={idx} className="preview-task-row">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: t.done ? '#10B981' : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        {t.done && <Check size={11} strokeWidth={3} />}
                      </span>
                      <span>{t.title}</span>
                    </span>
                    <span className={t.done ? 'preview-task-done' : 'preview-task-pending'}>
                      {t.done ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel: Vision & Trust Box (Screenshot 3) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="vision-blue-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#E06500', fontWeight: 800, fontSize: '0.95rem', marginBottom: '8px' }}>
                  <ArrowUpRight size={18} strokeWidth={2.5} />
                  <span>OUR NETWORK VISION</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#2D3748', lineHeight: '1.6', margin: 0 }}>
                  Dahej Support envisions building a <strong>smart, connected and reliable digital execution ecosystem</strong> where verified developers deliver high-standard web platforms for industrial clients.
                </p>
              </div>

              <div className="highlight-peach-box" style={{ fontSize: '0.88rem' }}>
                🔒 <strong>Workspace Access:</strong> Granted upon review and authorization of your reference credentials.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
