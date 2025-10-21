// Display Sentiment Breakdown
import { elements } from '../dom.js';

const SENTIMENTS = [
    { key: 'Positive', label: 'Tích cực', class: 'positive' },
    { key: 'Negative', label: 'Tiêu cực', class: 'negative' },
    { key: 'Neutral', label: 'Trung tính', class: 'neutral' },
    { key: 'Mixed', label: 'Hỗn hợp', class: 'mixed' }
];

export function displaySentiment(data) {
    const scores = data.sentimentScores || {};
    
    let html = '';
    SENTIMENTS.forEach(sentiment => {
        const scoreValue = parseFloat(scores[sentiment.key]) || 0;
        const percentage = scoreValue * 100;
        const displayValue = percentage < 0.1 ? '0.0' : percentage.toFixed(1);
        
        html += `
            <div class="sentiment-bar">
                <div class="sentiment-bar-header">
                    <span class="sentiment-bar-label">${sentiment.label}</span>
                    <span class="sentiment-bar-value">${displayValue}%</span>
                </div>
                <div class="sentiment-bar-track">
                    <div class="sentiment-bar-fill ${sentiment.class}" 
                         data-width="${percentage}"></div>
                </div>
            </div>
        `;
    });
    
    elements.sentimentBreakdown.innerHTML = html;
    
    // Animate bars
    setTimeout(() => {
        document.querySelectorAll('.sentiment-bar-fill').forEach(bar => {
            bar.style.width = bar.dataset.width + '%';
        });
    }, 100);
}