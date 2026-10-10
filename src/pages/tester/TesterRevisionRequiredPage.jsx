import React from 'react';
import { AlertOctagon, RefreshCw, User, AlertCircle, FileText, ArrowRight } from 'lucide-react';
import EmptyState from '../../components/portal/EmptyState';

export default function TesterRevisionRequiredPage({ 
  projects = [], 
  onOpenProject 
}) {
  const revisionProjects = projects.filter(p => 
    p.status === 'Revision Required' || 
    p.status === 'Changes Requested' ||
    p.testingStatus === 'Changes Requested' ||
    p.adminRejected === true
  );

  return (
    <div className="admin-projects-page-container">
      {revisionProjects.length > 0 ? (
        <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="portal-table-container">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Developer</th>
                  <th style={{ minWidth: '220px' }}>Admin Feedback & Required Changes</th>
                  <th>Target Milestone</th>
                  <th>Requested Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {revisionProjects.map((proj) => {
                  const feedbackText = proj.adminRejectionComment || proj.adminFeedback || proj.revisionReason || 'Corrections requested';
                  const targetTask = proj.revisionTask || 'General Project Scope';
                  const reqDate = proj.adminRejectedAt 
                    ? new Date(proj.adminRejectedAt).toLocaleDateString('en-GB') 
                    : (proj.submittedDate || 'Recent');

                  return (
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
                          <span className="table-proj-id">• {proj.projectType || 'Project'}</span>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#1E293B', fontWeight: 600, fontSize: '0.84rem' }}>
                          <User size={14} color="#0A3D75" />
                          <span>{proj.developer}</span>
                        </div>
                      </td>

                      <td>
                        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', padding: '6px 10px', fontSize: '0.82rem', color: '#7F1D1D' }}>
                          <div style={{ fontWeight: 700, color: '#991B1B', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                            <AlertOctagon size={12} color="#DC2626" />
                            <span>Admin Requested Fixes:</span>
                          </div>
                          <p style={{ margin: 0, lineHeight: 1.4, whiteSpace: 'pre-wrap', maxHeight: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {feedbackText}
                          </p>
                          {proj.adminRejectionDocument && (
                            <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#DC2626', fontWeight: 700 }}>
                              <FileText size={11} />
                              <span>{typeof proj.adminRejectionDocument === 'string' ? proj.adminRejectionDocument : (proj.adminRejectionDocument.name || 'Guideline Doc Attached')}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0A3D75', background: '#F1F5F9', padding: '3px 8px', borderRadius: '4px' }}>
                          {targetTask}
                        </span>
                      </td>

                      <td style={{ color: '#64748B', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                        {reqDate}
                      </td>

                      <td>
                        <span className="qa-table-badge badge-revision">
                          Changes Requested
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button 
                          type="button"
                          className="btn btn-navy-action"
                          style={{ padding: '6px 14px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                          onClick={() => onOpenProject(proj.id)}
                        >
                          <RefreshCw size={12} />
                          <span>Review Workspace</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="portal-card">
          <EmptyState
            icon={AlertOctagon}
            title="No projects requiring revision"
            description="All active projects are either progressing smoothly or have passed QA verification."
          />
        </div>
      )}
    </div>
  );
}
