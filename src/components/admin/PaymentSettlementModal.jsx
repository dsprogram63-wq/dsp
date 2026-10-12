import React, { useState, useEffect } from 'react';
import { 
  X, 
  IndianRupee, 
  CheckCircle2, 
  Clock, 
  Users, 
  ShieldCheck, 
  Building2, 
  ArrowRight, 
  Sparkles,
  Check,
  AlertCircle,
  Hash,
  CreditCard,
  Calendar
} from 'lucide-react';
import './PaymentSettlementModal.css';

// Sanitize transaction IDs so placeholders like '-' or '—' are treated as empty
export const sanitizeTxnId = (val) => {
  if (!val || typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (
    trimmed === '' ||
    trimmed === '-' ||
    trimmed === '—' ||
    trimmed === '--' ||
    trimmed.toLowerCase() === 'pending' ||
    trimmed.toLowerCase() === 'n/a' ||
    trimmed.toLowerCase() === 'none'
  ) {
    return '';
  }
  return trimmed;
};

// Check if a transaction ID is valid (must be non-empty, non-dash, at least 3 chars)
export const isValidTxnId = (val) => {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (
    trimmed === '' ||
    trimmed === '-' ||
    trimmed === '—' ||
    trimmed === '--' ||
    trimmed.toLowerCase() === 'pending' ||
    trimmed.toLowerCase() === 'n/a' ||
    trimmed.toLowerCase() === 'none'
  ) {
    return false;
  }
  return trimmed.length >= 3;
};

export default function PaymentSettlementModal({ 
  isOpen, 
  project, 
  onClose, 
  onUpdatePayment 
}) {
  if (!isOpen || !project) return null;

  // 1. Client Payment Numbers
  const totalClientPriceNum = project.totalClientPriceNum || project.totalAmountNum || 0;
  const initialCollectedNum = project.collectedClientAmountNum !== undefined 
    ? project.collectedClientAmountNum 
    : (project.paidAmountNum || 0);

  // 2. Developer Payment Numbers
  const developerPaymentNum = project.developerPaymentNum || project.freelancerPayoutNum || 0;
  const initialDevPaidNum = project.developerPaymentPaidNum || (project.developerPaymentStatus === 'Paid' ? developerPaymentNum : 0);

  // 3. Tester Payment Numbers
  const testerPaymentNum = project.testerPaymentNum || 0;
  const initialTesterPaidNum = project.testerPaymentPaidNum || (project.testerPaymentStatus === 'Paid' ? testerPaymentNum : 0);

  // Form Inputs State
  const [collectedInput, setCollectedInput] = useState(initialCollectedNum.toString());
  const [devPaidInput, setDevPaidInput] = useState(initialDevPaidNum.toString());
  const [testerPaidInput, setTesterPaidInput] = useState(initialTesterPaidNum.toString());

  // Transaction ID & Payment Details State
  const [clientTxnId, setClientTxnId] = useState('');
  const [clientPaymentMode, setClientPaymentMode] = useState('Bank Transfer');
  const [clientPaymentDate, setClientPaymentDate] = useState('');

  const [devTxnId, setDevTxnId] = useState('');
  const [devPaymentMode, setDevPaymentMode] = useState('UPI Transfer');
  const [devPaymentDate, setDevPaymentDate] = useState('');

  const [testerTxnId, setTesterTxnId] = useState('');
  const [testerPaymentMode, setTesterPaymentMode] = useState('UPI Transfer');
  const [testerPaymentDate, setTesterPaymentDate] = useState('');

  // Form Validation Errors State
  const [validationErrors, setValidationErrors] = useState({});

  // Reset when project changes
  useEffect(() => {
    if (project) {
      setCollectedInput((project.collectedClientAmountNum !== undefined ? project.collectedClientAmountNum : (project.paidAmountNum || 0)).toString());
      setDevPaidInput((project.developerPaymentPaidNum || (project.developerPaymentStatus === 'Paid' ? (project.developerPaymentNum || 0) : 0)).toString());
      setTesterPaidInput((project.testerPaymentPaidNum || (project.testerPaymentStatus === 'Paid' ? (project.testerPaymentNum || 0) : 0)).toString());
      setValidationErrors({});

      const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      // Clean existing transaction IDs to ensure '-' or '—' are not pre-filled
      const existingClientTxn = sanitizeTxnId(project.clientTransactionId || project.clientTxnId);
      setClientTxnId(existingClientTxn);
      setClientPaymentMode(project.clientPaymentMode || 'Bank Transfer');
      setClientPaymentDate(project.clientPaymentDate || today);

      const existingDevTxn = sanitizeTxnId(project.developerTransactionId || project.developerPaymentTxnId || project.devTxnId || project.transactionId || project.payoutTransactionId);
      setDevTxnId(existingDevTxn);
      setDevPaymentMode(project.developerPaymentMode || 'UPI Transfer');
      setDevPaymentDate(project.developerPaymentDate || today);

      const existingTesterTxn = sanitizeTxnId(project.testerTransactionId || project.testerPaymentTxnId || project.testerTxnId);
      setTesterTxnId(existingTesterTxn);
      setTesterPaymentMode(project.testerPaymentMode || 'UPI Transfer');
      setTesterPaymentDate(project.testerPaymentDate || today);
    }
  }, [project]);

  // Live Calculations
  const currCollectedNum = Math.min(totalClientPriceNum, Math.max(0, Number(collectedInput || 0)));
  const clientRemaining = Math.max(0, totalClientPriceNum - currCollectedNum);

  const currDevPaidNum = Math.min(developerPaymentNum, Math.max(0, Number(devPaidInput || 0)));
  const devRemaining = Math.max(0, developerPaymentNum - currDevPaidNum);

  const currTesterPaidNum = Math.min(testerPaymentNum, Math.max(0, Number(testerPaidInput || 0)));
  const testerRemaining = Math.max(0, testerPaymentNum - currTesterPaidNum);

  const totalRemainingSum = clientRemaining + devRemaining + testerRemaining;

  // Quick Action Handlers
  const handleCollectFullClient = () => {
    setCollectedInput(totalClientPriceNum.toString());
    if (!isValidTxnId(clientTxnId)) {
      const numId = (project.id || '').replace(/[^0-9]/g, '') || '101';
      setClientTxnId(`TXN-CLI-${numId}${Math.floor(1000 + Math.random() * 9000)}`);
    }
    if (validationErrors.clientTxnId) {
      setValidationErrors(prev => ({ ...prev, clientTxnId: undefined }));
    }
  };

  const handlePayFullDeveloper = () => {
    setDevPaidInput(developerPaymentNum.toString());
    if (!isValidTxnId(devTxnId)) {
      const numId = (project.id || '').replace(/[^0-9]/g, '') || '101';
      setDevTxnId(`TXN-DEV-${numId}${Math.floor(1000 + Math.random() * 9000)}`);
    }
    if (validationErrors.devTxnId) {
      setValidationErrors(prev => ({ ...prev, devTxnId: undefined }));
    }
  };

  const handlePayFullTester = () => {
    setTesterPaidInput(testerPaymentNum.toString());
    if (!isValidTxnId(testerTxnId)) {
      const numId = (project.id || '').replace(/[^0-9]/g, '') || '101';
      setTesterTxnId(`TXN-TST-${numId}${Math.floor(1000 + Math.random() * 9000)}`);
    }
    if (validationErrors.testerTxnId) {
      setValidationErrors(prev => ({ ...prev, testerTxnId: undefined }));
    }
  };

  const handleSettleAllInFull = () => {
    const numId = (project.id || '').replace(/[^0-9]/g, '') || '101';
    setCollectedInput(totalClientPriceNum.toString());
    if (!isValidTxnId(clientTxnId)) setClientTxnId(`TXN-CLI-${numId}${Math.floor(1000 + Math.random() * 9000)}`);

    setDevPaidInput(developerPaymentNum.toString());
    if (!isValidTxnId(devTxnId)) setDevTxnId(`TXN-DEV-${numId}${Math.floor(1000 + Math.random() * 9000)}`);

    setTesterPaidInput(testerPaymentNum.toString());
    if (!isValidTxnId(testerTxnId)) setTesterTxnId(`TXN-TST-${numId}${Math.floor(1000 + Math.random() * 9000)}`);

    setValidationErrors({});
  };

  // Submit Handler with Compulsory Transaction ID Validation
  const handleFormSubmit = (e) => {
    e.preventDefault();

    const errors = {};

    // 1. Transaction ID is compulsory when Client Payment is collected/settled (> 0)
    if (currCollectedNum > 0 && !isValidTxnId(clientTxnId)) {
      errors.clientTxnId = 'Transaction ID / UTR No. is compulsory when collecting client payment.';
    }

    // 2. Transaction ID is compulsory when Developer Payment is disbursed/settled (> 0)
    if (currDevPaidNum > 0 && !isValidTxnId(devTxnId)) {
      errors.devTxnId = 'Developer Transaction ID / UTR No. is compulsory when disbursing developer payment.';
    }

    // 3. Transaction ID is compulsory when Tester Payment is disbursed/settled (> 0)
    if (currTesterPaidNum > 0 && !isValidTxnId(testerTxnId)) {
      errors.testerTxnId = 'Tester Transaction ID / UTR No. is compulsory when disbursing tester payment.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});

    let newClientPaymentStatus = 'Pending';
    if (clientRemaining === 0 && totalClientPriceNum > 0) {
      newClientPaymentStatus = 'Full Payment Received';
    } else if (currCollectedNum > 0) {
      newClientPaymentStatus = 'Partial Payment';
    }

    let newDevPaymentStatus = 'Pending';
    if (devRemaining === 0 && developerPaymentNum > 0) {
      newDevPaymentStatus = 'Paid';
    } else if (currDevPaidNum > 0) {
      newDevPaymentStatus = 'Partial';
    }

    let newTesterPaymentStatus = 'Pending';
    if (testerRemaining === 0 && testerPaymentNum > 0) {
      newTesterPaymentStatus = 'Paid';
    } else if (currTesterPaidNum > 0) {
      newTesterPaymentStatus = 'Partial';
    }

    const finalClientTxn = currCollectedNum > 0 ? clientTxnId.trim() : '—';
    const finalDevTxn = currDevPaidNum > 0 ? devTxnId.trim() : '—';
    const finalTesterTxn = currTesterPaidNum > 0 ? testerTxnId.trim() : '—';

    const isAllSettled = (clientRemaining === 0 && devRemaining === 0 && testerRemaining === 0 && totalClientPriceNum > 0);
    const isPaymentDisbursed = (currDevPaidNum > 0 || currTesterPaidNum > 0 || newDevPaymentStatus === 'Paid' || newTesterPaymentStatus === 'Paid');

    let newProjectStatus = project.status;
    if (isAllSettled || (newDevPaymentStatus === 'Paid' && project.status === 'Approved')) {
      newProjectStatus = 'Completed';
    } else if (isPaymentDisbursed && (project.status === 'Finalized' || project.status === 'Submitted' || project.status === 'Under Review')) {
      newProjectStatus = 'Approved';
    }

    const updatedProject = {
      ...project,
      status: newProjectStatus,
      adminApproved: Boolean(project.adminApproved || isPaymentDisbursed || newProjectStatus === 'Approved' || newProjectStatus === 'Completed'),
      adminApprovedAt: project.adminApprovedAt || (isPaymentDisbursed ? new Date().toISOString() : null),

      // Client Updates
      totalClientPrice: `₹${totalClientPriceNum.toLocaleString('en-IN')}`,
      totalClientPriceNum: totalClientPriceNum,
      collectedClientAmount: `₹${currCollectedNum.toLocaleString('en-IN')}`,
      collectedClientAmountNum: currCollectedNum,
      clientPaidAmount: currCollectedNum,
      remainingClientAmount: `₹${clientRemaining.toLocaleString('en-IN')}`,
      remainingClientAmountNum: clientRemaining,
      clientRemainingAmount: clientRemaining,
      clientPaymentStatus: newClientPaymentStatus,
      paidAmount: `₹${currCollectedNum.toLocaleString('en-IN')}`,
      paidAmountNum: currCollectedNum,
      remainingAmount: `₹${clientRemaining.toLocaleString('en-IN')}`,
      remainingAmountNum: clientRemaining,
      startingPaymentReceived: currCollectedNum > 0,
      clientTransactionId: finalClientTxn,
      clientTxnId: finalClientTxn,
      clientPaymentMode: clientPaymentMode,
      clientPaymentDate: clientPaymentDate,

      // Developer Updates
      developerPayment: `₹${developerPaymentNum.toLocaleString('en-IN')}`,
      developerPaymentNum: developerPaymentNum,
      developerAssignedAmount: developerPaymentNum,
      developerPaymentPaid: `₹${currDevPaidNum.toLocaleString('en-IN')}`,
      developerPaymentPaidNum: currDevPaidNum,
      developerPaidAmount: currDevPaidNum,
      developerPaymentRemaining: `₹${devRemaining.toLocaleString('en-IN')}`,
      developerPaymentRemainingNum: devRemaining,
      developerRemainingAmount: devRemaining,
      developerPaymentStatus: newDevPaymentStatus,
      payoutStatus: newDevPaymentStatus === 'Paid' ? 'Paid' : 'Pending',
      developerTransactionId: finalDevTxn,
      developerPaymentTxnId: finalDevTxn,
      devTxnId: finalDevTxn,
      transactionId: finalDevTxn,
      payoutTransactionId: finalDevTxn,
      developerPaymentMode: devPaymentMode,
      developerPaymentDate: devPaymentDate,

      // Tester Updates
      testerPayment: `₹${testerPaymentNum.toLocaleString('en-IN')}`,
      testerPaymentNum: testerPaymentNum,
      testerAssignedAmount: testerPaymentNum,
      testerPaymentPaid: `₹${currTesterPaidNum.toLocaleString('en-IN')}`,
      testerPaymentPaidNum: currTesterPaidNum,
      testerPaidAmount: currTesterPaidNum,
      testerPaymentRemaining: `₹${testerRemaining.toLocaleString('en-IN')}`,
      testerPaymentRemainingNum: testerRemaining,
      testerRemainingAmount: testerRemaining,
      testerPaymentStatus: newTesterPaymentStatus,
      testerTransactionId: finalTesterTxn,
      testerPaymentTxnId: finalTesterTxn,
      testerTxnId: finalTesterTxn,
      testerPaymentMode: testerPaymentMode,
      testerPaymentDate: testerPaymentDate
    };

    onUpdatePayment(updatedProject);
    onClose();
  };

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="payment-modal-header">
          <div className="payment-header-info">
            <div className="payment-header-icon-box">
              <IndianRupee size={22} color="#0A3D75" />
            </div>
            <div>
              <h2 className="payment-modal-title">Payment Settlement & Distribution</h2>
              <div className="payment-modal-subtitle">
                <span>{project.name}</span>
                <span className="payment-proj-pill">{project.id}</span>
              </div>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            className="payment-modal-close-btn"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Settle All Banner */}
        {totalRemainingSum > 0 && (
          <div className="settle-all-banner">
            <div className="settle-all-text">
              <Sparkles size={16} color="#F3821D" />
              <span>Total remaining balance across Client, Developer & Tester: <strong>₹{totalRemainingSum.toLocaleString('en-IN')}</strong></span>
            </div>
            <button
              type="button"
              onClick={handleSettleAllInFull}
              className="btn-quick-settle-all"
            >
              <Check size={14} />
              <span>Settle All in Full</span>
            </button>
          </div>
        )}

        {/* Validation Error Alert Banner */}
        {Object.keys(validationErrors).length > 0 && (
          <div className="payment-validation-banner">
            <AlertCircle size={18} color="#DC2626" />
            <div style={{ flex: 1 }}>
              <strong>Transaction ID Compulsory:</strong> Please enter a valid Transaction ID / UTR number for each settled payment before saving.
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="payment-modal-form">
          <div className="payment-cards-grid">
            
            {/* ============================================================== */}
            {/* 1. CLIENT PAYMENT CARD (Collect From Client) */}
            {/* ============================================================== */}
            <div className={`payment-entity-card client-entity ${clientRemaining === 0 ? 'card-settled' : ''}`}>
              <div className="entity-card-header">
                <div className="entity-card-title-wrap">
                  <div className="entity-icon-badge client-badge">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <h3 className="entity-name">1. Client Payment (Collect)</h3>
                    <span className="entity-sub">{project.client || 'Corporate Client Account'}</span>
                  </div>
                </div>

                <span className={`entity-status-pill ${clientRemaining === 0 ? 'settled' : 'pending'}`}>
                  {clientRemaining === 0 ? '✓ Fully Collected' : `₹${clientRemaining.toLocaleString('en-IN')} Due`}
                </span>
              </div>

              <div className="entity-stats-row">
                <div className="entity-stat-item">
                  <span className="stat-label">Total Agreed Price</span>
                  <span className="stat-value">₹{totalClientPriceNum.toLocaleString('en-IN')}</span>
                </div>
                <div className="entity-stat-item">
                  <span className="stat-label">Remaining To Collect</span>
                  <span className="stat-value remaining-val">₹{clientRemaining.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="entity-input-section">
                <div className="input-label-row">
                  <label className="entity-input-label">Total Collected Amount (₹)</label>
                  {clientRemaining > 0 && (
                    <button
                      type="button"
                      onClick={handleCollectFullClient}
                      className="btn-fill-full"
                    >
                      Receive Full Balance (+₹{clientRemaining.toLocaleString('en-IN')})
                    </button>
                  )}
                </div>
                <div className="modal-currency-input-wrap">
                  <span className="currency-prefix">₹</span>
                  <input
                    type="number"
                    min="0"
                    max={totalClientPriceNum}
                    value={collectedInput}
                    onChange={(e) => {
                      setCollectedInput(e.target.value);
                      if (Number(e.target.value || 0) === 0 && validationErrors.clientTxnId) {
                        setValidationErrors(prev => ({ ...prev, clientTxnId: undefined }));
                      }
                    }}
                    className="modal-portal-input"
                    placeholder="Enter collected amount"
                  />
                </div>

                {/* Client Transaction ID & Payment Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', marginTop: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Hash size={12} color="#0A3D75" />
                        <span>Client Transaction ID / UTR No.</span>
                        {currCollectedNum > 0 && <span className="badge-compulsory">* Compulsory</span>}
                      </label>
                      {currCollectedNum > 0 && !clientTxnId && (
                        <button
                          type="button"
                          className="btn-quick-id-gen"
                          onClick={() => {
                            const numId = (project.id || '').replace(/[^0-9]/g, '') || '101';
                            setClientTxnId(`TXN-CLI-${numId}${Math.floor(1000 + Math.random() * 9000)}`);
                            if (validationErrors.clientTxnId) setValidationErrors(prev => ({ ...prev, clientTxnId: undefined }));
                          }}
                        >
                          + Auto Gen
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={clientTxnId}
                      onChange={(e) => {
                        setClientTxnId(e.target.value);
                        if (validationErrors.clientTxnId && isValidTxnId(e.target.value)) {
                          setValidationErrors(prev => ({ ...prev, clientTxnId: undefined }));
                        }
                      }}
                      placeholder="e.g. TXN-CLI-882910 or Cheque/NEFT Ref"
                      className={`modal-portal-input ${validationErrors.clientTxnId ? 'input-field-error' : ''}`}
                      style={{ padding: '8px 12px', fontSize: '0.84rem', fontFamily: 'monospace' }}
                    />
                    {validationErrors.clientTxnId && (
                      <span className="field-error-text">
                        <AlertCircle size={12} />
                        {validationErrors.clientTxnId}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CreditCard size={12} color="#0A3D75" />
                      <span>Payment Method</span>
                    </label>
                    <select
                      value={clientPaymentMode}
                      onChange={(e) => setClientPaymentMode(e.target.value)}
                      className="modal-portal-input"
                      style={{ padding: '8px 10px', fontSize: '0.84rem', backgroundColor: '#FFFFFF' }}
                    >
                      <option value="Bank Transfer">Bank Transfer / NEFT</option>
                      <option value="UPI">UPI</option>
                      <option value="IMPS">IMPS</option>
                      <option value="RTGS">RTGS</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Wire Transfer">Wire Transfer</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* 2. DEVELOPER PAYMENT CARD (Disburse To Developer) */}
            {/* ============================================================== */}
            <div className={`payment-entity-card dev-entity ${devRemaining === 0 ? 'card-settled' : ''}`}>
              <div className="entity-card-header">
                <div className="entity-card-title-wrap">
                  <div className="entity-icon-badge dev-badge">
                    <Users size={16} />
                  </div>
                  <div>
                    <h3 className="entity-name">2. Developer Payment (Disburse)</h3>
                    <span className="entity-sub">{project.developer || 'Assigned Developer'} ({project.developerId || 'DEV'})</span>
                  </div>
                </div>

                <span className={`entity-status-pill ${devRemaining === 0 ? 'settled' : 'pending'}`}>
                  {devRemaining === 0 ? '✓ Fully Disbursed' : `₹${devRemaining.toLocaleString('en-IN')} Due`}
                </span>
              </div>

              <div className="entity-stats-row">
                <div className="entity-stat-item">
                  <span className="stat-label">Total Developer Payout</span>
                  <span className="stat-value">₹{developerPaymentNum.toLocaleString('en-IN')}</span>
                </div>
                <div className="entity-stat-item">
                  <span className="stat-label">Remaining To Pay</span>
                  <span className="stat-value remaining-val">₹{devRemaining.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="entity-input-section">
                <div className="input-label-row">
                  <label className="entity-input-label">Total Paid to Developer (₹)</label>
                  {devRemaining > 0 && (
                    <button
                      type="button"
                      onClick={handlePayFullDeveloper}
                      className="btn-fill-full"
                    >
                      Pay Full Balance (+₹{devRemaining.toLocaleString('en-IN')})
                    </button>
                  )}
                </div>
                <div className="modal-currency-input-wrap">
                  <span className="currency-prefix">₹</span>
                  <input
                    type="number"
                    min="0"
                    max={developerPaymentNum}
                    value={devPaidInput}
                    onChange={(e) => {
                      setDevPaidInput(e.target.value);
                      if (Number(e.target.value || 0) === 0 && validationErrors.devTxnId) {
                        setValidationErrors(prev => ({ ...prev, devTxnId: undefined }));
                      }
                    }}
                    className="modal-portal-input"
                    placeholder="Enter paid amount to developer"
                  />
                </div>

                {/* Developer Transaction ID & Payment Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', marginTop: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Hash size={12} color="#0A3D75" />
                        <span>Developer Transaction ID / UTR No.</span>
                        {currDevPaidNum > 0 && <span className="badge-compulsory">* Compulsory</span>}
                      </label>
                      {currDevPaidNum > 0 && !devTxnId && (
                        <button
                          type="button"
                          className="btn-quick-id-gen"
                          onClick={() => {
                            const numId = (project.id || '').replace(/[^0-9]/g, '') || '101';
                            setDevTxnId(`TXN-DEV-${numId}${Math.floor(1000 + Math.random() * 9000)}`);
                            if (validationErrors.devTxnId) setValidationErrors(prev => ({ ...prev, devTxnId: undefined }));
                          }}
                        >
                          + Auto Gen
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={devTxnId}
                      onChange={(e) => {
                        setDevTxnId(e.target.value);
                        if (validationErrors.devTxnId && isValidTxnId(e.target.value)) {
                          setValidationErrors(prev => ({ ...prev, devTxnId: undefined }));
                        }
                      }}
                      placeholder="e.g. TXN-DEV-918230 or UPI/Bank Ref"
                      className={`modal-portal-input ${validationErrors.devTxnId ? 'input-field-error' : ''}`}
                      style={{ padding: '8px 12px', fontSize: '0.84rem', fontFamily: 'monospace' }}
                    />
                    {validationErrors.devTxnId && (
                      <span className="field-error-text">
                        <AlertCircle size={12} />
                        {validationErrors.devTxnId}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CreditCard size={12} color="#0A3D75" />
                      <span>Disbursal Method</span>
                    </label>
                    <select
                      value={devPaymentMode}
                      onChange={(e) => setDevPaymentMode(e.target.value)}
                      className="modal-portal-input"
                      style={{ padding: '8px 10px', fontSize: '0.84rem', backgroundColor: '#FFFFFF' }}
                    >
                      <option value="UPI Transfer">UPI Transfer</option>
                      <option value="IMPS / NEFT">IMPS / NEFT</option>
                      <option value="Bank Account Transfer">Bank Account Transfer</option>
                      <option value="RTGS">RTGS</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* 3. TESTER PAYMENT CARD (Disburse To Tester) */}
            {/* ============================================================== */}
            <div className={`payment-entity-card tester-entity ${testerRemaining === 0 ? 'card-settled' : ''}`}>
              <div className="entity-card-header">
                <div className="entity-card-title-wrap">
                  <div className="entity-icon-badge tester-badge">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h3 className="entity-name">3. QA Tester Payment (Disburse)</h3>
                    <span className="entity-sub">{project.tester || 'Assigned QA Tester'} ({project.testerId || 'TST'})</span>
                  </div>
                </div>

                <span className={`entity-status-pill ${testerRemaining === 0 ? 'settled' : 'pending'}`}>
                  {testerRemaining === 0 ? '✓ Fully Disbursed' : `₹${testerRemaining.toLocaleString('en-IN')} Due`}
                </span>
              </div>

              <div className="entity-stats-row">
                <div className="entity-stat-item">
                  <span className="stat-label">Total Tester Payout</span>
                  <span className="stat-value">₹{testerPaymentNum.toLocaleString('en-IN')}</span>
                </div>
                <div className="entity-stat-item">
                  <span className="stat-label">Remaining To Pay</span>
                  <span className="stat-value remaining-val">₹{testerRemaining.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="entity-input-section">
                <div className="input-label-row">
                  <label className="entity-input-label">Total Paid to Tester (₹)</label>
                  {testerRemaining > 0 && (
                    <button
                      type="button"
                      onClick={handlePayFullTester}
                      className="btn-fill-full"
                    >
                      Pay Full Balance (+₹{testerRemaining.toLocaleString('en-IN')})
                    </button>
                  )}
                </div>
                <div className="modal-currency-input-wrap">
                  <span className="currency-prefix">₹</span>
                  <input
                    type="number"
                    min="0"
                    max={testerPaymentNum}
                    value={testerPaidInput}
                    onChange={(e) => {
                      setTesterPaidInput(e.target.value);
                      if (Number(e.target.value || 0) === 0 && validationErrors.testerTxnId) {
                        setValidationErrors(prev => ({ ...prev, testerTxnId: undefined }));
                      }
                    }}
                    className="modal-portal-input"
                    placeholder="Enter paid amount to tester"
                  />
                </div>

                {/* Tester Transaction ID & Payment Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', marginTop: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Hash size={12} color="#0A3D75" />
                        <span>Tester Transaction ID / UTR No.</span>
                        {currTesterPaidNum > 0 && <span className="badge-compulsory">* Compulsory</span>}
                      </label>
                      {currTesterPaidNum > 0 && !testerTxnId && (
                        <button
                          type="button"
                          className="btn-quick-id-gen"
                          onClick={() => {
                            const numId = (project.id || '').replace(/[^0-9]/g, '') || '101';
                            setTesterTxnId(`TXN-TST-${numId}${Math.floor(1000 + Math.random() * 9000)}`);
                            if (validationErrors.testerTxnId) setValidationErrors(prev => ({ ...prev, testerTxnId: undefined }));
                          }}
                        >
                          + Auto Gen
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={testerTxnId}
                      onChange={(e) => {
                        setTesterTxnId(e.target.value);
                        if (validationErrors.testerTxnId && isValidTxnId(e.target.value)) {
                          setValidationErrors(prev => ({ ...prev, testerTxnId: undefined }));
                        }
                      }}
                      placeholder="e.g. TXN-TST-771923 or UPI/Bank Ref"
                      className={`modal-portal-input ${validationErrors.testerTxnId ? 'input-field-error' : ''}`}
                      style={{ padding: '8px 12px', fontSize: '0.84rem', fontFamily: 'monospace' }}
                    />
                    {validationErrors.testerTxnId && (
                      <span className="field-error-text">
                        <AlertCircle size={12} />
                        {validationErrors.testerTxnId}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CreditCard size={12} color="#0A3D75" />
                      <span>Disbursal Method</span>
                    </label>
                    <select
                      value={testerPaymentMode}
                      onChange={(e) => setTesterPaymentMode(e.target.value)}
                      className="modal-portal-input"
                      style={{ padding: '8px 10px', fontSize: '0.84rem', backgroundColor: '#FFFFFF' }}
                    >
                      <option value="UPI Transfer">UPI Transfer</option>
                      <option value="IMPS / NEFT">IMPS / NEFT</option>
                      <option value="Bank Account Transfer">Bank Account Transfer</option>
                      <option value="RTGS">RTGS</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Modal Footer Actions */}
          <div className="payment-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn-modal-cancel"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn-modal-save"
            >
              <Check size={16} />
              <span>Update & Save Payments</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
