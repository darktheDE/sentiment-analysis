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
        alert('[!] Vui lòng nhập văn bản cần phân tích!');
        textInput.focus();
        return;
    }
    
    // Kiểm tra độ dài text (AWS Comprehend giới hạn 5000 bytes UTF-8)
    const textSizeInBytes = new Blob([text]).size;
    if (textSizeInBytes > 5000) {
        alert(`[!] Văn bản quá dài (${textSizeInBytes} bytes). AWS Comprehend chỉ hỗ trợ tối đa 5000 bytes. Vui lòng rút ngắn văn bản.`);
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
        
        console.log('[>>] Sending text analysis request:');
        console.log('   Payload object:', requestPayload);
        console.log('   JSON string:', jsonBody);
        console.log('   JSON length:', jsonBody.length);
        
        // Gọi API mới: /analyze-text
        const response = await fetch(API_ENDPOINT_TEXT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: jsonBody
            // Removed mode: 'cors' - let browser decide
        });
        
        console.log('[<<] Response received:', {
            status: response.status,
            statusText: response.statusText,
            headers: [...response.headers.entries()]
        });
        
        // Kiểm tra response
        if (!response.ok) {
            // Thử parse JSON error từ backend
            let errorMessage = `Error ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                if (errorData.error) {
                    errorMessage = errorData.error;
                }
                console.error('[X] API Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorData: errorData
                });
            } catch (parseError) {
                // Nếu không parse được JSON, dùng text
                const errorText = await response.text();
                console.error('[X] API Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText.substring(0, 200)
                });
                if (errorText) {
                    errorMessage = errorText.substring(0, 100);
                }
            }
            throw new Error(errorMessage);
        }
        
        // Parse JSON - Sử dụng response.json() thay vì text + parse
        const data = await response.json();
        console.log('[OK] Parsed response data:', data);
        
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
        alert('[!] Vui lòng chọn ảnh cần phân tích!');
        return;
    }
    
    // Hiển thị loading
    showLoading();
    loadingMessage.querySelector('p').textContent = 'Đang chuẩn bị tải lên...';
    
    try {
        // Bước 1: Lấy upload URL từ backend
        console.log('[>>] Step 1: Getting upload URL for:', selectedFile.name);
        loadingMessage.querySelector('p').textContent = 'Getting upload URL...';
        
        const urlResponse = await fetch(
            `${API_ENDPOINT_GET_UPLOAD_URL}?fileName=${encodeURIComponent(selectedFile.name)}`
        );
        
        if (!urlResponse.ok) {
            throw new Error('Cannot get upload URL. Please try again.');
        }
        
        const { uploadURL, key } = await urlResponse.json();
        console.log('[OK] Got upload URL, key:', key);
        
        // Bước 2: Upload ảnh trực tiếp lên S3
        console.log('[>>] Step 2: Uploading image to S3...');
        loadingMessage.querySelector('p').textContent = 'Uploading image...';
        
        // Sử dụng content-type của file thực tế thay vì hardcode
        const uploadResponse = await fetch(uploadURL, {
            method: 'PUT',
            headers: {
                'Content-Type': selectedFile.type || 'image/jpeg'
            },
            body: selectedFile
        });
        
        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('[X] Upload failed:', {
                status: uploadResponse.status,
                statusText: uploadResponse.statusText,
                body: errorText
            });
            throw new Error(`Cannot upload image (${uploadResponse.status}). Please try again.`);
        }
        
        console.log('[OK] Image uploaded successfully');
        
        // Bước 3: Poll kết quả từ backend
        loadingMessage.querySelector('p').textContent = 'Đang phân tích hình ảnh... (có thể mất 30-60 giây)';
        await pollImageResult(key);
        
    } catch (error) {
        console.error('Image analysis error:', error);
        showError(error.message);
    }
}

// 3C. POLLING KẾT QUẢ PHÂN TÍCH ẢNH (MỚI - V2.0)
async function pollImageResult(imageKey, attempts = 0) {
    const maxAttempts = 60; // 60 lần x 6 giây = 360 giây (6 phút) - đủ cho Lambda timeout 300s
    const pollInterval = 6000; // 6 giây - giảm số lượng request đến DynamoDB
    
    if (attempts >= maxAttempts) {
        showError('Quá thời gian xử lý. Hình ảnh có thể quá phức tạp hoặc văn bản quá dài. Vui lòng thử lại với hình ảnh đơn giản hơn.');
        return;
    }
    
    try {
        console.log(`[?] Polling attempt ${attempts + 1}/${maxAttempts}...`);
        
        const response = await fetch(`${API_ENDPOINT_GET_RESULT}/${imageKey}`);
        
        console.log(`[<<] Response status: ${response.status}`);
        
        if (response.status === 404) {
            // Backend vẫn đang xử lý hoặc chưa tìm thấy
            try {
                const data = await response.json();
                console.log('[DATA] 404 Response data:', data);
                if (data.status === 'PROCESSING') {
                    console.log('[...] Still processing, will retry in 6 seconds...');
                    // Cập nhật loading message
                    loadingMessage.querySelector('p').textContent = 
                        `Đang xử lý... (${attempts + 1}/${maxAttempts}) - Có thể mất tới 5 phút`;
                    
                    // Thử lại sau 6 giây
                    setTimeout(() => pollImageResult(imageKey, attempts + 1), pollInterval);
                    return;
                } else {
                    // 404 thật sự - không tìm thấy resource
                    throw new Error('Không tìm thấy kết quả phân tích. Vui lòng tải lên lại.');
                }
            } catch (parseError) {
                // Nếu không parse được JSON, coi như 404 thật
                console.error('Cannot parse 404 response:', parseError);
                throw new Error('Không tìm thấy kết quả phân tích. Vui lòng tải lên lại.');
            }
        }
        
        if (!response.ok) {
            // Thử parse error message từ backend
            let errorMessage = `Error getting result: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.error) {
                    errorMessage = errorData.error;
                }
                console.error('[X] Error response:', errorData);
            } catch (parseError) {
                const errorText = await response.text();
                console.error('[X] Error response:', errorText);
                if (errorText) {
                    errorMessage = errorText.substring(0, 100);
                }
            }
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log('[DATA] Success response data:', data);
        
        if (data.status === 'COMPLETED') {
            console.log('[OK] Image analysis completed:', data);
            displayResults(data);
        } else if (data.status === 'FAILED') {
            showError('Processing failed: ' + (data.error || 'Unknown error'));
        } else if (data.status === 'PROCESSING') {
            // Vẫn đang xử lý (trường hợp backend trả 200 nhưng status vẫn PROCESSING)
            console.log('[...] Still processing (from 200 response), will retry in 6 seconds...');
            loadingMessage.querySelector('p').textContent = 
                `Processing... (${attempts + 1}/${maxAttempts}) - This may take up to 5 minutes`;
            setTimeout(() => pollImageResult(imageKey, attempts + 1), pollInterval);
        } else {
            // Trạng thái không xác định, thử lại
            console.log('[...] Unknown status, retrying...');
            setTimeout(() => pollImageResult(imageKey, attempts + 1), pollInterval);
        }
        
    } catch (error) {
        console.error('Polling error:', error);
        
        // Phân biệt network error vs API error
        if (error.message.includes('fetch') || error.message.includes('Network')) {
            // Network error - thử lại
            console.log('[!] Network error, will retry...');
            if (attempts < maxAttempts - 1) {
                setTimeout(() => pollImageResult(imageKey, attempts + 1), pollInterval);
            } else {
                showError('Network error. Please check your connection and try again.');
            }
        } else {
            // API error hoặc parsing error - dừng lại
            showError(error.message);
        }
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
        resetUploadUI();
        return;
    }
    
    // Kiểm tra file type - chấp nhận các định dạng phổ biến
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
    if (!validTypes.includes(file.type) && !file.type.startsWith('image/')) {
        alert('[!] Vui lòng chọn file ảnh hợp lệ (JPG, PNG, HEIC)');
        e.target.value = '';
        selectedFile = null;
        resetUploadUI();
        return;
    }
    
    // Kiểm tra file size (max 5MB - giới hạn của AWS Textract)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        alert(`[!] Kích thước file quá lớn (${(file.size / 1024 / 1024).toFixed(2)}MB). AWS Textract chỉ hỗ trợ ảnh dưới 5MB. Vui lòng chọn ảnh nhỏ hơn.`);
        e.target.value = '';
        selectedFile = null;
        resetUploadUI();
        return;
    }
    
    // Cảnh báo nếu file gần đạt giới hạn
    if (file.size > 4 * 1024 * 1024) { // > 4MB
        console.warn('[!] File size is close to the 5MB limit:', file.size);
    }
    
    selectedFile = file;
    console.log('[OK] File selected:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`, 'Type:', file.type);
    
    // Cập nhật UI để hiển thị tên file
    const uploadText = document.querySelector('.upload-text');
    if (uploadText) {
        uploadText.textContent = `✓ Đã chọn: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`;
        uploadText.style.color = 'var(--success)';
    }
}

