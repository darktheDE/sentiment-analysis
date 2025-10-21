// Main Application Entry Point
import { elements } from './dom.js';
import { analyzeText } from './api/text-analysis.js';
import { analyzeImage } from './api/image-analysis.js';
import { handleTabSwitch } from './ui/tabs.js';
import { handleImageSelect, initDragAndDrop } from './ui/file-upload.js';
import { exportResultsAsJSON } from './ui/export.js';

// Constants
const EXAMPLE_TEXT = "Amazon Web Services is a great cloud platform. Jeff Bezos is the founder of Amazon, which is headquartered in Seattle.";

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
    
    // Initialize drag & drop for images
    initDragAndDrop();
    
    // Export JSON button
    const exportButton = document.getElementById('export-json-button');
    if (exportButton) {
        exportButton.addEventListener('click', exportResultsAsJSON);
    }
    
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
        let textToAnalyze = elements.textInput.value.trim();
        
        // Nếu không nhập gì, dùng example text
        if (!textToAnalyze) {
            textToAnalyze = EXAMPLE_TEXT;
            elements.textInput.value = EXAMPLE_TEXT;
            console.log('[!] Không có văn bản → dùng example text');
        }
        
        await analyzeText(textToAnalyze);
    } else {
        await analyzeImage(selectedFile);
    }
}

// Start app
init();