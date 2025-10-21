// ================================
// Tab Switching Module
// ================================

import { elements } from '../dom.js';

// Export current mode state
export let currentMode = 'text';

// Tab switching handler
export function handleTabSwitch(e) {
    const button = e.target.closest('.tab-button');
    if (!button) return;
    
    const tab = button.dataset.tab;
    
    // Update active tab UI
    elements.tabButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    // Update mode
    currentMode = tab;
    
    // Show/hide appropriate input
    if (tab === 'text') {
        elements.textInput.classList.remove('hidden');
        elements.imageInputContainer.classList.add('hidden');
    } else {
        elements.textInput.classList.add('hidden');
        elements.imageInputContainer.classList.remove('hidden');
    }
    
    // Hide results and errors
    elements.resultsSection.classList.add('hidden');
    elements.errorMessage.classList.add('hidden');
    
    return currentMode;
}