// Helper function để reset upload UI
function resetUploadUI() {
    const uploadText = document.querySelector('.upload-text');
    if (uploadText) {
        uploadText.textContent = 'Kéo thả hoặc nhấp để chọn hình ảnh';
        uploadText.style.color = '';
    }
}

// ================================
// 4. HIỂN thị KẾT QUẢ
// ================================
function displayResults(data) {
    console.log('=== DISPLAYING RESULTS ===');
    console.log('Full data received:', data);
    console.log('Data keys:', Object.keys(data));
    
    // Store data globally for debugging
    window.lastAnalysisData = data;
    console.log('[TIP] Access data via window.lastAnalysisData in console');
    
    // Ẩn loading
    loadingMessage.classList.add('hidden');
    
    // Hiển thị results section
    resultsSection.classList.remove('hidden');
    
    // Log từng phần để debug
    console.log('sentiment:', data.sentiment);
    console.log('sentimentScores:', data.sentimentScores);
    console.log('detectedEntities:', data.detectedEntities);
    console.log('detectedKeyPhrases:', data.detectedKeyPhrases);
    console.log('detectedLanguage:', data.detectedLanguage);
    console.log('translationInfo:', data.translationInfo);
    console.log('originalText:', data.originalText);
    console.log('analyzedTextInEnglish:', data.analyzedTextInEnglish);
    console.log('redactedEnglishText:', data.redactedEnglishText);
    console.log('targetLanguage:', data.targetLanguage);
    console.log('detectedPiiEntities:', data.detectedPiiEntities);
    console.log('syntaxAnalysis:', data.syntaxAnalysis);
    console.log('toxicityAnalysis:', data.toxicityAnalysis);
    
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
    
    // Enable lại input và button để người dùng có thể phân tích tiếp
    textInput.disabled = false;
    analyzeButton.disabled = false;
    
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
    
    // Icons cho từng sentiment - giữ emoji để hiển thị sentiment động
    const icons = {
        'POSITIVE': '😊',
        'NEGATIVE': '😢',
        'NEUTRAL': '😐',
        'MIXED': '😕'
    };
    
    sentimentIcon.textContent = icons[sentiment] || '?';
    
    // Làm tròn score trước khi animate để tránh số thập phân dài
    const roundedScore = Math.round(sentimentScore);
    
    // Animate số từ 0 lên target value (đã làm tròn)
    animateNumber(sentimentValue, 0, roundedScore, 1000, '%');
    
    // Entities count (Backend có thể trả về array [] hoặc object {})
    const entitiesArray = Array.isArray(data.detectedEntities) ? data.detectedEntities : [];
    const entitiesLength = entitiesArray.length;
    animateNumber(entitiesCount, 0, entitiesLength, 1000);
    
    // Key phrases count (Backend có thể trả về array [] hoặc object {})
    const phrasesArray = Array.isArray(data.detectedKeyPhrases) ? data.detectedKeyPhrases : [];
    const phrasesLength = phrasesArray.length;
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
        // Backend có thể trả về string hoặc number - cần convert sang number
        const scoreValue = parseFloat(scores[sentiment.key]) || 0;
        const percentage = scoreValue * 100;
        // Làm tròn score: nếu < 0.1% thì hiển thị 0.0%, ngược lại 1 chữ số thập phân
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
    // Backend có thể trả về array [] hoặc object {} hoặc undefined
    const entities = Array.isArray(data.detectedEntities) 
        ? data.detectedEntities 
        : (data.detectedEntities ? [] : []);
    
    console.log('displayEntities - entities:', entities);
    
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
        // Backend trả về {text, type}
        const text = entity.text || entity.Text || '';
        const type = entity.type || entity.Type || 'UNKNOWN';
        
        console.log('Entity item:', entity, '→ text:', text, 'type:', type);
        
        html += `
            <tr>
                <td><strong>${escapeHtml(text)}</strong></td>
                <td><span class="entity-type">${type}</span></td>
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
    // Backend có thể trả về array [] hoặc object {} hoặc undefined
    const keyPhrases = Array.isArray(data.detectedKeyPhrases) 
        ? data.detectedKeyPhrases 
        : (data.detectedKeyPhrases ? [] : []);
    
    console.log('displayKeyPhrases - keyPhrases:', keyPhrases);
    
    if (keyPhrases.length === 0) {
        keyphrasesContainer.innerHTML = '<p>Không tìm thấy cụm từ khóa nào.</p>';
        return;
    }
    
    // Tạo tags HTML
    let html = '<div class="keyphrases-list">';
    
    keyPhrases.forEach(phrase => {
        // Backend trả về {text}
        const text = phrase.text || phrase.Text || '';
        
        console.log('KeyPhrase item:', phrase, '→ text:', text);
        
        html += `
            <span class="phrase-tag">
                <span>${escapeHtml(text)}</span>
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
    
    // Debug: Log để kiểm tra dữ liệu translation
    console.log('[LANG] Language Info - Full data:', {
        detectedLanguage: data.detectedLanguage,
        translationInfo: data.translationInfo,
        originalText: data.originalText,
        analyzedTextInEnglish: data.analyzedTextInEnglish,
        redactedEnglishText: data.redactedEnglishText,
        targetLanguage: data.targetLanguage
    });
    
    let html = '<div class="language-info-wrapper">';
    
    // Hiển thị ngôn ngữ phát hiện
    if (data.detectedLanguage) {
        html += `
            <div class="language-detected">
                <svg class="language-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <span>Ngôn ngữ phát hiện: <strong>${data.detectedLanguage.toUpperCase()}</strong></span>
            </div>
        `;
    }
    
    // Hiển thị thông tin dịch thuật với format đẹp hơn
    if (data.translationInfo || data.translatedText) {
        // Parse translation info để lấy ngôn ngữ nguồn và đích
        let fromLang = data.detectedLanguage ? data.detectedLanguage.toUpperCase() : 'UNKNOWN';
        let toLang = data.targetLanguage ? data.targetLanguage.toUpperCase() : 'EN';
        
        if (data.translationInfo) {
            const translationMatch = data.translationInfo.match(/from '(\w+)' to '(\w+)'/i);
            if (translationMatch) {
                fromLang = translationMatch[1].toUpperCase();
                toLang = translationMatch[2].toUpperCase();
            }
        }
        
        html += `
            <div class="language-translation-header">
                <svg class="language-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="17 1 21 5 17 9"/>
                    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                    <polyline points="7 23 3 19 7 15"/>
                    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                </svg>
                <span>Đã dịch từ <strong>${fromLang}</strong> sang <strong>${toLang}</strong> để phân tích</span>
            </div>
        `;
        
        // Hiển thị văn bản gốc và văn bản đã dịch (theo chiều dọc)
        const hasOriginal = data.originalText || data.original_text;
        const hasTranslated = data.analyzedTextInEnglish || data.translatedText || data.translated_text;
        
        if (hasOriginal || hasTranslated) {
            html += '<div class="translation-texts">';
            
            // Văn bản gốc
            if (hasOriginal) {
                const originalText = data.originalText || data.original_text;
                const truncatedOriginal = originalText.length > 300 
                    ? originalText.substring(0, 300) + '...' 
                    : originalText;
                html += `
                    <div class="translation-text-box original">
                        <div class="text-label">
                            <svg class="text-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                            </svg>
                            Văn bản gốc (${fromLang}):
                        </div>
                        <div class="text-content">${escapeHtml(truncatedOriginal)}</div>
                    </div>
                `;
            }
            
            // Văn bản đã dịch
            if (hasTranslated) {
                const translatedText = data.analyzedTextInEnglish || data.translatedText || data.translated_text;
                const truncatedTranslated = translatedText.length > 300 
                    ? translatedText.substring(0, 300) + '...' 
                    : translatedText;
                html += `
                    <div class="translation-text-box translated">
                        <div class="text-label">
                            <svg class="text-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                            </svg>
                            Văn bản đã dịch (${toLang}):
                        </div>
                        <div class="text-content">${escapeHtml(truncatedTranslated)}</div>
                    </div>
                `;
            }
            
            html += '</div>';
        }
    }
    
    html += '</div>';
    
    // Nếu không có thông tin gì
    if (!data.detectedLanguage && !data.translationInfo && !data.translatedText) {
        html = '<p>Không có thông tin ngôn ngữ.</p>';
    }
    
    languageInfo.innerHTML = html;
}

