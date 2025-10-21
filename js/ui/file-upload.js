// ================================
// File Upload Module
// ================================

// Export selected file state
export let selectedFile = null;

// Initialize drag & drop
export function initDragAndDrop() {
    const uploadBox = document.querySelector('.image-upload-box');
    const imageInput = document.getElementById('image-input');
    
    if (!uploadBox || !imageInput) return;
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadBox.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadBox.addEventListener(eventName, () => {
            uploadBox.classList.add('drag-over');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadBox.addEventListener(eventName, () => {
            uploadBox.classList.remove('drag-over');
        }, false);
    });
    
    // Handle dropped files
    uploadBox.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            // Simulate file input change
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(files[0]);
            imageInput.files = dataTransfer.files;
            
            // Trigger change event
            const event = new Event('change', { bubbles: true });
            imageInput.dispatchEvent(event);
        }
    }, false);
    
    console.log('[OK] Drag & drop initialized');
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// File selection handler
export function handleImageSelect(e) {
    const file = e.target.files[0];
    
    if (!file) {
        selectedFile = null;
        resetUploadUI();
        return null;
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
    if (!validTypes.includes(file.type) && !file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh hợp lệ (JPG, PNG, HEIC)');
        e.target.value = '';
        selectedFile = null;
        resetUploadUI();
        return null;
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        alert(`Kích thước file quá lớn (${(file.size / 1024 / 1024).toFixed(2)}MB). AWS Textract chỉ hỗ trợ ảnh dưới 5MB.`);
        e.target.value = '';
        selectedFile = null;
        resetUploadUI();
        return null;
    }
    
    selectedFile = file;
    console.log('[OK] File selected:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    
    // Update UI to show selected file
    const uploadText = document.querySelector('.upload-text');
    if (uploadText) {
        uploadText.textContent = `✓ Đã chọn: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`;
        uploadText.style.color = 'var(--success)';
    }
    
    return file;
}

// Reset upload UI to initial state
function resetUploadUI() {
    const uploadText = document.querySelector('.upload-text');
    if (uploadText) {
        uploadText.textContent = 'Kéo thả hình ảnh vào đây';
        uploadText.style.color = '';
    }
}
