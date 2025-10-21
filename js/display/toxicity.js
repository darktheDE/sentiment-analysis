// ================================
// Display Toxicity Analysis
// ================================

import { elements } from '../dom.js';

// Toxicity labels in Vietnamese
const TOXICITY_LABEL_VIETNAMESE = {
    'PROFANITY': 'Lời nói tục tĩu',
    'HATE_SPEECH': 'Phát ngôn thù hận',
    'INSULT': 'Xúc phạm',
    'GRAPHIC': 'Nội dung bạo lực hình ảnh',
    'HARASSMENT_OR_ABUSE': 'Quấy rối hoặc lạm dụng',
    'SEXUAL': 'Nội dung tình dục',
    'VIOLENCE_OR_THREAT': 'Bạo lực hoặc đe dọa'
};

export function displayToxicity(data) {
    if (!elements.toxicityContainer) return;
    
    const toxicity = Array.isArray(data.toxicityAnalysis) ? data.toxicityAnalysis : [];
    
    if (toxicity.length === 0) {
        elements.toxicityContainer.innerHTML = '<p>[OK] Không phát hiện nội dung độc hại.</p>';
        return;
    }
    
    let html = '';
    toxicity.forEach(item => {
        const name = item.Name || 'UNKNOWN';
        const nameVietnamese = TOXICITY_LABEL_VIETNAMESE[name] || name;
        
        const scoreValue = parseFloat(item.Score) || 0;
        const percentage = scoreValue * 100;
        const displayValue = percentage < 1 ? percentage.toFixed(1) : Math.round(percentage);
        const severity = scoreValue > 0.7 ? 'high' : scoreValue > 0.4 ? 'medium' : 'low';
        
        html += `
            <div class="toxicity-item ${severity}">
                <span class="toxicity-label">${nameVietnamese}</span>
                <div class="toxicity-bar">
                    <div class="toxicity-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
                <span class="toxicity-value">${displayValue}%</span>
            </div>
        `;
    });
    
    elements.toxicityContainer.innerHTML = html;
}
