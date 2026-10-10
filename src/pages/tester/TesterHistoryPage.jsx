import React from 'react';
import { History, CheckCircle2, AlertOctagon, User, Eye } from 'lucide-react';

export default function TesterHistoryPage({ 
  projects = [], 
  onOpenProject 
}) {
  const historyRecords = [
    { id: 'DS-LND-3012', name: 'Industrial GIDC Landing Page', developer: 'Rahul Patel', submitted: '28 Aug 2026', testDate: '01 Sep 2026', result: 'Approved', issues: '0 Open', status: 'Completed' },
    { id: 'DS-WEB-0982', name: 'Machinery Spare Parts Website', developer: 'Rahul Patel', submitted: '18 Aug 2026', testDate: '20 Aug 2026', result: 'Approved', issues: '0 Open', status: 'Completed' },
    { id: 'DS-REV-4096', name: 'Industrial Chemical Portal', developer: 'Rahul Patel', submitted: '01 Oct 2026', testDate: '01 Oct 2026', result: 'Changes Requested', issues: '3 Defects', status: 'In Revision' },
    { id: 'DS-APP-1090', name: 'Logistics Driver Tracking App', developer: 'Rahul Patel', submitted: '12 Jul 2026', testDate: '15 Jul 2026', result: 'Approved', issues: '0 Open', status: 'Completed' },
    { id: 'DS-WEB-0741', name: 'Petrochemical Industry Landing', developer: 'Amit Shah', submitted: '10 Aug 2026', testDate: '12 Aug 2026', result: 'Approved', issues: '0 Open', status: 'Completed' },
    { id: 'DS-WEB-0620', name: 'Engineering Tools B2B Website', developer: 'Amit Shah', submitted: '26 Jun 2026', testDate: '28 Jun 2026', result: 'Approved', issues: '0 Open', status: 'Completed' }
  ];

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
                      {rec.result === 'Approved' ? '✓ Approved' : '⚠ Changes Requested'}
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
