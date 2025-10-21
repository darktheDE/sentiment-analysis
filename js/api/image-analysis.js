// Image Analysis API
import { elements } from '../dom.js';
import { showLoading, showError } from '../ui/state.js';
import { displayResults } from '../display/index.js';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const POLL_INTERVAL = 6000; // 6 seconds
const MAX_POLL_ATTEMPTS = 60; // 6 minutes total

export async function analyzeImage(file) {
    if (!file) {
        alert('Vui lòng chọn ảnh cần phân tích!');
        return;
    }
    
    showLoading();
    updateLoadingMessage('Đang chuẩn bị tải lên...');
    
    try {
        // Step 1: Get upload URL
        const { uploadURL, key } = await getUploadURL(file.name);
        
        // Step 2: Upload to S3
        await uploadToS3(uploadURL, file);
        
        // Step 3: Poll for results
        updateLoadingMessage('Đang phân tích hình ảnh... (30-60 giây)');
        await pollResult(key);
        
    } catch (error) {
        console.error('Image analysis error:', error);
        showError(error.message);
    }
}

async function getUploadURL(fileName) {
    const response = await fetch(
        `${API_ENDPOINT_GET_UPLOAD_URL}?fileName=${encodeURIComponent(fileName)}`
    );
    
    if (!response.ok) {
        throw new Error('Không thể lấy upload URL. Vui lòng thử lại.');
    }
    
    return await response.json();
}

async function uploadToS3(uploadURL, file) {
    const response = await fetch(uploadURL, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'image/jpeg' },
        body: file
    });
    
    if (!response.ok) {
        throw new Error(`Không thể tải ảnh lên (${response.status}).`);
    }
}

async function pollResult(imageKey, attempts = 0) {
    if (attempts >= MAX_POLL_ATTEMPTS) {
        throw new Error('Quá thời gian xử lý. Vui lòng thử ảnh đơn giản hơn.');
    }
    
    try {
        const response = await fetch(`${API_ENDPOINT_GET_RESULT}/${imageKey}`);
        
        // Handle 404 (still processing)
        if (response.status === 404) {
            const data = await response.json();
            if (data.status === 'PROCESSING') {
                updateLoadingMessage(`Đang xử lý... (${attempts + 1}/${MAX_POLL_ATTEMPTS})`);
                setTimeout(() => pollResult(imageKey, attempts + 1), POLL_INTERVAL);
                return;
            }
            throw new Error('Không tìm thấy kết quả.');
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'COMPLETED') {
            displayResults(data);
        } else if (data.status === 'FAILED') {
            throw new Error(data.error || 'Xử lý thất bại');
        } else {
            // Still processing, retry
            setTimeout(() => pollResult(imageKey, attempts + 1), POLL_INTERVAL);
        }
        
    } catch (error) {
        if (attempts < MAX_POLL_ATTEMPTS - 1) {
            setTimeout(() => pollResult(imageKey, attempts + 1), POLL_INTERVAL);
        } else {
            throw error;
        }
    }
}

function updateLoadingMessage(text) {
    elements.loadingMessage.querySelector('p').textContent = text;
}