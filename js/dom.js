// DOM Element References
export const elements = {
    // Input elements
    textInput: document.getElementById('text-input'),
    imageInput: document.getElementById('image-input'),
    imageInputContainer: document.getElementById('image-input-container'),
    analyzeButton: document.getElementById('analyze-button'),
    
    // Tab elements
    tabButtons: document.querySelectorAll('.tab-button'),
    
    // State elements
    loadingMessage: document.getElementById('loading-message'),
    resultsSection: document.getElementById('results-section'),
    errorMessage: document.getElementById('error-message'),
    errorText: document.getElementById('error-text'),
    retryButton: document.getElementById('retry-button'),
    
    // Stats cards
    sentimentIcon: document.getElementById('sentiment-icon'),
    sentimentValue: document.getElementById('sentiment-value'),
    entitiesCount: document.getElementById('entities-count'),
    phrasesCount: document.getElementById('phrases-count'),
    
    // Results containers
    sentimentBreakdown: document.getElementById('sentiment-breakdown'),
    entitiesContainer: document.getElementById('entities-container'),
    keyphrasesContainer: document.getElementById('keyphrases-container'),
    languageInfo: document.getElementById('language-info'),
    piiContainer: document.getElementById('pii-container'),
    syntaxContainer: document.getElementById('syntax-container'),
    toxicityContainer: document.getElementById('toxicity-container')
};