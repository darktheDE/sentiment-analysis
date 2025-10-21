// Display Results - Main Entry Point
import { elements } from '../dom.js';
import { showResults } from '../ui/state.js';
import { displayStats } from './stats.js';
import { displaySentiment } from './sentiment.js';
import { displayEntities } from './entities.js';
import { displayKeyPhrases } from './keyphrases.js';
import { displayLanguageInfo } from './language.js';
import { displayPII } from './pii.js';
import { displaySyntax } from './syntax.js';
import { displayToxicity } from './toxicity.js';

export function displayResults(data) {
    console.log('Displaying results:', data);
    
    // Store for debugging
    window.lastAnalysisData = data;
    
    // Show results section
    showResults();
    
    // Display all components
    displayStats(data);
    displaySentiment(data);
    displayEntities(data);
    displayKeyPhrases(data);
    displayLanguageInfo(data);
    displayPII(data);
    displaySyntax(data);
    displayToxicity(data);
    
    // Scroll to results
    elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}