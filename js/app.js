// ================================
// Sentiment Analysis App - Main Logic
// ================================

// ================================
// 1. LẤY CÁC PHẦN TỬ HTML
// ================================
const textInput = document.getElementById('text-input');
const analyzeButton = document.getElementById('analyze-button');
const loadingMessage = document.getElementById('loading-message');
const resultsSection = document.getElementById('results-section');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const resetButton = document.getElementById('reset-button');
const retryButton = document.getElementById('retry-button');

// Elements cho stats cards
const sentimentIcon = document.getElementById('sentiment-icon');
const sentimentValue = document.getElementById('sentiment-value');
const entitiesCount = document.getElementById('entities-count');
const phrasesCount = document.getElementById('phrases-count');

// Elements cho detailed results
const sentimentBreakdown = document.getElementById('sentiment-breakdown');
const entitiesContainer = document.getElementById('entities-container');
const keyphrasesContainer = document.getElementById('keyphrases-container');

// ================================
// 2. THÊM EVENT LISTENERS
// ================================
analyzeButton.addEventListener('click', handleAnalyze);
resetButton.addEventListener('click', resetApp);
retryButton.addEventListener('click', handleAnalyze);

// Shortcut: Ctrl + Enter để phân tích
textInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        handleAnalyze();
    }
});

// ================================
// 3. HÀM CHÍNH: XỬ LÝ PHÂN TÍCH
// ================================
async function handleAnalyze() {
    // Lấy text từ textarea
    const text = textInput.value.trim();
    
    // Kiểm tra xem có text không
    if (!text) {
        alert('⚠️ Vui lòng nhập văn bản cần phân tích!');
        textInput.focus();
        return;
    }
    
    // Hiển thị loading, ẩn results và errors
    showLoading();
    
    try {
        // Lambda expects: {"text": "your text here"}
        const requestPayload = {
            text: text
        };
        
        console.log('📤 Sending request:', requestPayload);
        
        // Gọi API
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestPayload)
        });
        
        // Kiểm tra response
        if (!response.ok) {
            // Log chi tiết lỗi
            const errorText = await response.text();
            console.error('❌ API Error Response:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            throw new Error(`API Error: ${response.status} - ${errorText.substring(0, 100)}`);
        }
        
        // Parse JSON
        const data = await response.json();
        console.log('✅ Response data:', data);
        
        // Hiển thị kết quả
        displayResults(data);
        
    } catch (error) {
        // Xử lý lỗi
        console.error('Error:', error);
        showError(error.message);
    }
}

