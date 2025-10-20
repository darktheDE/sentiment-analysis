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

// Elements cho tabs (MỚI - V2.0)
const tabButtons = document.querySelectorAll('.tab-button');
const imageInputContainer = document.getElementById('image-input-container');
const imageInput = document.getElementById('image-input');

// Elements cho stats cards
const sentimentIcon = document.getElementById('sentiment-icon');
const sentimentValue = document.getElementById('sentiment-value');
const entitiesCount = document.getElementById('entities-count');
const phrasesCount = document.getElementById('phrases-count');

// Elements cho detailed results
const sentimentBreakdown = document.getElementById('sentiment-breakdown');
const entitiesContainer = document.getElementById('entities-container');
const keyphrasesContainer = document.getElementById('keyphrases-container');

// Elements cho các trường mới (MỚI - V2.0)
const languageInfo = document.getElementById('language-info');
const piiContainer = document.getElementById('pii-container');
const syntaxContainer = document.getElementById('syntax-container');
const toxicityContainer = document.getElementById('toxicity-container');

// Biến lưu trạng thái
let currentMode = 'text'; // 'text' hoặc 'image'
let selectedFile = null;

// ================================
// 2. THÊM EVENT LISTENERS
// ================================
analyzeButton.addEventListener('click', handleAnalyze);
resetButton.addEventListener('click', resetApp);
retryButton.addEventListener('click', handleAnalyze);

// Tabs switching (MỚI - V2.0)
tabButtons.forEach(btn => {
    btn.addEventListener('click', handleTabSwitch);
});

// Image file selection (MỚI - V2.0)
imageInput.addEventListener('change', handleImageSelect);

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
    // Kiểm tra mode hiện tại
    if (currentMode === 'text') {
        await analyzeText();
    } else {
        await analyzeImage();
    }
}

// 3A. PHÂN TÍCH VĂN BẢN (Cập nhật endpoint - V2.0)
async function analyzeText() {
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
        // Backend V2.0 expects: {"text": "your text here"}
        const requestPayload = {
            text: text
        };
        
        // Tạo JSON string
        const jsonBody = JSON.stringify(requestPayload);
        
        console.log('📤 Sending text analysis request:');
        console.log('   Payload object:', requestPayload);
        console.log('   JSON string:', jsonBody);
        console.log('   JSON length:', jsonBody.length);
        
        // Gọi API mới: /analyze-text
        const response = await fetch(API_ENDPOINT_TEXT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: jsonBody,
            mode: 'cors' // Explicitly set CORS mode
        });
        
        console.log('📥 Response received:', {
            status: response.status,
            statusText: response.statusText,
            headers: [...response.headers.entries()]
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
        
        // Parse JSON - Sử dụng response.json() thay vì text + parse
        const data = await response.json();
        console.log('✅ Parsed response data:', data);
        
        // Hiển thị kết quả
        displayResults(data);
        
    } catch (error) {
        // Xử lý lỗi
        console.error('Error:', error);
        showError(error.message);
    }
}

