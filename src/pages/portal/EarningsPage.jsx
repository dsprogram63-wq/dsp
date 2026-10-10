import React, { useState } from 'react';
import { 
  IndianRupee, 
  CheckCircle2, 
  Clock, 
  Wallet, 
  Search, 
  Building2 
} from 'lucide-react';
import StatsCard from '../../components/portal/StatsCard';
import StatusBadge from '../../components/portal/StatusBadge';
import EmptyState from '../../components/portal/EmptyState';
import { initialProjects } from '../../data/mockData';
import { 
  getFreelancerProjectStatus, 
  getDevAmount, 
  getDevPaid, 
  getDevRemaining, 
  isProjectAdminApproved, 
  formatINR 
} from '../../utils/projectStatusUtils';
import './EarningsPage.css';

export default function EarningsPage({ 
  onOpenProject, 
  projects = initialProjects 
}) {
  const [activeTab, setActiveTab] = useState('All Projects');
  const [searchQuery, setSearchQuery] = useState('');

  // Exactly 3 Tabs in specified order: All Projects, Remaining Payment, Completed Payment
  const tabs = ['All Projects', 'Remaining Payment', 'Completed Payment'];

  // Helper for display payment status
  const getDisplayPaymentStatus = (p) => {
    if (p.developerPaymentStatus === 'Paid' || p.payoutStatus === 'Paid') return 'Paid';
    const rem = getDevRemaining(p);
    const paid = getDevPaid(p);
    const amt = getDevAmount(p);
    if (rem === 0 && (paid > 0 || amt > 0)) return 'Paid';
    const isApproved = isProjectAdminApproved(p);
    if (!isApproved && paid === 0) return 'Not Yet Approved';
    if (paid > 0) return 'Remaining';
    return 'Pending';
  };

  // Helper for display transaction ID
  const getDisplayTransactionId = (p) => {
    if (p.developerTransactionId && p.developerTransactionId !== '—' && p.developerTransactionId !== 'Pending') {
      return p.developerTransactionId;
    }
    if (p.developerPaymentTxnId && p.developerPaymentTxnId !== '—') return p.developerPaymentTxnId;
    if (p.devTxnId && p.devTxnId !== '—') return p.devTxnId;
    if (p.transactionId && p.transactionId !== '—') return p.transactionId;
    if (p.ref && p.ref.startsWith('TXN')) return p.ref;
    const paid = getDevPaid(p);
    if (paid > 0 || p.developerPaymentStatus === 'Paid') {
      const numPart = (p.id || '').replace(/[^0-9]/g, '');
      return `TXN-DS-${numPart || '88492019'}`;
    }
    return '—';
  };

  // =========================================================================
  // TOP 3 STATS CALCULATIONS (Strictly scoped to currently logged-in freelancer)
  // =========================================================================

  // 1. Total Earnings: Sum of developer payouts from projects that have been APPROVED or settled
  const totalEarningsAmount = projects
    .filter(p => isProjectAdminApproved(p) || p.developerPaymentStatus === 'Paid' || getDevPaid(p) > 0)
    .reduce((sum, p) => sum + getDevAmount(p), 0);

  // 2. Total Pending Amount: Sum of unpaid developer amounts from Admin Approved projects ONLY
  const totalPendingAmount = projects
    .filter(p => (isProjectAdminApproved(p) || getDevPaid(p) > 0) && getDevRemaining(p) > 0 && p.developerPaymentStatus !== 'Paid')
    .reduce((sum, p) => sum + getDevRemaining(p), 0);

  // 3. Total Completed Projects: Count of projects where developer payment is 100% cleared
  const totalCompletedProjectsCount = projects
    .filter(p => p.developerPaymentStatus === 'Paid' || p.payoutStatus === 'Paid' || (getDevRemaining(p) === 0 && (getDevPaid(p) >= getDevAmount(p) || getDevAmount(p) > 0 || getDevPaid(p) > 0)))
    .length;

  // =========================================================================
  // TAB FILTERING LOGIC
  // =========================================================================
  const tabFilteredProjects = projects.filter(p => {
    const isApproved = isProjectAdminApproved(p);
    const rem = getDevRemaining(p);
    const paid = getDevPaid(p);
    const amt = getDevAmount(p);

    if (activeTab === 'Remaining Payment') {
      // ONLY projects where developer payment is still pending (remaining > 0)
      return (isApproved || paid > 0) && rem > 0 && p.developerPaymentStatus !== 'Paid';
    }
    if (activeTab === 'Completed Payment') {
      // ONLY projects where developer payment is 100% cleared
      return p.developerPaymentStatus === 'Paid' || p.payoutStatus === 'Paid' || (rem === 0 && (paid >= amt || amt > 0 || paid > 0));
    }
    // All Projects: Shows all assigned projects for the logged-in freelancer
    return true;
  });

  // Tab counts calculation
  const getTabCount = (tabName) => {
    if (tabName === 'All Projects') return projects.length;
    if (tabName === 'Remaining Payment') {
      return projects.filter(p => (isProjectAdminApproved(p) || getDevPaid(p) > 0) && getDevRemaining(p) > 0 && p.developerPaymentStatus !== 'Paid').length;
    }
    if (tabName === 'Completed Payment') {
      return projects.filter(p => p.developerPaymentStatus === 'Paid' || p.payoutStatus === 'Paid' || (getDevRemaining(p) === 0 && (getDevPaid(p) >= getDevAmount(p) || getDevAmount(p) > 0 || getDevPaid(p) > 0))).length;
    }
    return 0;
  };

  // Search filter across Project Name, Project ID, and Transaction ID
  const filteredEarnings = tabFilteredProjects.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchName = (p.name || p.projectName || '').toLowerCase().includes(q);
    const matchProjId = (p.id || p.projectId || '').toLowerCase().includes(q);
    const txn = getDisplayTransactionId(p).toLowerCase();
    const matchTxn = txn !== '—' && txn.includes(q);
    return matchName || matchProjId || matchTxn;
  });

  // Empty state messages per tab
  const getEmptyStateMessage = () => {
    if (searchQuery.trim()) {
      return {
        title: 'No matching records',
        desc: `No earning records match "${searchQuery}" under ${activeTab}.`
      };
    }
    if (activeTab === 'Remaining Payment') {
      return {
        title: 'No pending payments',
        desc: 'You have no approved projects with pending payments.'
      };
    }
    if (activeTab === 'Completed Payment') {
      return {
        title: 'No completed payments',
        desc: 'No completed payout transactions recorded yet.'
      };
    }
    return {
      title: 'No earning records',
      desc: 'No project earnings found for your account.'
    };
  };

  const emptyInfo = getEmptyStateMessage();

  return (
    <div className="earnings-page-container">
      {/* Exactly 3 Top Statistics Cards */}
      <div className="earnings-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {/* 1. Total Earnings */}
        <StatsCard
          title="Total Earnings"
          value={formatINR(totalEarningsAmount)}
          icon={IndianRupee}
          subtitle="Approved developer payouts"
          accentColor="#0A3D75"
        />

        {/* 2. Total Pending Amount */}
        <StatsCard
          title="Total Pending Amount"
          value={formatINR(totalPendingAmount)}
          icon={Clock}
          subtitle="Approved unpaid balance"
          accentColor="#F3821D"
        />

        {/* 3. Total Completed Projects */}
        <StatsCard
          title="Total Completed Projects"
          value={totalCompletedProjectsCount}
          icon={CheckCircle2}
          subtitle="100% paid & settled projects"
          accentColor="#10B981"
        />
      </div>

      {/* Direct Bank Account Notice Banner */}
      <div className="bank-account-banner">
        <div className="bank-banner-icon">
          <Building2 size={24} color="#0A3D75" />
        </div>
        <div className="bank-banner-text">
          <h4 className="bank-banner-title">Direct Bank Transfer (IMPS / NEFT)</h4>
          <p className="bank-banner-desc">
            Approved earnings are directly transferred to your registered bank account on the scheduled payout cycle. No processing fee.
          </p>
        </div>
        <div className="bank-account-chip">
          <span className="account-chip-label">Linked Account:</span>
          <span className="account-chip-val">HDFC Bank •••• 4892</span>
        </div>
      </div>

      {/* Exactly 3 Tabs & Search Header */}
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
            placeholder="Search by Project or Txn ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Earnings Table */}
      {filteredEarnings.length > 0 ? (
        <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="portal-table-container">
            <table className="portal-table">
              <thead>
                <tr>
                  {/* Column 1: Project (Name + ID) */}
                  <th>Project</th>

                  {/* Column 2: Completed Date (Shown for All Projects and Completed Payment, Omitted for Remaining Payment) */}
                  {activeTab !== 'Remaining Payment' && (
                    <th>Completed Date</th>
                  )}

                  {/* Column 3: Amount */}
                  <th>Amount</th>

                  {/* Column 4: Status */}
                  <th>Status</th>

                  {/* Column 5: Remaining */}
                  <th>Remaining</th>

                  {/* Column 6: Transaction ID */}
                  <th>Transaction ID</th>
                </tr>
              </thead>
              <tbody>
                {filteredEarnings.map((p) => {
                  const isApproved = isProjectAdminApproved(p);
                  const devAmt = getDevAmount(p);
                  const devPaid = getDevPaid(p);
                  const remVal = getDevRemaining(p);
                  const displayStatus = getDisplayPaymentStatus(p);
                  const txnId = getDisplayTransactionId(p);
                  const completedDate = p.completedDate || (p.status === 'Completed' ? p.deadline : null);

                  return (
                    <tr key={p.id}>
                      {/* Column 1: Project (Name + ID in SAME column) */}
                      <td>
                        <span 
                          className="table-proj-name"
                          onClick={() => onOpenProject && onOpenProject(p.id)}
                        >
                          {p.name || p.projectName}
                        </span>
                        <span className="table-proj-id">{p.id || p.projectId}</span>
                      </td>

                      {/* Column 2: Completed Date */}
                      {activeTab !== 'Remaining Payment' && (
                        <td style={{ color: completedDate ? '#475569' : '#94A3B8', whiteSpace: 'nowrap' }}>
                          {completedDate || '—'}
                        </td>
                      )}

                      {/* Column 3: Amount (Developer Payout Assigned Amount Only) */}
                      <td style={{ fontWeight: 800, color: '#111827', whiteSpace: 'nowrap' }}>
                        {formatINR(devAmt)}
                      </td>

                      {/* Column 4: Status */}
                      <td>
                        <StatusBadge status={displayStatus} size="small" />
                      </td>

                      {/* Column 5: Remaining */}
                      <td style={{ fontWeight: 700, color: isApproved ? (remVal > 0 ? '#F3821D' : '#10B981') : '#94A3B8', whiteSpace: 'nowrap' }}>
                        {isApproved ? formatINR(remVal) : '—'}
                      </td>

                      {/* Column 6: Transaction ID */}
                      <td>
                        {txnId !== '—' ? (
                          <span className="invoice-id-tag">
                            {txnId}
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8', fontWeight: 600 }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Cards */}
          <div className="projects-mobile-cards" style={{ padding: '16px' }}>
            {filteredEarnings.map((p) => {
              const isApproved = isProjectAdminApproved(p);
              const devAmt = getDevAmount(p);
              const remVal = getDevRemaining(p);
              const displayStatus = getDisplayPaymentStatus(p);
              const txnId = getDisplayTransactionId(p);
              const completedDate = p.completedDate || (p.status === 'Completed' ? p.deadline : null);

              return (
                <div key={p.id} className="project-card-mobile">
                  <div className="mobile-card-top">
                    <div>
                      <h3 
                        style={{ fontSize: '1rem', fontWeight: 800, color: '#0A3D75', margin: '0 0 2px 0', cursor: 'pointer' }}
                        onClick={() => onOpenProject && onOpenProject(p.id)}
                      >
                        {p.name || p.projectName}
                      </h3>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>{p.id || p.projectId}</span>
                    </div>
                    <StatusBadge status={displayStatus} size="small" />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <span style={{ color: '#64748B' }}>Amount:</span>
                    <strong style={{ color: '#111827' }}>{formatINR(devAmt)}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <span style={{ color: '#64748B' }}>Remaining:</span>
                    <strong style={{ color: isApproved ? (remVal > 0 ? '#F3821D' : '#10B981') : '#94A3B8' }}>
                      {isApproved ? formatINR(remVal) : '—'}
                    </strong>
                  </div>

                  {activeTab !== 'Remaining Payment' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem' }}>
                      <span style={{ color: '#64748B' }}>Completed Date:</span>
                      <span style={{ color: '#334155' }}>{completedDate || '—'}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem' }}>
                    <span style={{ color: '#64748B' }}>Transaction ID:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0A3D75' }}>
                      {txnId}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="portal-card">
          <EmptyState
            icon={Wallet}
            title={emptyInfo.title}
            description={emptyInfo.desc}
            actionLabel={searchQuery ? 'Clear Search' : undefined}
            onAction={searchQuery ? () => setSearchQuery('') : undefined}
          />
        </div>
      )}
    </div>
  );
}
