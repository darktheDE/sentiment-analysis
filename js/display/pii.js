// ================================
// Display PII Detection
// ================================

import { elements } from '../dom.js';
import { escapeHtml } from '../ui/state.js';

export function displayPII(data) {
    if (!elements.piiContainer) return;
    
    const piiEntities = Array.isArray(data.detectedPiiEntities) ? data.detectedPiiEntities : [];
    
    if (piiEntities.length === 0) {
        elements.piiContainer.innerHTML = '<p>[OK] Không phát hiện thông tin cá nhân.</p>';
        return;
    }
    
    let html = '<div class="pii-warning">[!] Đã phát hiện thông tin cá nhân trong văn bản!</div>';
    html += '<div class="pii-list">';
    
    piiEntities.forEach(pii => {
        const scoreValue = parseFloat(pii.score || pii.Score) || 0;
        const score = scoreValue * 100;
        const displayScore = score < 1 ? score.toFixed(1) : Math.round(score);
        const type = pii.type || pii.Type || 'UNKNOWN';
        
        html += `<span class="pii-tag">${type} (${displayScore}%)</span>`;
    });
    
    html += '</div>';
    
    // Redacted text
    if (data.redactedEnglishText) {
        html += `
            <details style="margin-top: 15px;">
                <summary>Xem văn bản đã che thông tin cá nhân</summary>
                <pre>${escapeHtml(data.redactedEnglishText)}</pre>
            </details>
        `;
    }
    
    elements.piiContainer.innerHTML = html;
}