// 3B. PHÂN TÍCH HÌNH ẢNH (MỚI - V2.0)
async function analyzeImage() {
    if (!selectedFile) {
        alert('⚠️ Vui lòng chọn ảnh cần phân tích!');
        return;
    }
    
    // Hiển thị loading
    showLoading();
    loadingMessage.querySelector('p').textContent = 'Uploading image and processing...';
    
    try {
        // Bước 1: Lấy upload URL từ backend
        console.log('📤 Step 1: Getting upload URL for:', selectedFile.name);
        const urlResponse = await fetch(
            `${API_ENDPOINT_GET_UPLOAD_URL}?fileName=${encodeURIComponent(selectedFile.name)}`
        );
        
        if (!urlResponse.ok) {
            throw new Error('Cannot get upload URL. Please try again.');
        }
        
        const { uploadURL, key } = await urlResponse.json();
        console.log('✅ Got upload URL, key:', key);
        
        // Bước 2: Upload ảnh trực tiếp lên S3
        console.log('📤 Step 2: Uploading image to S3...');
        loadingMessage.querySelector('p').textContent = 'Uploading image...';
        
        const uploadResponse = await fetch(uploadURL, {
            method: 'PUT',
            body: selectedFile
            // Không cần thêm headers khi dùng presigned URL
            // URL đã chứa tất cả thông tin cần thiết
        });
        
        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('❌ Upload failed:', {
                status: uploadResponse.status,
                statusText: uploadResponse.statusText,
                body: errorText
            });
            throw new Error(`Cannot upload image (${uploadResponse.status}). Please try again.`);
        }
        
        console.log('✅ Image uploaded successfully');
        
        // Bước 3: Poll kết quả từ backend
        loadingMessage.querySelector('p').textContent = 'Analyzing image... (may take 30-60 seconds)';
        await pollImageResult(key);
        
    } catch (error) {
        console.error('Image analysis error:', error);
        showError(error.message);
    }
}

