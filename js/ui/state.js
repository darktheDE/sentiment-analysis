// UI State Management
import { elements } from '../dom.js';

// Show loading state
export function showLoading() {
    elements.textInput.disabled = true;
    elements.analyzeButton.disabled = true;
    elements.resultsSection.classList.add('hidden');
    elements.errorMessage.classList.add('hidden');
    elements.loadingMessage.classList.remove('hidden');
}

// Show results state
export function showResults() {
    elements.loadingMessage.classList.add('hidden');
    elements.resultsSection.classList.remove('hidden');
    elements.textInput.disabled = false;
    elements.analyzeButton.disabled = false;
}

// Show error state
export function showError(message) {
    elements.loadingMessage.classList.add('hidden');
    elements.errorText.textContent = message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
    elements.errorMessage.classList.remove('hidden');
    elements.textInput.disabled = false;
    elements.analyzeButton.disabled = false;
}

// Utility: Escape HTML
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Utility: Animate number
export function animateNumber(element, start, end, duration, suffix = '') {
    const startTime = Date.now();
    const range = end - start;
    
    function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + range * easeOut);
        
        element.textContent = current + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = Math.round(end) + suffix;
        }
    }
    
    update();
}