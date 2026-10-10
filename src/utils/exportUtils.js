/**
 * Utility functions for exporting data to Excel / CSV format
 * Includes UTF-8 BOM for full Microsoft Excel compatibility
 */

export function exportToCSV(filename, headers, rows) {
  if (!rows || !rows.length) {
    alert('No data available to export.');
    return;
  }

  // Format header row
  const headerLine = headers.map(h => escapeCSVField(h.label)).join(',');

  // Format data rows
  const dataLines = rows.map(row => {
    return headers.map(h => {
      let value = '';
      if (typeof h.key === 'function') {
        value = h.key(row);
      } else {
        value = row[h.key] !== undefined && row[h.key] !== null ? row[h.key] : '';
      }
      return escapeCSVField(value);
    }).join(',');
  });

  // Prepend UTF-8 BOM (\uFEFF) for Excel compatibility with Unicode characters (like ₹ and accented letters)
  const csvContent = '\uFEFF' + [headerLine, ...dataLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${dateStr}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeCSVField(field) {
  if (field === null || field === undefined) return '""';
  const str = String(field);
  // If field contains comma, quote, or newline, escape quotes and wrap in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}
