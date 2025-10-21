// ================================
// Display Syntax Analysis
// ================================

import { elements } from '../dom.js';
import { escapeHtml } from '../ui/state.js';

// POS tags in Vietnamese
const POS_TAG_VIETNAMESE = {
    'ADJ': 'Tính từ',
    'ADP': 'Giới từ',
    'ADV': 'Trạng từ',
    'AUX': 'Trợ động từ',
    'CCONJ': 'Liên từ đẳng lập',
    'DET': 'Từ hạn định',
    'INTJ': 'Thán từ',
    'NOUN': 'Danh từ',
    'NUM': 'Số từ',
    'PART': 'Tiểu từ',
    'PRON': 'Đại từ',
    'PROPN': 'Danh từ riêng',
    'PUNCT': 'Dấu câu',
    'SCONJ': 'Liên từ phụ thuộc',
    'SYM': 'Ký hiệu',
    'VERB': 'Động từ',
    'X': 'Khác',
    'UNKNOWN': 'Không xác định'
};

export function displaySyntax(data) {
    if (!elements.syntaxContainer) return;
    
    const syntax = Array.isArray(data.syntaxAnalysis) ? data.syntaxAnalysis : [];
    
    if (syntax.length === 0) {
        elements.syntaxContainer.innerHTML = '<p>Không có dữ liệu phân tích cú pháp.</p>';
        return;
    }
    
    // Show first 15 tokens only
    const first15 = syntax.slice(0, 15);
    
    let html = '<div class="syntax-list">';
    first15.forEach(token => {
        const text = token.text || token.Text || '';
        
        // Handle different formats
        let pos = 'UNKNOWN';
        const posValue = token.partOfSpeech || token.PartOfSpeech;
        
        if (typeof posValue === 'string') {
            pos = posValue;
        } else if (typeof posValue === 'object' && posValue !== null) {
            pos = posValue.Tag || posValue.tag || 'UNKNOWN';
        }
        
        const posVietnamese = POS_TAG_VIETNAMESE[pos] || pos;
        html += `<span class="syntax-token"><strong>${escapeHtml(text)}</strong>: ${posVietnamese}</span>`;
    });
    html += '</div>';
    
    if (syntax.length > 15) {
        html += `<p class="text-muted">... và ${syntax.length - 15} từ khác</p>`;
    }
    
    elements.syntaxContainer.innerHTML = html;
}
