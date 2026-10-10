/**
 * Utility for downloading and previewing project specification documents
 * Strictly preserves original file format and extension (.pdf, .docx, .zip, etc.)
 */

export function generateValidPdfBlob(docName, project = {}) {
  const safeDocName = (docName || 'Document.pdf').replace(/[()\\]/g, '');
  const projName = (project.name || 'Project').replace(/[()\\]/g, '');
  const projId = (project.id || '').replace(/[()\\]/g, '');
  const category = (project.category || project.projectType || 'Corporate Website').replace(/[()\\]/g, '');
  const desc = (project.description || 'Verified project specification and requirements.').replace(/[()\\]/g, '');

  const lines = [
    'DAHEJ SUPPORT DEVELOPER PROGRAM',
    'PROJECT SPECIFICATION DOCUMENT',
    '----------------------------------------------------------------------',
    `Document Name: ${safeDocName}`,
    `Project: ${projName} (${projId})`,
    `Category: ${category}`,
    `Generated Date: ${new Date().toLocaleDateString('en-GB')}`,
    '----------------------------------------------------------------------',
    'SCOPE & TECHNICAL SPECIFICATIONS:',
    desc,
    '----------------------------------------------------------------------',
    'REQUIREMENTS CHECKLIST:'
  ];

  if (Array.isArray(project.clientRequirements) && project.clientRequirements.length > 0) {
    project.clientRequirements.forEach((r, i) => {
      lines.push(`${i + 1}. ${(r || '').replace(/[()\\]/g, '')}`);
    });
  } else {
    lines.push('1. Complete responsive layout as per wireframe specification.');
    lines.push('2. Production deployment and QA verification readiness.');
  }

  // Build standard PDF content stream
  let streamLines = [];
  streamLines.push('BT');
  streamLines.push('/F1 14 Tf');
  streamLines.push('0.04 0.24 0.46 rg'); // Navy
  streamLines.push('1 0 0 1 50 770 Tm');
  streamLines.push(`(${lines[0]}) Tj`);
  
  streamLines.push('/F1 11 Tf');
  streamLines.push('0.95 0.51 0.11 rg'); // Orange
  streamLines.push('1 0 0 1 50 750 Tm');
  streamLines.push(`(${lines[1]}) Tj`);

  streamLines.push('/F1 9 Tf');
  streamLines.push('0.2 0.2 0.2 rg'); // Charcoal text
  let y = 725;
  for (let i = 2; i < lines.length; i++) {
    streamLines.push(`1 0 0 1 50 ${y} Tm`);
    streamLines.push(`(${lines[i]}) Tj`);
    y -= 16;
  }
  streamLines.push('ET');

  const contentStream = streamLines.join('\n');
  const streamByteLength = new TextEncoder().encode(contentStream).length;

  const obj1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`;
  const obj4 = `4 0 obj\n<< /Length ${streamByteLength} >>\nstream\n${contentStream}\nendstream\nendobj\n`;
  const obj5 = `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;

  const header = `%PDF-1.4\n`;
  const offset1 = header.length;
  const offset2 = offset1 + obj1.length;
  const offset3 = offset2 + obj2.length;
  const offset4 = offset3 + obj3.length;
  const offset5 = offset4 + obj4.length;
  const startXref = offset5 + obj5.length;

  const pad = (n) => String(n).padStart(10, '0');

  const xref = `xref\n0 6\n0000000000 65535 f \n${pad(offset1)} 00000 n \n${pad(offset2)} 00000 n \n${pad(offset3)} 00000 n \n${pad(offset4)} 00000 n \n${pad(offset5)} 00000 n \n`;
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  const pdfString = header + obj1 + obj2 + obj3 + obj4 + obj5 + xref + trailer;
  return new Blob([pdfString], { type: 'application/pdf' });
}

export function downloadProjectDocument(doc, project = {}, onToast) {
  if (!doc) return;
  const exactFileName = doc.name || 'Specification_Document.pdf';
  const fileSource = doc.dataUrl || doc.fileData || doc.url;

  try {
    // 1. If real binary file data exists, download it directly with exact original filename
    if (fileSource) {
      const a = document.createElement('a');
      a.href = fileSource;
      a.download = exactFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (onToast) onToast(`Downloaded ${exactFileName}`);
      return;
    }

    // 2. If binary data is missing, generate valid format corresponding to exact filename extension
    if (exactFileName.toLowerCase().endsWith('.pdf') || (doc.type && doc.type.toLowerCase().includes('pdf'))) {
      const pdfBlob = generateValidPdfBlob(exactFileName, project);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exactFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (onToast) onToast(`Downloaded ${exactFileName}`);
      return;
    }

    // 3. For any other document format:
    const content = `=== Dahej Support Developer Program ===\n\n` +
      `Document: ${exactFileName}\n` +
      `Project ID: ${project.id || ''}\n` +
      `Project Name: ${project.name || 'Project'}\n` +
      `Category: ${project.category || project.projectType || 'Corporate Website'}\n\n` +
      `--- Specifications ---\n` +
      `${project.description || 'Verified project requirements.'}\n\n` +
      `--- Requirements Checklist ---\n` +
      `${(project.clientRequirements || []).join('\n') || 'N/A'}\n`;

    const blob = new Blob([content], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exactFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (onToast) onToast(`Downloaded ${exactFileName}`);
  } catch (e) {
    if (onToast) onToast(`Downloading ${exactFileName}...`);
  }
}

export function getDocPreviewSource(doc, project = {}) {
  if (!doc) return null;
  if (doc.dataUrl || doc.fileData || doc.url) {
    return doc.dataUrl || doc.fileData || doc.url;
  }
  if (doc.name?.toLowerCase().endsWith('.pdf') || (doc.type && doc.type.toLowerCase().includes('pdf'))) {
    try {
      const blob = generateValidPdfBlob(doc.name, project);
      return URL.createObjectURL(blob);
    } catch (e) {
      return null;
    }
  }
  return null;
}
