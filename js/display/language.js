// ================================
// Display Language Info & Translation
// ================================

import { elements } from '../dom.js';
import { escapeHtml } from '../ui/state.js';

export function displayLanguageInfo(data) {
    if (!elements.languageInfo) return;
    
    let html = '<div class="language-info-wrapper">';
    
    // Detected language
    if (data.detectedLanguage) {
        html += `
            <div class="language-detected">
                <svg class="language-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <span>Ngôn ngữ phát hiện: <strong>${data.detectedLanguage.toUpperCase()}</strong></span>
            </div>
        `;
    }
    
    // Translation info
    if (data.translationInfo || data.translatedText) {
        let fromLang = data.detectedLanguage ? data.detectedLanguage.toUpperCase() : 'UNKNOWN';
        let toLang = data.targetLanguage ? data.targetLanguage.toUpperCase() : 'EN';
        
        if (data.translationInfo) {
            const match = data.translationInfo.match(/from '(\w+)' to '(\w+)'/i);
            if (match) {
                fromLang = match[1].toUpperCase();
                toLang = match[2].toUpperCase();
            }
        }
        
        html += `
            <div class="language-translation-header">
                <svg class="language-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="17 1 21 5 17 9"/>
                    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                    <polyline points="7 23 3 19 7 15"/>
                    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                </svg>
                <span>Đã dịch từ <strong>${fromLang}</strong> sang <strong>${toLang}</strong> để phân tích</span>
            </div>
        `;
        
        // Original and translated texts
        const hasOriginal = data.originalText || data.original_text;
        const hasTranslated = data.analyzedTextInEnglish || data.translatedText || data.translated_text;
        
        if (hasOriginal || hasTranslated) {
            html += '<div class="translation-texts">';
            
            if (hasOriginal) {
                const originalText = data.originalText || data.original_text;
                const truncated = originalText.length > 300 ? originalText.substring(0, 300) + '...' : originalText;
                html += `
                    <div class="translation-text-box original">
                        <div class="text-label">
                            <svg class="text-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                            </svg>
                            Văn bản gốc (${fromLang}):
                        </div>
                        <div class="text-content">${escapeHtml(truncated)}</div>
                    </div>
                `;
            }
            
            if (hasTranslated) {
                const translatedText = data.analyzedTextInEnglish || data.translatedText || data.translated_text;
                const truncated = translatedText.length > 300 ? translatedText.substring(0, 300) + '...' : translatedText;
                html += `
                    <div class="translation-text-box translated">
                        <div class="text-label">
                            <svg class="text-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                            </svg>
                            Văn bản đã dịch (${toLang}):
                        </div>
                        <div class="text-content">${escapeHtml(truncated)}</div>
                    </div>
                `;
            }
            
            html += '</div>';
        }
    }
    
    html += '</div>';
    
    if (!data.detectedLanguage && !data.translationInfo && !data.translatedText) {
        html = '<p>Không có thông tin ngôn ngữ.</p>';
    }
    
    elements.languageInfo.innerHTML = html;
}
