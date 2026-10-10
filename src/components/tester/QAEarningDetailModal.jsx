import React from 'react';
import { X, IndianRupee, CheckCircle2, FileText, Building2, Calendar, ShieldCheck, Download } from 'lucide-react';
import StatusBadge from '../portal/StatusBadge';

export default function QAEarningDetailModal({ isOpen, earning, onClose }) {
  if (!isOpen || !earning) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 34, 61, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          borderTop: '4px solid #F3821D',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FAFCFE' }}>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#F3821D', textTransform: 'uppercase' }}>
              QA TESTING PAYOUT STATEMENT
            </span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0A3D75', margin: 0 }}>
              Invoice {earning.id}
            </h3>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            style={{ padding: '6px', color: '#64748B', cursor: 'pointer', background: 'none', border: 'none' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Amount Badge */}
          <div style={{ backgroundColor: '#F0F6FB', border: '1px solid #D4E3F0', padding: '18px', borderRadius: '10px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#5F6B76', textTransform: 'uppercase' }}>
              QA Inspection Compensation
            </span>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0A3D75', marginTop: '4px' }}>
              {earning.qaFee}
            </div>
            <div style={{ marginTop: '8px' }}>
              <StatusBadge status={earning.status} />
            </div>
          </div>

          {/* Details Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
              <span style={{ color: '#64748B' }}>Verified Project:</span>
              <strong style={{ color: '#17212B' }}>{earning.projectName}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
              <span style={{ color: '#64748B' }}>Project ID:</span>
              <span style={{ fontWeight: 700, color: '#0A3D75' }}>{earning.projectId}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
              <span style={{ color: '#64748B' }}>Assigned Developer:</span>
              <span style={{ color: '#17212B', fontWeight: 600 }}>{earning.developer}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
              <span style={{ color: '#64748B' }}>QA Testing Scope:</span>
              <span style={{ color: '#17212B', textAlign: 'right', maxWidth: '60%' }}>{earning.qaScope}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
              <span style={{ color: '#64748B' }}>Checklist Status:</span>
              <span style={{ color: '#16A34A', fontWeight: 700 }}>{earning.verifiedChecks}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
              <span style={{ color: '#64748B' }}>Payment Method:</span>
              <span style={{ color: '#17212B' }}>{earning.paymentMethod}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
              <span style={{ color: '#64748B' }}>Bank Account:</span>
              <span style={{ fontWeight: 600, color: '#0A3D75' }}>{earning.bankAccount}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
              <span style={{ color: '#64748B' }}>Transaction Reference:</span>
              <span style={{ fontWeight: 600, color: '#0A3D75' }}>{earning.transactionId}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Payout Date:</span>
              <span style={{ color: '#10B981', fontWeight: 700 }}>{earning.payoutDate}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => alert(`Downloading Invoice Receipt ${earning.id}`)}
              className="btn btn-navy-action"
              style={{ flex: 1, padding: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Download size={14} />
              <span>Download Receipt</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-orange-primary"
              style={{ flex: 1, padding: '10px' }}
            >
              Close Statement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