// ================================
// 8B. HIỂN THỊ PII (MỚI - V2.0)
// ================================
function displayPII(data) {
    if (!piiContainer) return;
    
    // Backend có thể trả về array [] hoặc object {} hoặc undefined
    const piiEntities = Array.isArray(data.detectedPiiEntities) 
        ? data.detectedPiiEntities 
        : (data.detectedPiiEntities ? [] : []);
    
    console.log('displayPII - piiEntities:', piiEntities);
    
    if (piiEntities.length === 0) {
        piiContainer.innerHTML = '<p>[OK] Không phát hiện thông tin cá nhân.</p>';
        return;
    }
    
    let html = '<div class="pii-warning">[!] Đã phát hiện thông tin cá nhân trong văn bản!</div>';
    html += '<div class="pii-list">';
    
    piiEntities.forEach(pii => {
        // Backend có thể trả về string hoặc number - cần convert sang number
        const scoreValue = parseFloat(pii.score || pii.Score) || 0;
        const score = scoreValue * 100;
        // Làm tròn: nếu < 1% thì hiển thị 1 chữ số, ngược lại 0 chữ số
        const displayScore = score < 1 ? score.toFixed(1) : Math.round(score);
        const type = pii.type || pii.Type || 'UNKNOWN';
        
        console.log('PII item:', pii, '→ type:', type, 'score:', displayScore);
        
        html += `<span class="pii-tag">${type} (${displayScore}%)</span>`;
    });
    
    html += '</div>';
    
    // Hiển thị văn bản đã che PII
    if (data.redactedEnglishText) {
        html += `
            <details style="margin-top: 15px;">
                <summary>[ ] Xem văn bản đã che thông tin cá nhân</summary>
                <pre>${escapeHtml(data.redactedEnglishText)}</pre>
            </details>
        `;
    }
    
    piiContainer.innerHTML = html;
}

