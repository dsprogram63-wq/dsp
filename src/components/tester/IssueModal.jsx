import React, { useState, useEffect } from 'react';
import { X, AlertCircle, UploadCloud, FileText, CheckCircle2, Image as ImageIcon } from 'lucide-react';

export default function IssueModal({ 
  isOpen, 
  onClose, 
  onAddIssue, 
  checklistTitle = '',
  relatedTaskDefault = '',
  relatedTaskId = null
}) {
  const [formData, setFormData] = useState({
    title: checklistTitle ? `Issue: ${checklistTitle}` : '',
    description: '',
    severity: 'High',
    category: 'Functionality',
    relatedTask: relatedTaskDefault || (checklistTitle ? checklistTitle : '01 Project Feature'),
    relatedTaskId: relatedTaskId || null,
    expectedResult: '',
    actualResult: '',
    attachmentName: 'screenshot_bug_report.png',
    hasAttachment: false,
    attachmentUrl: null
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: checklistTitle ? `Issue in ${checklistTitle}` : '',
        description: '',
        severity: 'High',
        category: 'Functionality',
        relatedTask: relatedTaskDefault || (checklistTitle ? checklistTitle : '01 Project Feature'),
        relatedTaskId: relatedTaskId || null,
        expectedResult: '',
        actualResult: '',
        attachmentName: 'screenshot_bug_report.png',
        hasAttachment: false,
        attachmentUrl: null
      });
    }
  }, [isOpen, checklistTitle, relatedTaskDefault, relatedTaskId]);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        attachmentName: file.name,
        hasAttachment: true,
        attachmentUrl: url
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !formData.title.trim() || 
      !formData.description.trim() || 
      !formData.expectedResult.trim() || 
      !formData.actualResult.trim()
    ) {
      alert('Please fill in all mandatory fields: Issue Title, Detailed Bug Description, Expected Result, and Actual Result.');
      return;
    }

    const newIssue = {
      id: `iss-${Date.now().toString().slice(-4)}`,
      taskId: formData.relatedTaskId,
      title: formData.title.trim(),
      description: formData.description.trim(),
      severity: formData.severity,
      category: formData.category,
      task: formData.relatedTask,
      expected: formData.expectedResult.trim(),
      expectedResult: formData.expectedResult.trim(),
      actual: formData.actualResult.trim(),
      actualResult: formData.actualResult.trim(),
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Open',
      attachment: formData.hasAttachment ? formData.attachmentName : null,
      attachmentUrl: formData.attachmentUrl || null
    };

    onAddIssue(newIssue);
  };

  return (
    <div className="modal-backdrop-qa" onClick={onClose}>
      <div className="modal-dialog-qa" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head-qa">
          <div className="head-badge-wrap">
            <span className="qa-modal-icon-badge bug">
              <AlertCircle size={18} />
            </span>
            <div>
              <h2 className="modal-title-qa">Report Quality & Bug Issue</h2>
              <p className="modal-sub-qa">Log a formal defect against project deliverables for developer revision</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn-qa" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body-qa">
          {/* Issue Title */}
          <div className="form-group-qa">
            <label>Issue Title <span className="req">*</span></label>
            <input 
              type="text" 
              className="input-qa"
              placeholder="e.g. Contact form does not validate phone digits on mobile" 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          {/* Severity & Category Grid */}
          <div className="form-row-qa">
            <div className="form-group-qa">
              <label>Severity Level <span className="req">*</span></label>
              <select 
                className="select-qa"
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              >
                <option value="Low">🟢 Low (Minor visual/copy issue)</option>
                <option value="Medium">🟡 Medium (Functional flaw with workaround)</option>
                <option value="High">🟠 High (Major feature failing)</option>
                <option value="Critical">🔴 Critical (Blocker / Broken deployment / Data loss)</option>
              </select>
            </div>

            <div className="form-group-qa">
              <label>Issue Category <span className="req">*</span></label>
              <select 
                className="select-qa"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="UI">UI / Visual Layout</option>
                <option value="Functionality">Functionality</option>
                <option value="Responsive">Mobile & Responsive</option>
                <option value="Performance">Performance & Speed</option>
                <option value="Content">Content / Typography</option>
                <option value="API">API & Webhooks</option>
                <option value="Database">Database & Storage</option>
                <option value="Authentication">Authentication & Security</option>
                <option value="Other">Other Miscellaneous</option>
              </select>
            </div>
          </div>

          {/* Related Task */}
          <div className="form-group-qa">
            <label>Related Project Task</label>
            <input 
              type="text" 
              className="input-qa"
              placeholder="e.g. 04 Contact Page & Lead Form"
              value={formData.relatedTask}
              onChange={(e) => setFormData({ ...formData, relatedTask: e.target.value })}
            />
          </div>

          {/* Detailed Description */}
          <div className="form-group-qa">
            <label>Detailed Bug Description <span className="req">*</span></label>
            <textarea 
              rows={3} 
              className="textarea-qa"
              placeholder="Explain the step-by-step reproduction and observed bug in detail..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          {/* Expected vs Actual Result Grid */}
          <div className="form-row-qa">
            <div className="form-group-qa">
              <label>Expected Result <span className="req">*</span></label>
              <textarea 
                rows={2} 
                className="textarea-qa small"
                placeholder="What should happen per specifications..."
                value={formData.expectedResult}
                onChange={(e) => setFormData({ ...formData, expectedResult: e.target.value })}
                required
              />
            </div>
            <div className="form-group-qa">
              <label>Actual Result <span className="req">*</span></label>
              <textarea 
                rows={2} 
                className="textarea-qa small"
                placeholder="What actually happens during testing..."
                value={formData.actualResult}
                onChange={(e) => setFormData({ ...formData, actualResult: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Attachment (Screenshot / Document upload) */}
          <div className="form-group-qa">
            <label>Screenshot / Defect Proof Attachment</label>
            <div className="mock-upload-box-qa" style={{ position: 'relative' }}>
              <div className="upload-left">
                {formData.hasAttachment ? (
                  <CheckCircle2 size={20} color="#10B981" className="file-icon" />
                ) : (
                  <UploadCloud size={20} color="#0A3D75" className="file-icon" />
                )}
                <div className="upload-file-info">
                  <span className="file-name">{formData.hasAttachment ? formData.attachmentName : 'No file chosen yet'}</span>
                  <span className="file-meta">
                    {formData.hasAttachment ? 'Ready for attachment' : 'Upload PNG, JPG or PDF screenshot'}
                  </span>
                </div>
              </div>
              <label 
                className="mock-change-file-btn"
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <span>{formData.hasAttachment ? 'Change File' : 'Browse File'}</span>
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  onChange={handleFileUpload} 
                  style={{ display: 'none' }} 
                />
              </label>
            </div>
          </div>

          <div className="modal-footer-qa">
            <button type="button" className="btn-cancel-qa" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit-qa btn-danger-action">
              <AlertCircle size={16} />
              <span>Add Issue & Mark Fail</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
