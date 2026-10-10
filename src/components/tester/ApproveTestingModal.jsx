import React from 'react';
import { X, CheckCircle2, ShieldCheck, Award } from 'lucide-react';

export default function ApproveTestingModal({ 
  isOpen, 
  onClose, 
  onConfirmApprove, 
  projectName = '',
  developerName = ''
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-qa" onClick={onClose}>
      <div className="modal-dialog-qa compact" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head-qa">
          <div className="head-badge-wrap">
            <span className="qa-modal-icon-badge success">
              <CheckCircle2 size={20} />
            </span>
            <div>
              <h2 className="modal-title-qa">Finalize Project?</h2>
              <p className="modal-sub-qa">Quality verification & QA final sign-off</p>
            </div>
          </div>
          <button className="modal-close-btn-qa" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body-qa">
          <div className="approval-confirmation-card">
            <p className="confirm-main-text">
              Confirm that the project <strong>"{projectName}"</strong> built by <strong>{developerName}</strong> has passed all QA checklist tests and is ready to be marked as <strong>Finalized</strong>.
            </p>

            <div className="qa-summary-metrics-grid">
              <div className="metric-box">
                <span className="label">Checklist Status</span>
                <span className="val success">100% Passed</span>
              </div>
              <div className="metric-box">
                <span className="label">Open Critical Defects</span>
                <span className="val zero">0 Blockers</span>
              </div>
              <div className="metric-box">
                <span className="label">QA Sign-Off Lead</span>
                <span className="val">Tester</span>
              </div>
            </div>

            <div className="approval-status-tag-info">
              <ShieldCheck size={16} />
              <span>
                Upon confirmation, QA status will update to <strong>"Finalized"</strong> (100% QA Completed) and move to Admin for final project approval.
              </span>
            </div>
          </div>

          <div className="modal-footer-qa">
            <button type="button" className="btn-cancel-qa" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="button" 
              className="btn-submit-qa btn-success-action"
              onClick={() => {
                onConfirmApprove();
                onClose();
              }}
            >
              <CheckCircle2 size={16} />
              <span>Finalize Project</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
