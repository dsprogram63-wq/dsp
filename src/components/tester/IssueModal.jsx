import React, { useState, useEffect } from 'react';
import { X, AlertCircle, UploadCloud, FileText, CheckCircle2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadFileToBucket } from '../../services/storageService.js';

export default function IssueModal({ 
  isOpen, 
  onClose, 
  onAddIssue, 
  checklistTitle = '',
  relatedTaskDefault = '',
  relatedTaskId = null,
  taskNotes = ''
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: checklistTitle ? `Issue: ${checklistTitle}` : '',
    description: '',
    severity: 'High',
    category: 'Functionality',
    relatedTask: relatedTaskDefault || (checklistTitle ? checklistTitle : '01 Project Feature'),
    relatedTaskId: relatedTaskId || null,
    expectedResult: '',
    actualResult: '',
    attachmentName: '',
    hasAttachment: false,
    attachmentUrl: null,
    attachmentDataUrl: null,
    cloudUrl: null,
    screenshot: null
  });

  useEffect(() => {
    if (isOpen) {
      setIsUploading(false);
      setFormData({
        title: checklistTitle ? `Issue in ${checklistTitle}` : '',
        description: '',
        severity: 'High',
        category: 'Functionality',
        relatedTask: relatedTaskDefault || (checklistTitle ? checklistTitle : '01 Project Feature'),
        relatedTaskId: relatedTaskId || null,
        expectedResult: '',
        actualResult: '',
        attachmentName: '',
        hasAttachment: false,
        attachmentUrl: null,
        attachmentDataUrl: null,
        cloudUrl: null,
        screenshot: null
      });
    }
  }, [isOpen, checklistTitle, relatedTaskDefault, relatedTaskId]);

  if (!isOpen) return null;

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const fileName = file.name;
    const isImage = file.type.startsWith('image/');
    setIsUploading(true);

    // 1. Generate Base64 for instant local preview & offline backup
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target.result;

      if (isImage) {
        const img = new Image();
        img.onload = () => {
          const MAX_WIDTH = 1280;
          const MAX_HEIGHT = 1280;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            if (width > height) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            } else {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const compressedDataUrl = canvas.toDataURL(outputType, 0.85);

          setFormData(prev => ({
            ...prev,
            attachmentName: fileName,
            hasAttachment: true,
            attachmentDataUrl: compressedDataUrl,
            attachmentUrl: prev.cloudUrl || compressedDataUrl,
            screenshot: prev.cloudUrl || compressedDataUrl
          }));
        };
        img.onerror = () => {
          setFormData(prev => ({
            ...prev,
            attachmentName: fileName,
            hasAttachment: true,
            attachmentDataUrl: rawDataUrl,
            attachmentUrl: prev.cloudUrl || rawDataUrl,
            screenshot: prev.cloudUrl || rawDataUrl
          }));
        };
        img.src = rawDataUrl;
      } else {
        setFormData(prev => ({
          ...prev,
          attachmentName: fileName,
          hasAttachment: true,
          attachmentDataUrl: rawDataUrl,
          attachmentUrl: prev.cloudUrl || rawDataUrl,
          screenshot: prev.cloudUrl || rawDataUrl
        }));
      }
    };
    reader.readAsDataURL(file);

    // 2. Upload file directly to Supabase Storage bucket for permanent public URL
    try {
      const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniquePath = `bugs/${Date.now()}_${cleanName}`;
      
      // Try bug-screenshots first, fallback to avatars
      let res = await uploadFileToBucket('bug-screenshots', uniquePath, file);
      if (!res.url) {
        res = await uploadFileToBucket('avatars', uniquePath, file);
      }

      if (res.url) {
        setFormData(prev => ({
          ...prev,
          cloudUrl: res.url,
          attachmentUrl: res.url,
          screenshot: res.url
        }));
      }
    } catch (err) {
      console.warn('Direct cloud screenshot upload fallback:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAttachment = () => {
    setIsUploading(false);
    setFormData(prev => ({
      ...prev,
      attachmentName: '',
      hasAttachment: false,
      attachmentUrl: null,
      attachmentDataUrl: null,
      cloudUrl: null,
      screenshot: null
    }));
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

    // Always prefer permanent cloud HTTPS URL, fallback to high-res Base64
    const fileData = formData.hasAttachment ? (formData.cloudUrl || formData.screenshot || formData.attachmentUrl || formData.attachmentDataUrl) : null;
    const backupDataUrl = formData.hasAttachment ? (formData.attachmentDataUrl || fileData) : null;
    const fileName = formData.hasAttachment ? (formData.attachmentName || 'screenshot_defect_proof.png') : null;

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
      reporter: 'Tester',
      // Multi-format compatibility ensuring all roles & components access the screenshot
      attachment: fileName,
      attachmentName: fileName,
      attachmentUrl: fileData,
      attachmentDataUrl: backupDataUrl,
      screenshot: fileData,
      cloudUrl: formData.cloudUrl || null
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
          {taskNotes ? (
            <div style={{
              background: '#F0F9FF',
              border: '1px solid #BAE6FD',
              borderLeft: '4px solid #0284C7',
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#0369A1',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginBottom: '4px'
              }}>
                <FileText size={13} />
                Freelancer / Developer Task Note:
              </span>
              <p style={{
                margin: 0,
                fontSize: '0.84rem',
                color: '#0F172A',
                lineHeight: 1.45,
                whiteSpace: 'pre-line',
                fontWeight: 500
              }}>
                {taskNotes}
              </p>
            </div>
          ) : null}

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
                {isUploading ? (
                  <Loader2 size={20} color="#0A3D75" className="file-icon spin" style={{ animation: 'spin 1s linear infinite' }} />
                ) : formData.hasAttachment ? (
                  <CheckCircle2 size={20} color="#10B981" className="file-icon" />
                ) : (
                  <UploadCloud size={20} color="#0A3D75" className="file-icon" />
                )}
                <div className="upload-file-info">
                  <span className="file-name">
                    {isUploading ? 'Uploading screenshot to cloud...' : formData.hasAttachment ? formData.attachmentName : 'No file chosen yet'}
                  </span>
                  <span className="file-meta">
                    {isUploading ? 'Storing in Supabase cloud storage...' : formData.hasAttachment ? '✓ Cloud screenshot attached' : 'Upload PNG, JPG or PDF screenshot'}
                  </span>
                </div>
              </div>
              <label 
                className="mock-change-file-btn"
                style={{ cursor: isUploading ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', opacity: isUploading ? 0.6 : 1 }}
              >
                <span>{isUploading ? 'Uploading...' : formData.hasAttachment ? 'Change File' : 'Browse File'}</span>
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  disabled={isUploading}
                  onChange={handleFileUpload} 
                  style={{ display: 'none' }} 
                />
              </label>
            </div>

            {/* Thumbnail Preview Box */}
            {formData.hasAttachment && (formData.screenshot || formData.attachmentUrl || formData.attachmentDataUrl) && (
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px', background: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <img 
                  src={formData.screenshot || formData.attachmentUrl || formData.attachmentDataUrl} 
                  alt="Defect Proof Preview" 
                  style={{ width: '84px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #CBD5E1', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                  onError={(e) => {
                    if (formData.attachmentDataUrl && e.currentTarget.src !== formData.attachmentDataUrl) {
                      e.currentTarget.src = formData.attachmentDataUrl;
                    }
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {formData.attachmentName}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#16A34A', fontWeight: 600, marginTop: '2px' }}>
                    ✓ Screenshot proof attached (saved in cloud storage)
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={handleRemoveAttachment}
                  disabled={isUploading}
                  style={{ background: '#FEE2E2', border: '1px solid #FECACA', color: '#DC2626', padding: '5px 10px', borderRadius: '5px', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 700 }}
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="modal-footer-qa">
            <button type="button" className="btn-cancel-qa" onClick={onClose} disabled={isUploading}>
              Cancel
            </button>
            <button type="submit" className="btn-submit-qa btn-danger-action" disabled={isUploading}>
              {isUploading ? <Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> : <AlertCircle size={16} />}
              <span>{isUploading ? 'Uploading Image...' : 'Add Issue & Mark Fail'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