// ================================
// 8C. HIỂN THỊ SYNTAX (MỚI - V2.0)
// ================================

// Mapping POS tags sang tiếng Việt
const POS_TAG_VIETNAMESE = {
    'ADJ': 'Tính từ',
    'ADP': 'Giới từ',
    'ADV': 'Trạng từ',
    'AUX': 'Trợ động từ',
    'CCONJ': 'Liên từ đẳng lập',
    'DET': 'Từ hạn định',
    'INTJ': 'Thán từ',
    'NOUN': 'Danh từ',
    'NUM': 'Số từ',
    'PART': 'Tiểu từ',
    'PRON': 'Đại từ',
    'PROPN': 'Danh từ riêng',
    'PUNCT': 'Dấu câu',
    'SCONJ': 'Liên từ phụ thuộc',
    'SYM': 'Ký hiệu',
    'VERB': 'Động từ',
    'X': 'Khác',
    'UNKNOWN': 'Không xác định'
};

function displaySyntax(data) {
    if (!syntaxContainer) return;
    
    // Backend có thể trả về array [] hoặc object {} hoặc undefined
    const syntax = Array.isArray(data.syntaxAnalysis) 
        ? data.syntaxAnalysis 
        : (data.syntaxAnalysis ? [] : []);
    
    console.log('displaySyntax - syntax:', syntax);
    
    if (syntax.length === 0) {
        syntaxContainer.innerHTML = '<p>Không có dữ liệu phân tích cú pháp.</p>';
        return;
    }
    
    // Chỉ lấy 15 từ đầu để không quá dài
    const first15 = syntax.slice(0, 15);
    
    let html = '<div class="syntax-list">';
    first15.forEach(token => {
        const text = token.text || token.Text || '';
        
        // Handle 2 formats:
        // 1. Text analysis: partOfSpeech = 'ADV' (string)
        // 2. Image analysis: PartOfSpeech = {Tag: 'ADV', Score: 0.99} (object)
        let pos = 'UNKNOWN';
        const posValue = token.partOfSpeech || token.PartOfSpeech;
        
        if (typeof posValue === 'string') {
            // Text analysis - already a string
            pos = posValue;
        } else if (typeof posValue === 'object' && posValue !== null) {
            // Image analysis - extract Tag from object
            pos = posValue.Tag || posValue.tag || 'UNKNOWN';
        }
        
        console.log('Syntax token:', token, '→ text:', text, 'pos:', pos);
        
        // Dịch POS tag sang tiếng Việt
        const posVietnamese = POS_TAG_VIETNAMESE[pos] || pos;
        
        html += `<span class="syntax-token"><strong>${escapeHtml(text)}</strong>: ${posVietnamese}</span>`;
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

// Mapping Toxicity labels sang tiếng Việt
const TOXICITY_LABEL_VIETNAMESE = {
    'PROFANITY': 'Lời nói tục tĩu',
    'HATE_SPEECH': 'Phát ngôn th仇 hận',
    'INSULT': 'Xúc phạm',
    'GRAPHIC': 'Nội dung bạo lực hình ảnh',
    'HARASSMENT_OR_ABUSE': 'Quấy rối hoặc lạm dụng',
    'SEXUAL': 'Nội dung tình dục',
    'VIOLENCE_OR_THREAT': 'Bạo lực hoặc đe dọa'
};

function displayToxicity(data) {
    if (!toxicityContainer) return;
    
    // Backend có thể trả về array [] hoặc object {} hoặc undefined
    const toxicity = Array.isArray(data.toxicityAnalysis) 
        ? data.toxicityAnalysis 
        : (data.toxicityAnalysis ? [] : []);
    
    console.log('displayToxicity - toxicity:', toxicity);
    
    if (toxicity.length === 0) {
        toxicityContainer.innerHTML = '<p>[OK] Không phát hiện nội dung độc hại.</p>';
        return;
    }
    
    let html = '';
    toxicity.forEach(item => {
        const name = item.Name || 'UNKNOWN';
        // Dịch tên toxicity sang tiếng Việt
        const nameVietnamese = TOXICITY_LABEL_VIETNAMESE[name] || name;
        
        // Backend có thể trả về string hoặc number - cần convert sang number
        const scoreValue = parseFloat(item.Score) || 0;
        const percentage = scoreValue * 100;
        // Làm tròn: nếu < 1% thì hiển thị 1 chữ số, ngược lại không có thập phân
        const displayValue = percentage < 1 ? percentage.toFixed(1) : Math.round(percentage);
        const severity = scoreValue > 0.7 ? 'high' : scoreValue > 0.4 ? 'medium' : 'low';
        
        html += `
            <div class="toxicity-item ${severity}">
                <span class="toxicity-label">${nameVietnamese}</span>
                <div class="toxicity-bar">
                    <div class="toxicity-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
                <span class="toxicity-value">${displayValue}%</span>
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
    // Backend có thể trả về string hoặc number - cần convert sang number
    const scoreValue = parseFloat(scores[key]) || 0;
    return scoreValue * 100;
}

// Animate số từ start đến end
function animateNumber(element, start, end, duration, suffix = '') {
    const startTime = Date.now();
    const range = end - start;
    
    function update() {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + range * easeOut);
        
        // Đảm bảo chỉ hiển thị số nguyên + suffix
        element.textContent = current + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            // Đảm bảo giá trị cuối cùng chính xác (làm tròn)
            element.textContent = Math.round(end) + suffix;
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

// Reset app về trạng thái ban đầu (không cần nữa vì phân tích liên tục)
function resetApp() {
    // Ẩn results và errors để sẵn sàng phân tích mới
    resultsSection.classList.add('hidden');
    errorMessage.classList.add('hidden');
    loadingMessage.classList.add('hidden');
    
    // Enable input và button
    textInput.disabled = false;
    analyzeButton.disabled = false;
    
    // Scroll lên form input
    document.querySelector('.input-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ================================
// 11. KHỞI TẠO
// ================================
console.log('[OK] Sentiment Analysis App V2.0 initialized successfully!');
console.log('[TIP] Press Ctrl + Enter to analyze text quickly');
console.log('[NEW] Features: Image analysis, PII detection, Toxicity analysis, Syntax analysis');
