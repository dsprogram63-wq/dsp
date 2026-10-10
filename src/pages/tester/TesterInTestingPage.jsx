import React from 'react';
import { Clock, Play, User, AlertCircle } from 'lucide-react';
import EmptyState from '../../components/portal/EmptyState';

export default function TesterInTestingPage({ 
  projects = [], 
  onOpenProject 
}) {
  const inTestingProjects = projects.filter(p => p.testingStatus === 'In Testing' || (p.testingProgress > 0 && p.testingStatus !== 'Tester Approved'));

  return (
    <div className="admin-projects-page-container">
      {inTestingProjects.length > 0 ? (
        <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="portal-table-container">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Developer</th>
                  <th>Started Testing</th>
                  <th>QA Progress</th>
                  <th>Issues Found</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {inTestingProjects.map((proj) => (
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

                    <td style={{ color: '#64748B', whiteSpace: 'nowrap' }}>
                      {proj.submittedDate || '03 Oct 2026'}
                    </td>

                    <td style={{ minWidth: '130px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div 
                            style={{ 
                              width: `${proj.testingProgress || 65}%`, 
                              height: '100%', 
                              backgroundColor: '#F3821D',
                              borderRadius: '3px' 
                            }} 
                          />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C2410C' }}>
                          {proj.testingProgress || 65}%
                        </span>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#DC2626', fontWeight: 700, fontSize: '0.8rem' }}>
                        <AlertCircle size={13} />
                        <span>{proj.testingIssues?.length || (proj.id === 'DS-APP-2048' ? 2 : 1)} Issues</span>
                      </div>
                    </td>

                    <td>
                      <span className="qa-table-badge badge-testing">
                        In Testing
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button 
                        type="button"
                        className="btn btn-navy-action"
                        style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                        onClick={() => onOpenProject(proj.id)}
                      >
                        <Play size={12} />
                        <span>Continue QA</span>
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
            icon={Clock}
            title="No projects currently in testing"
            description="Check your Testing Queue to pick up pending developer submissions."
          />
        </div>
      )}
    </div>
  );
}
