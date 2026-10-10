import React from 'react';
import { CheckCircle2, Eye, User, ShieldCheck } from 'lucide-react';
import EmptyState from '../../components/portal/EmptyState';

export default function TesterApprovedProjectsPage({ 
  projects = [], 
  onOpenProject 
}) {
  const approvedProjects = projects.filter(p => 
    p.testingStatus === 'Tester Approved' || 
    p.status === 'Completed'
  );

  return (
    <div className="admin-projects-page-container">
      {approvedProjects.length > 0 ? (
        <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="portal-table-container">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Developer</th>
                  <th>Approved Date</th>
                  <th>QA Turnaround</th>
                  <th>Issues Status</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {approvedProjects.map((proj) => (
                  <tr key={proj.id}>
                    <td>
                      <span 
                        className="table-proj-name"
                        onClick={() => onOpenProject(proj.id)}
                      >
                        {proj.name}
                      </span>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                        <span className="table-proj-id" style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0A3D75' }}>{proj.id}</span>
                        <span className="table-proj-id">• {proj.projectType}</span>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#1E293B', fontWeight: 600, fontSize: '0.84rem' }}>
                        <User size={14} color="#0A3D75" />
                        <span>{proj.developer}</span>
                      </div>
                    </td>

                    <td style={{ color: '#0A3D75', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {proj.approvedDate || proj.completedDate || '01 Sep 2026'}
                    </td>

                    <td style={{ color: '#64748B', whiteSpace: 'nowrap' }}>
                      1.5 Days
                    </td>

                    <td>
                      <span style={{ color: '#16A34A', fontWeight: 700, fontSize: '0.8rem' }}>
                        ✓ All Resolved
                      </span>
                    </td>

                    <td>
                      <span className="qa-table-badge badge-approved">
                        Testing Approved
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button 
                        type="button"
                        className="btn btn-navy-action"
                        style={{ padding: '6px 14px', fontSize: '0.78rem', background: '#DCFCE7', color: '#166534', borderColor: '#86EFAC' }}
                        onClick={() => onOpenProject(proj.id)}
                      >
                        <Eye size={13} />
                        <span>View Workspace</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="portal-card">
          <EmptyState
            icon={CheckCircle2}
            title="No approved projects yet"
            description="Projects that pass all 14 checklist items will be listed here."
          />
        </div>
      )}
    </div>
  );
}
