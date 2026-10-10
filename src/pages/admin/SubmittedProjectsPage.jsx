import React, { useState } from 'react';
import { Search, Send, Eye, Calendar, IndianRupee, ArrowRight, ShieldCheck, CheckSquare2 } from 'lucide-react';
import StatusBadge from '../../components/portal/StatusBadge';
import EmptyState from '../../components/portal/EmptyState';
import { initialAdminProjects } from '../../data/adminMockData';

export default function SubmittedProjectsPage({ 
  projects = initialAdminProjects, 
  onNavigate, 
  onOpenProject 
}) {
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filterTabs = ['All', 'Awaiting Tester', 'In Testing', 'Tester Approved', 'Revision Required'];

  const submittedList = projects.filter(p => 
    p.status === 'Submitted' || p.status === 'Under Review' || p.status === 'Completed' || p.status === 'Revision Required' || p.testerFinalized || p.developerSubmitted
  );

  const filtered = submittedList.filter(p => {
    if (selectedFilter === 'Awaiting Tester' && p.testingStatus !== 'Awaiting Testing' && !(p.status === 'Submitted' && p.testingProgress === 0)) return false;
    if (selectedFilter === 'In Testing' && p.testingStatus !== 'In Testing') return false;
    if (selectedFilter === 'Tester Approved' && p.testingStatus !== 'Tester Approved' && p.status !== 'Completed') return false;
    if (selectedFilter === 'Revision Required' && p.status !== 'Revision Required' && p.testingStatus !== 'Changes Requested') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.developer.toLowerCase().includes(q) ||
        (p.tester && p.tester.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="admin-projects-page-container">
      {/* Top Banner */}
      <div className="portal-card" style={{ background: 'linear-gradient(135deg, #07223D 0%, #0A3D75 100%)', color: '#FFFFFF', padding: '24px 28px', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Send size={20} color="#F3821D" />
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FDBA74', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Developer Deliveries & QA Pipeline
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>
              Submitted Projects Hub
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#94A3B8' }}>
              Track developer submissions and supervise assigned QA testers as they inspect verification checklists.
            </p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(8px)', padding: '12px 20px', borderRadius: '10px', textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#CBD5E1', textTransform: 'uppercase', fontWeight: 700 }}>In QA Pipeline</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FFFFFF' }}>
              {submittedList.length} Projects
            </div>
          </div>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="admin-projects-top-bar" style={{ marginTop: '16px' }}>
        <div className="search-input-box" style={{ maxWidth: '380px' }}>
          <Search size={16} className="search-input-icon" />
          <input
            type="text"
            placeholder="Search submitted projects by name, developer, tester..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="projects-filter-tabs">
        {filterTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setSelectedFilter(tab)}
            className={`filter-tab-pill ${selectedFilter === tab ? 'active' : ''}`}
          >
            <span>{tab}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="portal-table-container">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Developer</th>
                  <th>Assigned Tester</th>
                  <th>Submitted Date</th>
                  <th>QA Progress</th>
                  <th>Testing Status</th>
                  <th>Freelancer Payout</th>
                  <th>Tester Payout</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const isTesterApproved = p.testingStatus === 'Tester Approved';
                  const isRevision = p.testingStatus === 'Changes Requested' || p.status === 'Revision Required';
                  const isUnderTesting = p.testingStatus === 'In Testing';

                  return (
                    <tr key={p.id}>
                      <td>
                        <span 
                          className="table-proj-name"
                          onClick={() => onOpenProject(p.id)}
                        >
                          {p.name}
                        </span>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                          <span className="table-proj-id" style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0A3D75' }}>{p.id}</span>
                          <span className="table-proj-id">• {p.projectType}</span>
                        </div>
                      </td>

                      <td>
                        <strong style={{ color: '#0F172A' }}>{p.developer || 'Unassigned'}</strong>
                      </td>

                      <td>
                        <strong style={{ color: '#C2410C' }}>{p.tester || 'Unassigned'}</strong>
                      </td>

                      <td style={{ color: '#64748B', whiteSpace: 'nowrap' }}>
                        {p.submittedDate || p.assignedDate}
                      </td>

                      <td style={{ minWidth: '120px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '60px', height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${p.testingProgress || 0}%`, height: '100%', background: isTesterApproved ? '#10B981' : '#F3821D' }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0A3D75' }}>{p.testingProgress || 0}%</span>
                        </div>
                      </td>

                      <td>
                        <span className={`qa-table-badge ${
                          isTesterApproved ? 'badge-approved' :
                          isRevision ? 'badge-revision' :
                          isUnderTesting ? 'badge-testing' : 'badge-pending'
                        }`}>
                          {p.testingStatus || 'Awaiting Tester'}
                        </span>
                      </td>

                      <td style={{ fontWeight: 800, color: '#0A3D75' }}>
                        {p.freelancerPayout || p.developerPayment}
                      </td>

                      <td style={{ fontWeight: 800, color: '#C2410C', whiteSpace: 'nowrap' }}>
                        {p.testerPayment || p.testerPayout || '₹0'}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => onOpenProject(p.id)}
                          className="btn btn-navy-action"
                          style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                        >
                          <Eye size={13} />
                          <span>Monitor QA</span>
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
            icon={Send}
            title="No submitted projects found"
            description="No projects currently match the selected filter."
            actionLabel="View All Projects"
            onAction={() => setSelectedFilter('All')}
          />
        </div>
      )}
    </div>
  );
}
