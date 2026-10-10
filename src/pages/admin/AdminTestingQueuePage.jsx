import React, { useState } from 'react';
import { 
  CheckSquare2, 
  Search, 
  User, 
  ShieldCheck, 
  Eye, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  AlertOctagon,
  ArrowRight
} from 'lucide-react';
import './AdminTestingQueuePage.css';

export default function AdminTestingQueuePage({ 
  projects = [], 
  onOpenProject,
  onNavigate 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');

  const filtered = projects.filter(p => {
    const matchSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.developer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tester?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;
    if (filter === 'Awaiting Tester') return p.testingStatus === 'Awaiting Testing' || (p.status === 'Submitted' && p.testingProgress === 0);
    if (filter === 'In Testing') return p.testingStatus === 'In Testing';
    if (filter === 'Changes Requested') return p.testingStatus === 'Changes Requested' || p.status === 'Revision Required';
    if (filter === 'Tester Approved') return p.testingStatus === 'Tester Approved' || p.status === 'Completed';
    return true;
  });

  return (
    <div className="admin-testing-queue-page">
      {/* Top QA Summary Cards for Admin */}
      <div className="admin-qa-metrics-bar">
        <div className="admin-qa-stat">
          <span className="stat-lbl">PROJECTS IN QA PIPELINE</span>
          <strong className="stat-num text-navy">
            {projects.filter(p => p.testingStatus !== 'Tester Approved' && p.status !== 'Completed').length}
          </strong>
          <span className="stat-sub">Active testing lifecycle</span>
        </div>

        <div className="admin-qa-stat">
          <span className="stat-lbl">AWAITING INITIAL QA</span>
          <strong className="stat-num text-amber">
            {projects.filter(p => p.testingStatus === 'Awaiting Testing' || (p.status === 'Submitted' && p.testingProgress === 0)).length}
          </strong>
          <span className="stat-sub">Waiting for tester action</span>
        </div>

        <div className="admin-qa-stat">
          <span className="stat-lbl">UNDER ACTIVE TESTING</span>
          <strong className="stat-num text-blue">
            {projects.filter(p => p.testingStatus === 'In Testing').length}
          </strong>
          <span className="stat-sub">Checklist verification</span>
        </div>

        <div className="admin-qa-stat">
          <span className="stat-lbl">TESTER APPROVED</span>
          <strong className="stat-num text-green">
            {projects.filter(p => p.testingStatus === 'Tester Approved' || p.status === 'Completed').length}
          </strong>
          <span className="stat-sub">Ready for final settlement</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="dashboard-section-card">
        <div className="section-card-header">
          <div>
            <h2 className="section-title">Operations QA & Testing Queue ({filtered.length})</h2>
            <p className="section-sub">
              Monitor testing progress across assigned developers and testers. Admin supervises workflow without overriding tester decisions.
            </p>
          </div>

          <div className="tester-header-search" style={{ width: '280px' }}>
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by project, developer, tester..." 
              className="tester-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="workspace-tabs-bar" style={{ marginBottom: '1.25rem' }}>
          {['All', 'Awaiting Tester', 'In Testing', 'Changes Requested', 'Tester Approved'].map(tab => (
            <button
              key={tab}
              className={`workspace-tab-btn ${filter === tab ? 'active' : ''}`}
              onClick={() => setFilter(tab)}
            >
              <span>{tab}</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="tester-table-wrap">
          <table className="tester-table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Developer</th>
                <th>Assigned Tester</th>
                <th>Dev Progress</th>
                <th>QA Progress</th>
                <th>Issues</th>
                <th>Submitted Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((proj) => {
                const isUnderTesting = proj.testingStatus === 'In Testing';
                const isChangesReq = proj.testingStatus === 'Changes Requested' || proj.status === 'Revision Required';
                const isApproved = proj.testingStatus === 'Tester Approved';

                return (
                  <tr key={proj.id} className="tester-table-row">
                    <td className="proj-cell">
                      <strong 
                        className="proj-name-link"
                        onClick={() => onOpenProject(proj.id)}
                      >
                        {proj.name}
                      </strong>
                      <span className="proj-id-badge">{proj.id}</span>
                    </td>

                    <td className="dev-cell">
                      <div className="dev-info-pill">
                        <User size={13} className="dev-icon" />
                        <span>{proj.developer || 'Unassigned'}</span>
                      </div>
                    </td>

                    <td className="dev-cell">
                      <div className="dev-info-pill">
                        <ShieldCheck size={13} className="text-orange" />
                        <strong>{proj.tester || 'Unassigned'}</strong>
                      </div>
                    </td>

                    <td className="progress-cell">
                      <span style={{ fontWeight: 700, color: '#0a3d75' }}>
                        {proj.developerProgress || proj.progress || 100}%
                      </span>
                    </td>

                    <td className="progress-cell">
                      <div className="progress-mini-wrap">
                        <div className="progress-text-row">
                          <span className="text-orange">{proj.testingProgress || (isUnderTesting ? 65 : 0)}%</span>
                        </div>
                        <div className="mini-progress-bar">
                          <div 
                            className="mini-bar-fill" 
                            style={{ width: `${proj.testingProgress || (isUnderTesting ? 65 : 10)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: isChangesReq ? '#dc2626' : '#64748b', fontWeight: 600, fontSize: '0.8rem' }}>
                        <AlertCircle size={13} />
                        <span>{proj.testingIssues?.length || (isChangesReq ? 1 : 0)} Open</span>
                      </div>
                    </td>

                    <td className="date-cell">{proj.submittedDate || '02 Oct 2026'}</td>

                    <td className="status-cell">
                      <span className={`qa-table-badge ${
                        isApproved ? 'badge-approved' :
                        isChangesReq ? 'badge-revision' :
                        isUnderTesting ? 'badge-testing' : 'badge-pending'
                      }`}>
                        {proj.testingStatus || 'Awaiting Tester'}
                      </span>
                    </td>

                    <td className="action-cell" style={{ textAlign: 'right' }}>
                      <button 
                        className="btn-start-testing"
                        onClick={() => onOpenProject(proj.id)}
                      >
                        <Eye size={13} />
                        <span>Monitor Project</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
