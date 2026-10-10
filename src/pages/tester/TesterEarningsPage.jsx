import React, { useState } from 'react';
import { 
  IndianRupee, 
  Clock, 
  CheckCircle2, 
  Search 
} from 'lucide-react';
import StatsCard from '../../components/portal/StatsCard';
import StatusBadge from '../../components/portal/StatusBadge';
import EmptyState from '../../components/portal/EmptyState';
import { 
  getTesterAssignedAmount,
  getTesterRemainingAmount,
  isProjectAdminApproved,
  getTesterEarningsStatus,
  getDeveloperSubmittedDate,
  getTesterTransactionId,
  computeTesterEarningsStats
} from '../../services/testerApiService';
import '../portal/EarningsPage.css';

export default function TesterEarningsPage({ 
  projects = [],
  onOpenProject 
}) {
  const [activeTab, setActiveTab] = useState('All Projects');
  const [searchQuery, setSearchQuery] = useState('');

  // Exactly 3 Tabs in exact required order
  const tabs = ['All Projects', 'Remaining Payment', 'Completed Payment'];

  // Top 3 Statistics Calculations based strictly on Authenticated Tester Assigned Data
  const {
    totalEarnings,
    totalPending,
    totalCompletedChecks
  } = computeTesterEarningsStats(projects);

  // Tab Count Calculations
  const getTabCount = (tabName) => {
    if (tabName === 'All Projects') return projects.length;
    if (tabName === 'Remaining Payment') {
      return projects.filter(p => (isProjectAdminApproved(p) || (p.testerPaidAmount && p.testerPaidAmount > 0)) && getTesterRemainingAmount(p) > 0 && p.testerPaymentStatus !== 'Paid').length;
    }
    if (tabName === 'Completed Payment') {
      return projects.filter(p => p.testerPaymentStatus === 'Paid' || (getTesterRemainingAmount(p) === 0 && (getTesterAssignedAmount(p) > 0 || (p.testerPaidAmount && p.testerPaidAmount > 0)))).length;
    }
    return 0;
  };

  // Filter items by active tab
  const tabFilteredProjects = projects.filter(p => {
    if (activeTab === 'Remaining Payment') {
      return (isProjectAdminApproved(p) || (p.testerPaidAmount && p.testerPaidAmount > 0)) && getTesterRemainingAmount(p) > 0 && p.testerPaymentStatus !== 'Paid';
    }
    if (activeTab === 'Completed Payment') {
      return p.testerPaymentStatus === 'Paid' || (getTesterRemainingAmount(p) === 0 && (getTesterAssignedAmount(p) > 0 || (p.testerPaidAmount && p.testerPaidAmount > 0)));
    }
    return true; // All Projects
  });

  // Filter by search query (Project Name, Project ID, Transaction ID)
  const filteredProjects = tabFilteredProjects.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchName = (p.name || '').toLowerCase().includes(q);
    const matchId = (p.id || '').toLowerCase().includes(q);
    const txnId = getTesterTransactionId(p).toLowerCase();
    const matchTxn = txnId !== '—' && txnId.includes(q);
    return matchName || matchId || matchTxn;
  });

  // Empty state messages per tab
  const getEmptyStateMessage = () => {
    if (searchQuery.trim()) {
      return {
        title: 'No matching records',
        desc: `No QA earnings match "${searchQuery}" under ${activeTab}.`
      };
    }
    if (activeTab === 'Remaining Payment') {
      return {
        title: 'No pending payments',
        desc: 'All your approved QA testing payouts have been fully settled.'
      };
    }
    if (activeTab === 'Completed Payment') {
      return {
        title: 'No completed payments',
        desc: 'No completed payout transactions recorded yet.'
      };
    }
    return {
      title: 'No earning records found',
      desc: 'No QA payment or earning records found for your account.'
    };
  };

  const emptyInfo = getEmptyStateMessage();
  const isCompletedTab = activeTab === 'Completed Payment';

  return (
    <div className="earnings-page-container">
      {/* Exactly 3 Top Statistic Boxes */}
      <div 
        className="earnings-stats-grid"
        style={{ 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '18px'
        }}
      >
        {/* 1. Total Earnings */}
        <StatsCard
          title="Total Earnings"
          value={`₹${totalEarnings.toLocaleString('en-IN')}`}
          icon={IndianRupee}
          subtitle="Total approved QA assignment"
          accentColor="#0A3D75"
        />

        {/* 2. Total Pending Amount */}
        <StatsCard
          title="Total Pending Amount"
          value={`₹${totalPending.toLocaleString('en-IN')}`}
          icon={Clock}
          subtitle="Approved / pending payout balance"
          accentColor="#F3821D"
        />

        {/* 3. Total Completed Checks */}
        <StatsCard
          title="Total Completed Checks"
          value={totalCompletedChecks}
          icon={CheckCircle2}
          subtitle="Projects fully settled"
          accentColor="#10B981"
        />
      </div>

      {/* Exactly 3 Tabs & Search Header above Table */}
      <div className="earnings-filter-header">
        <div className="earnings-pills-row">
          {tabs.map(tab => {
            const count = getTabCount(tab);
            const isActive = activeTab === tab;

            return (
              <button
                key={tab}
                type="button"
                className={`filter-tab-pill ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                <span>{tab}</span>
                <span className="filter-tab-count">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="search-input-box" style={{ maxWidth: '320px' }}>
          <Search size={16} className="search-input-icon" />
          <input
            type="text"
            placeholder="Search by Project, ID or TXN ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Earnings Table Card */}
      {filteredProjects.length > 0 ? (
        <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="portal-table-container">
            <table className="portal-table">
              <thead>
                <tr>
                  {/* Column 1: Project (Name + ID in SAME column) */}
                  <th>Project</th>
                  {/* Column 2: Submitted Date */}
                  <th>Submitted Date</th>
                  {/* Column 3: Deadline */}
                  <th>Deadline</th>
                  {/* Column 4: Status */}
                  <th>Status</th>
                  {/* Column 5: Amount (Shown in All Projects & Remaining Payment, NOT in Completed Payment) */}
                  {!isCompletedTab && <th>Amount</th>}
                  {/* Column 6 / 5: Transaction ID (Right side) */}
                  <th style={{ textAlign: 'right' }}>Transaction ID</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((p) => {
                  const status = getTesterEarningsStatus(p);
                  const submittedDateStr = getDeveloperSubmittedDate(p);
                  const isSubmitted = submittedDateStr !== '—';
                  const assignedAmount = getTesterAssignedAmount(p);
                  const txnId = getTesterTransactionId(p);
                  const hasTxn = txnId && txnId !== '—' && txnId !== 'Pending';

                  return (
                    <tr key={p.id}>
                      {/* Column 1: Project (Name primary, ID secondary underneath in SAME column) */}
                      <td>
                        <span 
                          className="table-proj-name"
                          onClick={() => onOpenProject && onOpenProject(p.id)}
                        >
                          {p.name}
                        </span>
                        <span className="table-proj-id">{p.id}</span>
                      </td>

                      {/* Column 2: Submitted Date */}
                      <td style={{ color: isSubmitted ? '#0A3D75' : '#94A3B8', fontWeight: isSubmitted ? 600 : 400, whiteSpace: 'nowrap' }}>
                        {submittedDateStr}
                      </td>

                      {/* Column 3: Deadline */}
                      <td style={{ color: '#17212B', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {p.deadline || p.completedDate || 'Ongoing'}
                      </td>

                      {/* Column 4: Status (Pending | Under Review | Approved | Completed) */}
                      <td>
                        <StatusBadge status={status} size="small" />
                      </td>

                      {/* Column 5: Amount (Only in All Projects and Remaining Payment) */}
                      {!isCompletedTab && (
                        <td style={{ fontWeight: 800, color: '#0A3D75', whiteSpace: 'nowrap' }}>
                          {`₹${assignedAmount.toLocaleString('en-IN')}`}
                        </td>
                      )}

                      {/* Column 6 / 5: Transaction ID (Right-aligned, never View button) */}
                      <td style={{ textAlign: 'right' }}>
                        {hasTxn ? (
                          <span 
                            style={{ 
                              fontFamily: 'monospace', 
                              fontSize: '0.78rem', 
                              fontWeight: 700, 
                              color: '#0A3D75',
                              backgroundColor: '#E8F2FC',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              border: '1px solid #C7DCF0',
                              whiteSpace: 'nowrap',
                              display: 'inline-block'
                            }}
                          >
                            {txnId}
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8', fontWeight: 500 }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Responsive Mobile Cards View */}
          <div className="projects-mobile-cards" style={{ padding: '16px' }}>
            {filteredProjects.map((p) => {
              const status = getTesterEarningsStatus(p);
              const submittedDateStr = getDeveloperSubmittedDate(p);
              const isSubmitted = submittedDateStr !== '—';
              const assignedAmount = getTesterAssignedAmount(p);
              const txnId = getTesterTransactionId(p);
              const hasTxn = txnId && txnId !== '—' && txnId !== 'Pending';

              return (
                <div key={p.id} className="project-card-mobile">
                  <div className="mobile-card-top">
                    <div>
                      <h3 
                        style={{ fontSize: '1rem', fontWeight: 800, color: '#0A3D75', margin: '0 0 2px 0', cursor: 'pointer' }}
                        onClick={() => onOpenProject && onOpenProject(p.id)}
                      >
                        {p.name}
                      </h3>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>{p.id}</span>
                    </div>
                    <StatusBadge status={status} size="small" />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem', color: '#64748B' }}>
                    <span>Submitted: <strong style={{ color: isSubmitted ? '#0A3D75' : '#94A3B8' }}>{submittedDateStr}</strong></span>
                    <span>Deadline: <strong style={{ color: '#17212B' }}>{p.deadline || p.completedDate || 'Ongoing'}</strong></span>
                  </div>

                  {!isCompletedTab && (
                    <div 
                      style={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#F8FAFC', 
                        padding: '10px 12px', 
                        borderRadius: '8px',
                        fontSize: '0.825rem',
                        margin: '6px 0'
                      }}
                    >
                      <span style={{ color: '#64748B', fontWeight: 600 }}>Amount:</span>
                      <strong style={{ color: '#0A3D75', fontWeight: 800, fontSize: '0.9rem' }}>
                        {`₹${assignedAmount.toLocaleString('en-IN')}`}
                      </strong>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', paddingTop: '4px' }}>
                    <span style={{ color: '#64748B' }}>Transaction ID:</span>
                    {hasTxn ? (
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0A3D75' }}>
                        {txnId}
                      </span>
                    ) : (
                      <span style={{ color: '#94A3B8' }}>—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="portal-card" style={{ padding: '24px 0' }}>
          <EmptyState
            icon={IndianRupee}
            title={emptyInfo.title}
            description={emptyInfo.desc}
            actionLabel={activeTab !== 'All Projects' || searchQuery ? 'View All Projects' : undefined}
            onAction={() => {
              setActiveTab('All Projects');
              setSearchQuery('');
            }}
          />
        </div>
      )}
    </div>
  );
}