// 3C. POLLING KẾT QUẢ PHÂN TÍCH ẢNH (MỚI - V2.0)
async function pollImageResult(imageKey, attempts = 0) {
    const maxAttempts = 30; // 30 lần x 3 giây = 90 giây
    const pollInterval = 3000; // 3 giây
    
    if (attempts >= maxAttempts) {
        showError('Processing timeout. Please try again or select another image.');
        return;
    }
    
    try {
        console.log(`🔍 Polling attempt ${attempts + 1}/${maxAttempts}...`);
        
        const response = await fetch(`${API_ENDPOINT_GET_RESULT}/${imageKey}`);
        
        if (response.status === 404) {
            // Backend vẫn đang xử lý
            const data = await response.json();
            if (data.status === 'PROCESSING') {
                console.log('⏳ Still processing, will retry in 3 seconds...');
                // Cập nhật loading message
                loadingMessage.querySelector('p').textContent = 
                    `Processing... (${attempts + 1}/${maxAttempts})`;
                
                // Thử lại sau 3 giây
                setTimeout(() => pollImageResult(imageKey, attempts + 1), pollInterval);
                return;
            }
        }
        
        if (!response.ok) {
            throw new Error(`Error getting result: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'COMPLETED') {
            console.log('✅ Image analysis completed:', data);
            displayResults(data);
        } else if (data.status === 'FAILED') {
            showError('Processing failed: ' + (data.error || 'Unknown error'));
        } else {
            // Trạng thái không xác định, thử lại
            setTimeout(() => pollImageResult(imageKey, attempts + 1), pollInterval);
        }
        
    } catch (error) {
        console.error('Polling error:', error);
        showError(error.message);
    }
}

// ================================
// 3D. XỬ LÝ TAB SWITCHING (MỚI - V2.0)
// ================================
function handleTabSwitch(e) {
    const tab = e.target.dataset.tab;
    
    // Cập nhật UI tabs
    tabButtons.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    // Cập nhật mode
    currentMode = tab;
    
    // Hiển thị input tương ứng
    if (tab === 'text') {
        textInput.classList.remove('hidden');
        imageInputContainer.classList.add('hidden');
    } else {
        textInput.classList.add('hidden');
        imageInputContainer.classList.remove('hidden');
    }
    
    // Reset lỗi và results
    resultsSection.classList.add('hidden');
    errorMessage.classList.add('hidden');
}

// ================================
// 3E. XỬ LÝ CHỌN FILE (MỚI - V2.0)
// ================================
function handleImageSelect(e) {
    const file = e.target.files[0];
    
    if (!file) {
        selectedFile = null;
        return;
    }
    
    // Kiểm tra file type
    if (!file.type.startsWith('image/')) {
        alert('⚠️ Vui lòng chọn file ảnh (JPG, PNG, HEIC)');
        e.target.value = '';
        selectedFile = null;
        return;
    }
    
    // Kiểm tra file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        alert('⚠️ Kích thước file quá lớn. Vui lòng chọn ảnh dưới 5MB.');
        e.target.value = '';
        selectedFile = null;
        return;
    }
    
    selectedFile = file;
    console.log('✅ File selected:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    
    // Cập nhật UI để hiển thị tên file
    const uploadText = document.querySelector('.upload-text');
    uploadText.textContent = `✓ Selected: ${file.name}`;
    uploadText.style.color = 'var(--success)';
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
    
    // Hiển thị các trường mới (V2.0)
    displayLanguageInfo(data);
    displayPII(data);
    displaySyntax(data);
    displayToxicity(data);
    
    // Scroll xuống results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ================================
// 5. HIỂN THỊ STATS CARDS
// ================================
function displayStats(data) {
    // Sentiment
    const sentiment = data.sentiment || 'UNKNOWN';
    const sentimentScore = getSentimentScore(data.sentimentScores, sentiment);
    
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
    
    // Entities count (Backend trả về detectedEntities)
    const entitiesLength = data.detectedEntities ? data.detectedEntities.length : 0;
    animateNumber(entitiesCount, 0, entitiesLength, 1000);
    
    // Key phrases count (Backend trả về detectedKeyPhrases)
    const phrasesLength = data.detectedKeyPhrases ? data.detectedKeyPhrases.length : 0;
    animateNumber(phrasesCount, 0, phrasesLength, 1000);
}

// ================================
// 6. HIỂN THỊ SENTIMENT BREAKDOWN
// ================================
function displaySentiment(data) {
    const scores = data.sentimentScores || {};
    
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
    const entities = data.detectedEntities || [];
    
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
                </tr>
            </thead>
            <tbody>
    `;
    
    entities.forEach(entity => {
        // Backend chỉ trả về {text, type}, không có score
        html += `
            <tr>
                <td><strong>${escapeHtml(entity.text)}</strong></td>
                <td><span class="entity-type">${entity.type}</span></td>
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
    const keyPhrases = data.detectedKeyPhrases || [];
    
    if (keyPhrases.length === 0) {
        keyphrasesContainer.innerHTML = '<p>Không tìm thấy cụm từ khóa nào.</p>';
        return;
    }
    
    // Tạo tags HTML
    let html = '<div class="keyphrases-list">';
    
    keyPhrases.forEach(phrase => {
        // Backend chỉ trả về {text}, không có score
        html += `
            <span class="phrase-tag">
                <span>${escapeHtml(phrase.text)}</span>
            </span>
        `;
    });
    
    html += '</div>';
    
    keyphrasesContainer.innerHTML = html;
}

// ================================
// 8A. HIỂN THỊ NGÔN NGỮ & DỊCH THUẬT (MỚI - V2.0)
// ================================
function displayLanguageInfo(data) {
    if (!languageInfo) return;
    
    let html = '';
    
    // Hiển thị ngôn ngữ phát hiện
    if (data.detectedLanguage) {
        html += `<p>🌐 Ngôn ngữ phát hiện: <strong>${data.detectedLanguage.toUpperCase()}</strong></p>`;
    }
    
    // Hiển thị thông tin dịch thuật
    if (data.translationInfo) {
        html += `<p>🔄 ${data.translationInfo}</p>`;
    }
    
    // Nếu không có thông tin gì
    if (!html) {
        html = '<p>Không có thông tin ngôn ngữ.</p>';
    }
    
    languageInfo.innerHTML = html;
}

// ================================
// 8B. HIỂN THỊ PII (MỚI - V2.0)
// ================================
function displayPII(data) {
    if (!piiContainer) return;
    
    const piiEntities = data.detectedPiiEntities || [];
    
    if (piiEntities.length === 0) {
        piiContainer.innerHTML = '<p>✅ Không phát hiện thông tin cá nhân.</p>';
        return;
    }
    
    let html = '<div class="pii-warning">⚠️ Đã phát hiện thông tin cá nhân trong văn bản!</div>';
    html += '<div class="pii-list">';
    
    piiEntities.forEach(pii => {
        const score = (pii.score * 100).toFixed(0);
        html += `<span class="pii-tag">${pii.type} (${score}%)</span>`;
    });
    
    html += '</div>';
    
    // Hiển thị văn bản đã che PII
    if (data.redactedEnglishText) {
        html += `
            <details style="margin-top: 15px;">
                <summary>📄 Xem văn bản đã che thông tin cá nhân</summary>
                <pre>${escapeHtml(data.redactedEnglishText)}</pre>
            </details>
        `;
    }
    
    piiContainer.innerHTML = html;
}

// ================================
// 8C. HIỂN THỊ SYNTAX (MỚI - V2.0)
// ================================
function displaySyntax(data) {
    if (!syntaxContainer) return;
    
    const syntax = data.syntaxAnalysis || [];
    
    if (syntax.length === 0) {
        syntaxContainer.innerHTML = '<p>Không có dữ liệu phân tích cú pháp.</p>';
        return;
    }
    
    // Chỉ lấy 15 từ đầu để không quá dài
    const first15 = syntax.slice(0, 15);
    
    let html = '<div class="syntax-list">';
    first15.forEach(token => {
        html += `<span class="syntax-token"><strong>${escapeHtml(token.text)}</strong>: ${token.partOfSpeech}</span>`;
    });
    html += '</div>';
    
    if (syntax.length > 15) {
        html += `<p class="text-muted">... và ${syntax.length - 15} từ khác</p>`;
    }
    
    syntaxContainer.innerHTML = html;
}

// ================================
// 8D. HIỂN THỊ TOXICITY (MỚI - V2.0)
// ================================
function displayToxicity(data) {
    if (!toxicityContainer) return;
    
    const toxicity = data.toxicityAnalysis || [];
    
    if (toxicity.length === 0) {
        toxicityContainer.innerHTML = '<p>✅ Không phát hiện nội dung độc hại.</p>';
        return;
    }
    
    let html = '';
    toxicity.forEach(item => {
        const percentage = (item.Score * 100).toFixed(1);
        const severity = item.Score > 0.7 ? 'high' : item.Score > 0.4 ? 'medium' : 'low';
        
        html += `
            <div class="toxicity-item ${severity}">
                <span class="toxicity-label">${item.Name}</span>
                <div class="toxicity-bar">
                    <div class="toxicity-fill" style="width: ${percentage}%"></div>
                </div>
                <span class="toxicity-value">${percentage}%</span>
            </div>
        `;
    });
    
    toxicityContainer.innerHTML = html;
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
    imageInput.value = '';
    selectedFile = null;
    
    // Reset upload text nếu có
    const uploadText = document.querySelector('.upload-text');
    if (uploadText) {
        uploadText.textContent = 'Drag & drop image here';
        uploadText.style.color = '';
    }
    
    // Reset loading message
    loadingMessage.querySelector('p').textContent = 'Analyzing your content...';
    
    // Ẩn results và errors
    resultsSection.classList.add('hidden');
    errorMessage.classList.add('hidden');
    loadingMessage.classList.add('hidden');
    
    // Enable input và button
    textInput.disabled = false;
    analyzeButton.disabled = false;
    
    // Focus vào input hiện tại
    if (currentMode === 'text') {
        textInput.focus();
    }
    
    // Scroll lên đầu
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================================
// 11. KHỞI TẠO
// ================================
console.log('✅ Sentiment Analysis App V2.0 initialized successfully!');
console.log('💡 Tip: Press Ctrl + Enter to analyze text quickly');
console.log('🆕 New features: Image analysis, PII detection, Toxicity analysis, Syntax analysis');
