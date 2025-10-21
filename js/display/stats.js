// Display Stats Cards
import { elements } from '../dom.js';
import { animateNumber } from '../ui/state.js';

const SENTIMENT_ICONS = {
    'POSITIVE': '😊',
    'NEGATIVE': '😢',
    'NEUTRAL': '😐',
    'MIXED': '😕'
};

export function displayStats(data) {
    // Sentiment
    const sentiment = data.sentiment || 'UNKNOWN';
    const score = getSentimentScore(data.sentimentScores, sentiment);
    
    elements.sentimentIcon.textContent = SENTIMENT_ICONS[sentiment] || '?';
    animateNumber(elements.sentimentValue, 0, Math.round(score), 1000, '%');
    
    // Entities
    const entities = Array.isArray(data.detectedEntities) ? data.detectedEntities : [];
    animateNumber(elements.entitiesCount, 0, entities.length, 1000);
    
    // Key phrases
    const phrases = Array.isArray(data.detectedKeyPhrases) ? data.detectedKeyPhrases : [];
    animateNumber(elements.phrasesCount, 0, phrases.length, 1000);
}

function getSentimentScore(scores, sentiment) {
    if (!scores) return 0;
    const key = sentiment.charAt(0).toUpperCase() + sentiment.slice(1).toLowerCase();
    return (parseFloat(scores[key]) || 0) * 100;
}