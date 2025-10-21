// ================================
// Display Key Phrases
// ================================

import { elements } from '../dom.js';
import { escapeHtml } from '../ui/state.js';

export function displayKeyPhrases(data) {
    const keyPhrases = Array.isArray(data.detectedKeyPhrases) ? data.detectedKeyPhrases : [];
    
    if (keyPhrases.length === 0) {
        elements.keyphrasesContainer.innerHTML = '<p>Không tìm thấy cụm từ khóa nào.</p>';
        return;
    }
    
    let html = '<div class="keyphrases-list">';
    
    keyPhrases.forEach(phrase => {
        const text = phrase.text || phrase.Text || '';
        html += `<span class="phrase-tag"><span>${escapeHtml(text)}</span></span>`;
    });
    
    html += '</div>';
    elements.keyphrasesContainer.innerHTML = html;
}
