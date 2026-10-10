import React, { useState } from 'react';
import { X, AlertOctagon, Send, FileText, CheckCircle2 } from 'lucide-react';

export default function RequestChangesModal({ 
  isOpen, 
  onClose, 
  onRequestChanges, 
  projectName = '',
  developerName = ''
}) {
  const [formData, setFormData] = useState({
    issueSummary: 'Mobile responsiveness and form validation defects must be resolved.',
    detailedNotes: 'During QA testing on iPad and iPhone 14 Pro, the RFQ inquiry form fails to validate required input fields and the category filter is not resetting.',
    requiredChanges: '1. Add regex validation for phone numbers.\n2. Ensure clear-filter button resets mobile drawer state.\n3. Verify all 40 product modal popups close smoothly on backdrop click.',
    severity: 'High',
    relatedTask: '04 Contact Page & Lead Form',
    attachmentName: 'QA_Changes_Required.pdf',
    hasAttachment: true
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.issueSummary.trim() || !formData.requiredChanges.trim()) {
      alert('Please fill in both the Issue Summary and Required Changes.');
      return;
    }

    onRequestChanges({
      reason: formData.issueSummary,
      detailedNotes: formData.detailedNotes,
      requiredChanges: formData.requiredChanges,
      severity: formData.severity,
      task: formData.relatedTask,
      documentName: formData.hasAttachment ? formData.attachmentName : null
    });
    onClose();
  };

  return (
    <div className="modal-backdrop-qa" onClick={onClose}>
      <div className="modal-dialog-qa large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head-qa">
          <div className="head-badge-wrap">
            <span className="qa-modal-icon-badge warning">
              <AlertOctagon size={18} />
            </span>
            <div>
              <h2 className="modal-title-qa">Request Changes from Developer</h2>
              <p className="modal-sub-qa">
                Return project <strong>{projectName}</strong> to <strong>{developerName}</strong> with specific QA revision requirements
              </p>
            </div>
          </div>
          <button className="modal-close-btn-qa" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body-qa">
          {/* Issue Summary */}
          <div className="form-group-qa">
            <label>Issue Summary <span className="req">*</span></label>
            <input 
              type="text" 
              className="input-qa"
              placeholder="High-level summary of defects requiring developer attention"
              value={formData.issueSummary}
              onChange={(e) => setFormData({ ...formData, issueSummary: e.target.value })}
              required
            />
          </div>

          <div className="form-row-qa">
            <div className="form-group-qa">
              <label>Revision Severity <span className="req">*</span></label>
              <select 
                className="select-qa"
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              >
                <option value="High">🟠 High Priority (Blocks production release)</option>
                <option value="Critical">🔴 Critical (Major functional/security failure)</option>
                <option value="Medium">🟡 Medium (Cosmetic and usability fixes)</option>
              </select>
            </div>

            <div className="form-group-qa">
              <label>Primary Related Task</label>
              <input 
                type="text" 
                className="input-qa"
                placeholder="e.g. 04 Contact Page & Lead Form"
                value={formData.relatedTask}
                onChange={(e) => setFormData({ ...formData, relatedTask: e.target.value })}
              />
            </div>
          </div>

          {/* Detailed Notes */}
          <div className="form-group-qa">
            <label>Detailed QA Notes</label>
            <textarea 
              rows={2} 
              className="textarea-qa"
              placeholder="Provide background context on the testing session and observed behavior..."
              value={formData.detailedNotes}
              onChange={(e) => setFormData({ ...formData, detailedNotes: e.target.value })}
            />
          </div>

          {/* Required Changes (Numbered / Bulleted) */}
          <div className="form-group-qa">
            <label>Required Changes Checklist for Developer <span className="req">*</span></label>
            <textarea 
              rows={4} 
              className="textarea-qa"
              placeholder="1. Action item one...&#10;2. Action item two...&#10;3. Action item three..."
              value={formData.requiredChanges}
              onChange={(e) => setFormData({ ...formData, requiredChanges: e.target.value })}
              required
            />
          </div>

          {/* Document Attachment */}
          <div className="form-group-qa">
            <label>QA Revision Attachment Document</label>
            <div className="mock-upload-box-qa">
              <div className="upload-left">
                <FileText size={20} className="file-icon" />
                <div className="upload-file-info">
                  <span className="file-name">{formData.attachmentName}</span>
                  <span className="file-meta">PDF Document • 1.8 MB • Generated QA Checklist Sheet</span>
                </div>
              </div>
              <button 
                type="button" 
                className="mock-change-file-btn"
                onClick={() => setFormData({ ...formData, hasAttachment: !formData.hasAttachment })}
              >
                {formData.hasAttachment ? 'Attached ✓' : 'Attach QA Sheet'}
              </button>
            </div>
          </div>

          <div className="revision-notice-box">
            <AlertOctagon size={16} className="notice-icon" />
            <p>
              Once submitted, the project will move to <strong>"Revision Required"</strong> status. Developer <strong>{developerName}</strong> will receive an instant notification with these instructions to update their code and resubmit.
            </p>
          </div>

          <div className="modal-footer-qa">
            <button type="button" className="btn-cancel-qa" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit-qa btn-warning-action">
              <Send size={16} />
              <span>Send Changes to Developer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
