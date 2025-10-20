// =================================================================
// BACKEND V2.0 - CÁC ENDPOINT MỚI
// =================================================================

// Thay thế các URL bên dưới bằng API Gateway Invoke URL thực tế của bạn
// Base URL: https://xxx.execute-api.us-east-1.amazonaws.com/Prod

// 1. Endpoint phân tích văn bản (ĐÃ THAY ĐỔI: /analyze → /analyze-text)
const API_ENDPOINT_TEXT = 'https://m4tyuifzof.execute-api.us-east-1.amazonaws.com/Prod/analyze-text';

// 2. Endpoint lấy upload URL cho ảnh (MỚI)
const API_ENDPOINT_GET_UPLOAD_URL = 'https://m4tyuifzof.execute-api.us-east-1.amazonaws.com/Prod/get-upload-url';

// 3. Endpoint lấy kết quả phân tích ảnh (MỚI)
const API_ENDPOINT_GET_RESULT = 'https://m4tyuifzof.execute-api.us-east-1.amazonaws.com/Prod/get-result';

// =================================================================
// LEGACY - Giữ lại để backward compatibility (nếu cần)
// =================================================================
const API_ENDPOINT = API_ENDPOINT_TEXT; // Alias cho code cũ
