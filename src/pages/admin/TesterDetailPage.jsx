import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Calendar, 
  User, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Eye, 
  IndianRupee,
  FolderKanban,
  History,
  Check,
  X,
  XCircle
} from 'lucide-react';
import StatusBadge from '../../components/portal/StatusBadge';
import EmptyState from '../../components/portal/EmptyState';
import { initialTesters } from '../../data/testerMockData';
import './TesterDetailPage.css';

export default function TesterDetailPage({ 
  tester, 
  onUpdateTester,
  onBack, 
  onOpenProject,
  onNavigate 
}) {
  const [activeTab, setActiveTab] = useState('current');
  const [toastMessage, setToastMessage] = useState(null);
  const t = tester || initialTesters[0];

  if (!t) {
    return (
      <div className="portal-card">
        <EmptyState
          icon={ShieldCheck}
          title="QA Tester Not Found"
          description="The requested QA tester profile could not be found."
          actionLabel="Back to Testers"
          onAction={onBack}
        />
      </div>
    );
  }

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleStatusChange = (newStatus) => {
    let newAvailability = t.availability;
    if (newStatus === 'Deactivated' || newStatus === 'Rejected') {
      newAvailability = 'Inactive';
    } else if (newStatus === 'On Hold') {
      newAvailability = 'On Hold';
    } else if (newStatus === 'Active' || newStatus === 'Approved') {
      newAvailability = (t.activeTestingProjects || 0) > 0 ? 'Busy' : 'Available';
    }

    const updated = {
      ...t,
      status: newStatus,
      availability: newAvailability
    };

    if (onUpdateTester) {
      onUpdateTester(updated);
    }

    if (newStatus === 'Rejected') {
      showToast(`QA Tester "${t.name}" application rejected.`);
    } else {
      showToast(`QA Tester "${t.name}" status updated to "${newStatus}"`);
    }
  };

  return (
    <div className="developer-detail-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="dev-status-toast">
          <CheckCircle size={16} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Nav */}
      <div className="admin-detail-top-nav">
        <button type="button" onClick={onBack} className="btn-back-link">
          <ArrowLeft size={16} />
          <span>Back to Testers</span>
        </button>

        <div className="admin-detail-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Status Switcher Action Buttons */}
          <div className="dev-status-action-group">
            <span className="status-group-label">Status:</span>
            
            {t.status === 'Pending' && (
              <div style={{ display: 'inline-flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleStatusChange('Active')}
                  className="btn btn-orange-primary"
                  style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                >
                  <Check size={14} style={{ marginRight: '4px' }} />
                  <span>Approve Tester</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('Rejected')}
                  className="btn btn-reject-action"
                  style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                  title="Reject QA Tester Application"
                >
                  <XCircle size={14} style={{ marginRight: '4px' }} />
                  <span>Reject</span>
                </button>
              </div>
            )}

            {t.status === 'Active' && (
              <>
                <button
                  type="button"
                  onClick={() => handleStatusChange('On Hold')}
                  className="btn-status-toggle on-hold"
                >
                  ⏸ Put On Hold
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('Deactivated')}
                  className="btn-status-toggle deactivate"
                >
                  🚫 Deactivate
                </button>
              </>
            )}

            {t.status === 'On Hold' && (
              <>
                <button
                  type="button"
                  onClick={() => handleStatusChange('Active')}
                  className="btn-status-toggle active"
                >
                  ● Activate
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('Deactivated')}
                  className="btn-status-toggle deactivate"
                >
                  🚫 Deactivate
                </button>
              </>
            )}

            {(t.status === 'Deactivated' || t.status === 'Rejected') && (
              <button
                type="button"
                onClick={() => handleStatusChange('Active')}
                className="btn-status-toggle active"
              >
                ● Activate Account
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tester Banner Card */}
      <div className="portal-card dev-profile-banner">
        <div className="dev-banner-left">
          <div className="dev-banner-avatar-wrap">
            <img
              src={t.avatar || '/assets/logo-icon.png'}
              alt={t.name}
              className="dev-banner-img"
              style={{
                opacity: (t.status === 'Deactivated' || t.status === 'Rejected') ? 0.6 : 1,
                border: `3px solid ${t.status === 'Active' ? '#10B981' : t.status === 'On Hold' ? '#F59E0B' : t.status === 'Pending' ? '#F3821D' : '#EF4444'}`
              }}
            />
            <span 
              className="dev-online-dot" 
              style={{ 
                backgroundColor: t.status === 'Active' ? '#10B981' : t.status === 'On Hold' ? '#F59E0B' : t.status === 'Pending' ? '#F3821D' : '#EF4444' 
              }} 
            />
          </div>

          <div className="dev-banner-info">
            <div className="dev-name-row">
              <h1 className="dev-full-name" style={{ textDecoration: (t.status === 'Deactivated' || t.status === 'Rejected') ? 'line-through' : 'none' }}>
                {t.name}
              </h1>
              <span className="dev-id-tag">{t.id}</span>
              <StatusBadge status={t.status} size="normal" />
            </div>

            <p className="dev-banner-headline">{t.specialization || 'QA Specialist'} • {t.experience || 'Verified Specialist'}</p>

            <div className="dev-banner-meta">
              <span><Mail size={13} /> {t.email}</span>
              <span>•</span>
              <span><Phone size={13} /> {t.mobile}</span>
              <span>•</span>
              <span><Calendar size={13} /> Registered {t.joiningDate}</span>
              <span>•</span>
              <span>Referrer: <strong>{t.referenceName || 'Direct Onboarding'}</strong></span>
              <span>•</span>
              <span>Referral Code: <strong style={{ color: '#F3821D', fontFamily: 'monospace', background: '#FFF7ED', padding: '2px 7px', borderRadius: '4px', letterSpacing: '0.04em' }}>{t.referralCode || 'DS-TST-201'}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Notice if Pending, On Hold or Deactivated */}
      {t.status === 'Pending' && (
        <div className="dev-status-alert-card on-hold" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
          <Clock size={18} color="#D97706" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <strong>Tester Registration Pending:</strong> Awaiting Admin review & approval. Referrer: <strong>{t.referenceName || 'Direct'}</strong> • Code: <strong style={{ color: '#F3821D', fontFamily: 'monospace', background: '#FFF7ED', padding: '1px 6px', borderRadius: '4px' }}>{t.referralCode || 'DS-TST-201'}</strong>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                type="button" 
                className="btn btn-orange-primary"
                style={{ padding: '4px 14px', fontSize: '0.78rem' }}
                onClick={() => handleStatusChange('Active')}
              >
                <Check size={13} style={{ marginRight: '4px' }} />
                <span>Approve Now</span>
              </button>
              <button 
                type="button" 
                className="btn btn-reject-action"
                style={{ padding: '4px 14px', fontSize: '0.78rem' }}
                onClick={() => handleStatusChange('Rejected')}
              >
                <XCircle size={13} style={{ marginRight: '4px' }} />
                <span>Reject</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {t.status === 'On Hold' && (
        <div className="dev-status-alert-card on-hold">
          <Clock size={18} color="#D97706" />
          <div>
            <strong>Tester is Currently On Hold:</strong> This tester is temporarily unavailable. Active QA workloads can be monitored, but new testing is paused.
          </div>
        </div>
      )}

      {t.status === 'Deactivated' && (
        <div className="dev-status-alert-card deactivated">
          <ShieldCheck size={18} color="#DC2626" />
          <div>
            <strong>Tester Access is Deactivated:</strong> This tester's portal access is suspended. Click "Activate" above to restore access.
          </div>
        </div>
      )}

      {t.status === 'Rejected' && (
        <div className="dev-status-alert-card deactivated">
          <AlertCircle size={18} color="#DC2626" />
          <div>
            <strong>QA Tester Registration Rejected:</strong> This applicant was rejected during verification. Click "Activate Account" above to admit them.
          </div>
        </div>
      )}

      {/* 5 Tester Performance Stats Cards */}
      <div className="dev-perf-grid">
        <div className="portal-card dev-stat-card">
          <span className="stat-label">Total Projects</span>
          <div className="stat-val" style={{ color: '#0A3D75' }}>
            {(t.completedTesting || 0) + (t.activeTestingProjects || 0)}
          </div>
          <span className="stat-sub">Lifetime assigned</span>
        </div>

        <div className="portal-card dev-stat-card">
          <span className="stat-label">Completed Projects</span>
          <div className="stat-val" style={{ color: '#10B981' }}>
            {t.completedTesting || 0}
          </div>
          <span className="stat-sub">Audited & verified</span>
        </div>

        <div className="portal-card dev-stat-card">
          <span className="stat-label">Active Testing Projects</span>
          <div className="stat-val" style={{ color: '#F3821D' }}>
            {t.activeTestingProjects || 0}
          </div>
          <span className="stat-sub">Currently verifying</span>
        </div>

        <div className="portal-card dev-stat-card">
          <span className="stat-label">Total Payouts</span>
          <div className="stat-val" style={{ color: '#0A3D75' }}>
            {t.totalPayouts || '₹0'}
          </div>
          <span className="stat-sub">Settled disbursements</span>
        </div>

        <div className="portal-card dev-stat-card">
          <span className="stat-label">Pending Payouts</span>
          <div className="stat-val" style={{ color: t.pendingPayouts && t.pendingPayouts !== '₹0' ? '#F3821D' : '#64748B' }}>
            {t.pendingPayouts || '₹0'}
          </div>
          <span className="stat-sub">Awaiting QA clearance</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="admin-project-tabs-bar">
        <button
          type="button"
          className={`admin-tab-pill ${activeTab === 'current' ? 'active' : ''}`}
          onClick={() => setActiveTab('current')}
        >
          <FolderKanban size={15} />
          <span>Current Testing Projects ({(t.currentProjects || []).length})</span>
        </button>

        <button
          type="button"
          className={`admin-tab-pill ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={15} />
          <span>Testing History ({(t.testingHistory || []).length})</span>
        </button>
      </div>

      {/* TAB 1: CURRENT TESTING PROJECTS */}
      {activeTab === 'current' && (
        <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="portal-card-header" style={{ padding: '16px 20px' }}>
            <h3 className="portal-card-title">Currently Active QA Projects</h3>
          </div>

          {(t.currentProjects && t.currentProjects.length > 0) ? (
            <div className="portal-table-container">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Developer</th>
                    <th>Testing Progress</th>
                    <th>Payout</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {t.currentProjects.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span className="table-proj-name" onClick={() => onOpenProject(p.id)}>{p.name}</span>
                        <div className="table-proj-id">{p.id}</div>
                      </td>
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <User size={13} color="#0A3D75" />
                          <span style={{ fontWeight: 600 }}>{p.developer}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '70px', height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${p.testingProgress || 0}%`, height: '100%', background: '#F3821D' }} />
                          </div>
                          <span style={{ fontSize: '0.74rem', fontWeight: 700 }}>{p.testingProgress || 0}%</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 800, color: '#0A3D75' }}>{p.payout || '₹3,000'}</td>
                      <td><StatusBadge status={p.status} size="small" /></td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => onOpenProject(p.id)}
                          className="btn btn-navy-action"
                          style={{ padding: '6px 12px', fontSize: '0.76rem' }}
                        >
                          View Project
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
              No active testing projects assigned currently. Tester is available for new assignments.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TESTING HISTORY */}
      {activeTab === 'history' && (
        <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="portal-card-header" style={{ padding: '16px 20px' }}>
            <h3 className="portal-card-title">Testing History & Audit Trail</h3>
          </div>

          {(t.testingHistory && t.testingHistory.length > 0) ? (
            <div className="portal-table-container">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Developer</th>
                    <th>Testing Date</th>
                    <th>Result</th>
                    <th>Payout</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {t.testingHistory.map((h) => (
                    <tr key={h.id}>
                      <td>
                        <strong className="table-proj-name">{h.name}</strong>
                        <div className="table-proj-id">{h.id}</div>
                      </td>
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <User size={13} color="#0A3D75" />
                          <span style={{ fontWeight: 600 }}>{h.developer}</span>
                        </div>
                      </td>
                      <td style={{ color: '#0F172A', fontWeight: 600 }}>{h.testingDate}</td>
                      <td>
                        <span style={{ color: '#10B981', fontWeight: 800 }}>✓ {h.result}</span>
                      </td>
                      <td style={{ fontWeight: 800, color: '#0A3D75' }}>{h.payout || '₹2,500'}</td>
                      <td><StatusBadge status={h.status} size="small" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
              No past testing records logged.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