// ================================
// 4. HIỂN thị KẾT QUẢ
// ================================
function displayResults(data) {
    // Ẩn loading
    loadingMessage.classList.add('hidden');
    
    // Hiển thị results section
    resultsSection.classList.remove('hidden');
    
    // Hiển thị stats cards
    displayStats(data);
    
    // Hiển thị sentiment breakdown
    displaySentiment(data);
    
    // Hiển thị entities
    displayEntities(data);
    
    // Hiển thị key phrases
    displayKeyPhrases(data);
    
    // Scroll xuống results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ================================
// 5. HIỂN THỊ STATS CARDS
// ================================
function displayStats(data) {
    // Sentiment
    const sentiment = data.sentiment || 'UNKNOWN';
    const sentimentScore = getSentimentScore(data.scores, sentiment);
    
    // Icons cho từng sentiment
    const icons = {
        'POSITIVE': '😊',
        'NEGATIVE': '😢',
        'NEUTRAL': '😐',
        'MIXED': '😕'
    };
    
    sentimentIcon.textContent = icons[sentiment] || '❓';
    
    // Animate số từ 0 lên target value
    animateNumber(sentimentValue, 0, sentimentScore, 1000);
    sentimentValue.textContent = Math.round(sentimentScore) + '%';
    
    // Entities count
    const entitiesLength = data.entities ? data.entities.length : 0;
    animateNumber(entitiesCount, 0, entitiesLength, 1000);
    
    // Key phrases count
    const phrasesLength = data.keyPhrases ? data.keyPhrases.length : 0;
    animateNumber(phrasesCount, 0, phrasesLength, 1000);
}

// ================================
// 6. HIỂN THỊ SENTIMENT BREAKDOWN
// ================================
function displaySentiment(data) {
    const scores = data.scores || {};
    
    // Tạo HTML cho mỗi sentiment bar
    const sentiments = [
        { key: 'Positive', label: 'Tích cực', class: 'positive' },
        { key: 'Negative', label: 'Tiêu cực', class: 'negative' },
        { key: 'Neutral', label: 'Trung tính', class: 'neutral' },
        { key: 'Mixed', label: 'Hỗn hợp', class: 'mixed' }
    ];
    
    let html = '';
    
    sentiments.forEach(sentiment => {
        const score = scores[sentiment.key] || 0;
        const percentage = (score * 100).toFixed(1);
        
        html += `
            <div class="sentiment-bar">
                <div class="sentiment-bar-header">
                    <span class="sentiment-bar-label">${sentiment.label}</span>
                    <span class="sentiment-bar-value">${percentage}%</span>
                </div>
                <div class="sentiment-bar-track">
                    <div class="sentiment-bar-fill ${sentiment.class}" 
                         data-width="${percentage}"></div>
                </div>
            </div>
        `;
    });
    
    sentimentBreakdown.innerHTML = html;
    
    // Animate bars sau khi render
    setTimeout(() => {
        document.querySelectorAll('.sentiment-bar-fill').forEach(bar => {
            bar.style.width = bar.dataset.width + '%';
        });
    }, 100);
}

// ================================
// 7. HIỂN THỊ ENTITIES (BẢNG)
// ================================
function displayEntities(data) {
    const entities = data.entities || [];
    
    if (entities.length === 0) {
        entitiesContainer.innerHTML = '<p>Không tìm thấy thực thể nào.</p>';
        return;
    }
    
    // Tạo bảng HTML
    let html = `
        <table class="entities-table">
            <thead>
                <tr>
                    <th>Văn bản</th>
                    <th>Loại</th>
                    <th>Độ tin cậy</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    entities.forEach(entity => {
        const score = (entity.score * 100).toFixed(1);
        html += `
            <tr>
                <td><strong>${escapeHtml(entity.text)}</strong></td>
                <td><span class="entity-type">${entity.type}</span></td>
                <td>${score}%</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    entitiesContainer.innerHTML = html;
}

// ================================
// 8. HIỂN THỊ KEY PHRASES (TAGS)
// ================================
function displayKeyPhrases(data) {
    const keyPhrases = data.keyPhrases || [];
    
    if (keyPhrases.length === 0) {
        keyphrasesContainer.innerHTML = '<p>Không tìm thấy cụm từ khóa nào.</p>';
        return;
    }
    
    // Tạo tags HTML
    let html = '<div class="keyphrases-list">';
    
    keyPhrases.forEach(phrase => {
        const score = (phrase.score * 100).toFixed(0);
        html += `
            <span class="phrase-tag">
                <span>${escapeHtml(phrase.text)}</span>
                <span class="phrase-score">${score}%</span>
            </span>
        `;
    });
    
    html += '</div>';
    
    keyphrasesContainer.innerHTML = html;
}

// ================================
// 9. UTILITY FUNCTIONS
// ================================

// Lấy sentiment score cao nhất
function getSentimentScore(scores, sentiment) {
    if (!scores) return 0;
    const key = sentiment.charAt(0).toUpperCase() + sentiment.slice(1).toLowerCase();
    return (scores[key] || 0) * 100;
}

// Animate số từ start đến end
function animateNumber(element, start, end, duration) {
    const startTime = Date.now();
    const range = end - start;
    
    function update() {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + range * easeOut);
        
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = end;
        }
    }
    
    update();
}

// Escape HTML để tránh XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ================================
// 10. UI STATE MANAGEMENT
// ================================

// Hiển thị loading
function showLoading() {
    // Disable input và button
    textInput.disabled = true;
    analyzeButton.disabled = true;
    
    // Ẩn results và errors
    resultsSection.classList.add('hidden');
    errorMessage.classList.add('hidden');
    
    // Hiển thị loading
    loadingMessage.classList.remove('hidden');
}

// Hiển thị error
function showError(message) {
    // Ẩn loading
    loadingMessage.classList.add('hidden');
    
    // Enable lại input và button
    textInput.disabled = false;
    analyzeButton.disabled = false;
    
    // Hiển thị error message
    errorText.textContent = message || 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
    errorMessage.classList.remove('hidden');
    
    // Scroll đến error
    errorMessage.scrollIntoView({ behavior: 'smooth' });
}

// Reset app về trạng thái ban đầu
function resetApp() {
    // Clear input
    textInput.value = '';
    
    // Ẩn results và errors
    resultsSection.classList.add('hidden');
    errorMessage.classList.add('hidden');
    loadingMessage.classList.add('hidden');
    
    // Enable input và button
    textInput.disabled = false;
    analyzeButton.disabled = false;
    
    // Focus vào textarea
    textInput.focus();
    
    // Scroll lên đầu
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================================
// 11. KHỞI TẠO
// ================================
console.log('✅ App initialized successfully!');
console.log('💡 Tip: Press Ctrl + Enter to analyze text quickly');
