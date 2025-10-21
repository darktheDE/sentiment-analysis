// Text Analysis API
import { showLoading, showError } from '../ui/state.js';
import { displayResults } from '../display/index.js';

const MAX_TEXT_BYTES = 5000;

export async function analyzeText(text) {
    // Validation
    if (!text.trim()) {
        alert('Vui lòng nhập văn bản cần phân tích!');
        return;
    }
    
    // Check size
    const textSizeInBytes = new Blob([text]).size;
    if (textSizeInBytes > MAX_TEXT_BYTES) {
        alert(`Văn bản quá dài (${textSizeInBytes} bytes). Giới hạn: ${MAX_TEXT_BYTES} bytes.`);
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(API_ENDPOINT_TEXT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error ${response.status}`);
        }
        
        const data = await response.json();
        displayResults(data);
        
    } catch (error) {
        console.error('Text analysis error:', error);
        showError(error.message);
    }
}