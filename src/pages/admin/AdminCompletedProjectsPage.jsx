import React, { useState } from 'react';
import { Search, CheckCircle, Eye, Calendar, IndianRupee, Award, Download, Trash2 } from 'lucide-react';
import StatusBadge from '../../components/portal/StatusBadge';
import EmptyState from '../../components/portal/EmptyState';
import DeleteProjectModal from '../../components/admin/DeleteProjectModal';
import { exportFullProjectArchive } from '../../utils/exportUtils';
import { initialAdminProjects } from '../../data/adminMockData';

export default function AdminCompletedProjectsPage({ 
  projects = initialAdminProjects, 
  onOpenProject,
  onDeleteProject
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [projectToDelete, setProjectToDelete] = useState(null);

  const completedProjects = projects.filter(p => p.status === 'Completed' || (p.adminApproved && (p.developerPaymentRemainingNum === 0 || p.developerRemainingAmount === 0)));

  const filtered = completedProjects.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.developer.toLowerCase().includes(q)
    );
  });

  return (
    <div className="admin-projects-page-container">
      {/* Top Banner */}
      <div className="portal-card" style={{ background: 'linear-gradient(135deg, #07223D 0%, #0A3D75 100%)', color: '#FFFFFF', padding: '24px 28px', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Award size={20} color="#F3821D" />
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FDBA74', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Delivered & Approved Archive
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>
              Completed Projects
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#94A3B8' }}>
              Historical archive of all delivered projects with verified payouts.
            </p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(8px)', padding: '12px 20px', borderRadius: '10px', textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#CBD5E1', textTransform: 'uppercase', fontWeight: 700 }}>Total Completed</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FFFFFF' }}>{completedProjects.length} Projects</div>
          </div>
        </div>
      </div>

      {/* Search Header */}
      <div className="admin-projects-top-bar" style={{ marginTop: '16px' }}>
        <div className="search-input-box" style={{ maxWidth: '380px' }}>
          <Search size={16} className="search-input-icon" />
          <input
            type="text"
            placeholder="Search completed archive..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Completed Table */}
      {filtered.length > 0 ? (
        <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="portal-table-container">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Project ID</th>
                  <th>Project Name</th>
                  <th>Developer</th>
                  <th>Completed Date</th>
                  <th>Freelancer Payout</th>
                  <th>Tester Payout</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span style={{ fontWeight: 800, color: '#0A3D75', fontFamily: 'monospace' }}>{p.id}</span>
                    </td>
                    <td>
                      <span 
                        className="table-proj-name"
                        onClick={() => onOpenProject(p.id)}
                      >
                        {p.name}
                      </span>
                      <span className="table-proj-id">{p.projectType}</span>
                    </td>
                    <td>
                      <strong style={{ color: '#0F172A' }}>{p.developer}</strong>
                    </td>
                    <td style={{ color: '#64748B', whiteSpace: 'nowrap' }}>
                      {p.completedDate || p.deadline}
                    </td>
                    <td style={{ fontWeight: 800, color: '#10B981', whiteSpace: 'nowrap' }}>
                      {p.freelancerPayout || p.developerPayment}
                    </td>
                    <td style={{ fontWeight: 800, color: '#C2410C', whiteSpace: 'nowrap' }}>
                      {p.testerPayment || p.testerPayout || '₹0'}
                    </td>
                    <td>
                      <StatusBadge status="Completed" size="small" />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => onOpenProject(p.id)}
                          className="btn btn-navy-action"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        >
                          <Eye size={13} style={{ marginRight: '4px' }} />
                          View Details
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportFullProjectArchive(p);
                          }}
                          className="btn"
                          style={{
                            padding: '6px 9px',
                            background: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            borderRadius: '6px',
                            color: '#0A3D75',
                            cursor: 'pointer'
                          }}
                          title="Export complete project archive (Excel CSV)"
                        >
                          <Download size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectToDelete(p);
                          }}
                          className="btn"
                          style={{
                            padding: '6px 9px',
                            background: '#FEF2F2',
                            border: '1px solid #FECACA',
                            borderRadius: '6px',
                            color: '#DC2626',
                            cursor: 'pointer'
                          }}
                          title="Delete completed project record"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
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
            icon={CheckCircle}
            title="No completed projects found"
            description="No completed projects match your search query."
            actionLabel="Clear Search"
            onAction={() => setSearchQuery('')}
          />
        </div>
      )}
      <DeleteProjectModal
        isOpen={Boolean(projectToDelete)}
        project={projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={(projectId) => {
          setProjectToDelete(null);
          if (onDeleteProject) {
            onDeleteProject(projectId);
          }
        }}
      />
    </div>
  );
}
