import React from 'react';
import { History, User, Eye } from 'lucide-react';
import EmptyState from '../../components/portal/EmptyState';
import { getTesterDashboardStatus } from '../../services/testerApiService';

export default function TesterHistoryPage({ 
  projects = [], 
  onOpenProject 
}) {
  const historyRecords = projects.map(p => {
    const status = getTesterDashboardStatus(p);
    return {
      id: p.id,
      name: p.name,
      developer: p.developer || p.developerName || 'Unassigned',
      submitted: p.submittedDate || p.submissionDate || p.assignedDate || '—',
      testDate: p.testDate || p.testingDate || '—',
      result: status === 'Approved' || status === 'Completed' ? 'Approved' : (status === 'Revision Required' ? 'Changes Requested' : status),
      issues: p.issuesFlagged !== undefined ? `${p.issuesFlagged} Defects` : '0 Open',
      status: status
    };
  });

  if (historyRecords.length === 0) {
    return (
      <div className="admin-projects-page-container">
        <div className="portal-card">
          <EmptyState
            icon={History}
            title="No QA Testing History"
            description="Projects audited and tested by your QA account will appear in this history log."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-projects-page-container">
      <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="portal-table-container">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Developer</th>
                <th>Submitted Date</th>
                <th>Testing Date</th>
                <th>Result</th>
                <th>Defects Flagged</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {historyRecords.map((rec) => (
                <tr key={rec.id}>
                  <td>
                    <span 
                      className="table-proj-name"
                      onClick={() => onOpenProject(rec.id)}
                    >
                      {rec.name}
                    </span>
                    <span className="table-proj-id" style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0A3D75', display: 'block', marginTop: '2px' }}>{rec.id}</span>
                  </td>

                  <td>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#1E293B', fontWeight: 600, fontSize: '0.84rem' }}>
                      <User size={14} color="#0A3D75" />
                      <span>{rec.developer}</span>
                    </div>
                  </td>

                  <td style={{ color: '#64748B', whiteSpace: 'nowrap' }}>{rec.submitted}</td>
                  <td style={{ color: '#0A3D75', fontWeight: 700, whiteSpace: 'nowrap' }}>{rec.testDate}</td>

                  <td>
                    <span className={`qa-table-badge ${rec.result === 'Approved' ? 'badge-approved' : 'badge-revision'}`}>
                      {rec.result === 'Approved' ? '✓ Approved' : rec.result}
                    </span>
                  </td>

                  <td>
                    <span style={{ fontSize: '0.8rem', color: rec.result === 'Approved' ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
                      {rec.issues}
                    </span>
                  </td>

                  <td>
                    <span className="qa-table-badge badge-testing">{rec.status}</span>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <button 
                      type="button"
                      className="btn btn-navy-action"
                      style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                      onClick={() => onOpenProject(rec.id)}
                    >
                      <Eye size={13} />
                      <span>Audit Log</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
