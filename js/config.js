// =================================================================
// BACKEND V2.0 - CÁC ENDPOINT MỚI
// =================================================================

// Base URL: https://6um5jwc4zk.execute-api.us-east-1.amazonaws.com/Prod
// Stack: sentiment-analyzer-stack-v2

// 1. Endpoint phân tích văn bản (POST /analyze-text)
const API_ENDPOINT_TEXT = 'https://6um5jwc4zk.execute-api.us-east-1.amazonaws.com/Prod/analyze-text';

// 2. Endpoint lấy upload URL cho ảnh (GET /get-upload-url)
const API_ENDPOINT_GET_UPLOAD_URL = 'https://6um5jwc4zk.execute-api.us-east-1.amazonaws.com/Prod/get-upload-url';

// 3. Endpoint lấy kết quả phân tích ảnh (GET /get-result/{imageKey})
const API_ENDPOINT_GET_RESULT = 'https://6um5jwc4zk.execute-api.us-east-1.amazonaws.com/Prod/get-result';

// =================================================================
// LEGACY - Giữ lại để backward compatibility (nếu cần)
// =================================================================
const API_ENDPOINT = API_ENDPOINT_TEXT; // Alias cho code cũ
