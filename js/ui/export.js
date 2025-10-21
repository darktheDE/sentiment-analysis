// ================================
// Export Module - Export results to JSON
// ================================

let cachedResults = null;

// Cache results for export
export function cacheResultsForExport(data) {
    cachedResults = {
        timestamp: new Date().toISOString(),
        ...data
    };
}

// Export results as JSON
export function exportResultsAsJSON() {
    if (!cachedResults) {
        alert('Chưa có kết quả phân tích nào để xuất.');
        return;
    }
    
    const jsonString = JSON.stringify(cachedResults, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentiment-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('[OK] Exported results as JSON');
    
    // Show success message
    showExportSuccess();
}

// Show export success toast
function showExportSuccess() {
    const toast = document.createElement('div');
    toast.className = 'export-toast';
    toast.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Đã xuất kết quả thành công!</span>
    `;
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}
