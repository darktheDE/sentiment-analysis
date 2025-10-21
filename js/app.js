// Main Application Entry Point
import { elements } from './dom.js';
import { analyzeText } from './api/text-analysis.js';
import { analyzeImage } from './api/image-analysis.js';
import { handleTabSwitch } from './ui/tabs.js';
import { handleImageSelect } from './ui/file-upload.js';

// Application state
let currentMode = 'text';
let selectedFile = null;

// Initialize event listeners
function init() {
    // Analyze button
    elements.analyzeButton.addEventListener('click', handleAnalyze);
    elements.retryButton.addEventListener('click', handleAnalyze);
    
    // Tabs
    elements.tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentMode = handleTabSwitch(e);
        });
    });
    
    // Image upload
    elements.imageInput.addEventListener('change', (e) => {
        selectedFile = handleImageSelect(e);
    });
    
    // Keyboard shortcut: Ctrl + Enter
    elements.textInput.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            handleAnalyze();
        }
    });
    
    console.log('✅ Sentiment Analysis App initialized');
}

// Main analysis handler
async function handleAnalyze() {
    if (currentMode === 'text') {
        await analyzeText(elements.textInput.value.trim());
    } else {
        await analyzeImage(selectedFile);
    }
}

// Start app
init();