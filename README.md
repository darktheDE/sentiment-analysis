# 🎭 Ứng dụng Phân tích Cảm xúc Đa Ngôn ngữ (Sentiment Analysis Web App)

> Dự án cuối kỳ môn **Điện toán Đám mây (CLCO432779)** - HCMUTE 2025

Ứng dụng web phân tích văn bản thông minh sử dụng kiến trúc **serverless** trên nền tảng Amazon Web Services (AWS), cung cấp khả năng phân tích cảm xúc, trích xuất thông tin từ văn bản và hình ảnh theo thời gian thực.

---

## 👥 Thành viên nhóm

| Thành viên | Vai trò | GitHub |
|------------|---------|--------|
| **Nguyễn Văn Quang Duy** | Leader & Backend | [@QuangDuyReal](https://github.com/QuangDuyReal) |
| **Đỗ Kiến Hưng** | Frontend & Deploy | [@darktheDE](https://github.com/darktheDE) |

---

## 🎯 Mục tiêu dự án

Xây dựng ứng dụng web có khả năng:
1. ✅ Nhận văn bản hoặc hình ảnh từ người dùng
2. ✅ Sử dụng AWS AI/ML để phân tích và trích xuất thông tin sâu sắc
3. ✅ Hiển thị kết quả trực quan, dễ hiểu với giao diện hiện đại
4. ✅ Chứng minh hiểu biết về kiến trúc serverless và các mô hình dịch vụ đám mây

---

## ✨ Các tính năng chính

### 🔍 Phân tích Văn bản (Text Analysis)
- **Phân tích Cảm xúc**: Xác định cảm xúc (Tích cực, Tiêu cực, Trung tính, Hỗn hợp) với độ tin cậy chi tiết
- **Trích xuất Thực thể**: Nhận diện tên người, tổ chức, địa điểm, ngày tháng, số liệu...
- **Cụm từ Khóa**: Rút trích các cụm từ quan trọng nhất
- **Phát hiện Ngôn ngữ**: Tự động phát hiện và dịch (hỗ trợ 12+ ngôn ngữ)
- **Phát hiện PII**: Nhận diện thông tin cá nhân (tên, email, số điện thoại, địa chỉ...)
- **Phân tích Cú pháp**: Phân loại từ loại (danh từ, động từ, tính từ...) với bản địa hóa tiếng Việt
- **Phát hiện Độc hại**: Phân tích mức độ độc hại, lăng mạ, quấy rối trong nội dung

### 🖼️ Phân tích Hình ảnh (Image Analysis)
- **OCR (Textract)**: Trích xuất văn bản từ ảnh tự động
- **Polling thông minh**: Cơ chế bất đồng bộ với 60 lần thử (6 phút timeout)
- **Upload trực tiếp**: Presigned S3 URL cho hiệu suất tối ưu
- Hỗ trợ định dạng: JPG, PNG, HEIC (tối đa 5MB)

### 🎨 Giao diện hiện đại
- **Theme**: Purple gradient với glassmorphism effects
- **Responsive**: Tương thích mọi thiết bị (Desktop, Tablet, Mobile)
- **Interactive**: Animations, loading states, error handling
- **Tab-based UI**: Chuyển đổi dễ dàng giữa Text/Image mode

---

## 📂 Cấu trúc Dự án (v2.0 - Modular Architecture)

```
sentiment-analysis/
├── index.html                    # Trang chính (274 dòng)
├── css/
│   └── style.css                # Stylesheet với purple theme
├── js/
│   ├── app.js                   # Entry point - khởi tạo ứng dụng
│   ├── config.js                # API endpoints (gitignored)
│   ├── dom.js                   # Centralized DOM references
│   ├── api/
│   │   ├── text-analysis.js     # Text API calls
│   │   └── image-analysis.js    # Image upload & polling logic
│   ├── ui/
│   │   ├── state.js             # UI state management + utilities
│   │   ├── tabs.js              # Tab switching logic
│   │   └── file-upload.js       # File selection & validation
│   └── display/
│       ├── index.js             # Display coordinator
│       ├── stats.js             # Stats cards display
│       ├── sentiment.js         # Sentiment breakdown
│       ├── entities.js          # Entities table
│       ├── keyphrases.js        # Key phrases tags
│       ├── language.js          # Language detection info
│       ├── pii.js               # PII detection results
│       ├── syntax.js            # Syntax analysis (Vietnamese POS)
│       └── toxicity.js          # Toxicity analysis
├── .gitignore
└── README.md                    # File này
```

### 🔄 Thay đổi so với v1.0
- **Before**: Monolithic `app.js` (1054 dòng) - khó bảo trì
- **After**: 16 modules được tổ chức theo trách nhiệm rõ ràng
- **Lợi ích**: Dễ đọc, dễ debug, dễ mở rộng, phù hợp báo cáo học thuật

---

## 🏗️ Kiến trúc Hệ thống

### Frontend (Pure JavaScript - No Framework)
```
┌─────────────────────────────────────────────┐
│  Browser (index.html)                       │
│  ├── CSS (Purple Gradient Theme)            │
│  └── JavaScript ES6 Modules                 │
│      ├── app.js (Main entry)                │
│      ├── api/ (Backend communication)       │
│      ├── ui/ (State & interactions)         │
│      └── display/ (Result rendering)        │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  AWS Amplify Hosting                        │
│  - Static site hosting                      │
│  - CI/CD from GitHub                        │
│  - HTTPS enabled                            │
└─────────────────────────────────────────────┘
```

### Backend (AWS Serverless)

#### 📝 Text Analysis (Đồng bộ)
```
Client → API Gateway → Lambda → Comprehend/Translate → Response
         /analyze-text   (Python)    (AI/ML Services)
```

#### 🖼️ Image Analysis (Bất đồng bộ - 3 bước)
```
1. Client → GET /get-upload-url → Lambda → Presigned S3 URL
2. Client → PUT to S3 URL → S3 Bucket → Trigger Lambda
3. Lambda → Textract (OCR) → Comprehend → Save to DynamoDB
4. Client → Poll GET /get-result/{key} → Lambda → DynamoDB → Results
   (Polling: 6s interval, max 60 attempts = 6 minutes)
```

### AWS Services Map
| Service | Vai trò |
|---------|---------|
| **API Gateway** | REST API endpoints với CORS |
| **Lambda** | Serverless compute (Python 3.x) |
| **Comprehend** | Sentiment, Entities, Key Phrases, Syntax, PII, Toxicity |
| **Translate** | Dịch tự động (vi→en, etc.) |
| **Textract** | OCR - trích xuất text từ ảnh |
| **S3** | Lưu trữ ảnh upload |
| **DynamoDB** | Lưu kết quả phân tích ảnh |
| **Amplify** | Hosting + CI/CD cho frontend |
| **IAM** | Quản lý quyền truy cập |

---

## 🚀 Hướng dẫn Cài đặt & Chạy

### Yêu cầu
- ✅ Tài khoản AWS (Free Tier)
- ✅ Git
- ✅ Python 3.9+ (cho local testing backend)
- ✅ Web browser hiện đại (Chrome, Firefox, Edge)

### 1️⃣ Clone Repository
```bash
git clone https://github.com/darktheDE/sentiment-analysis.git
cd sentiment-analysis
```

### 2️⃣ Cấu hình Frontend
Tạo file `js/config.js` (file này đã được gitignore):
```javascript
const API_ENDPOINT_TEXT = 'https://YOUR-API-ID.execute-api.region.amazonaws.com/Prod/analyze-text';
const API_ENDPOINT_GET_UPLOAD_URL = 'https://YOUR-API-ID.execute-api.region.amazonaws.com/Prod/get-upload-url';
const API_ENDPOINT_GET_RESULT = 'https://YOUR-API-ID.execute-api.region.amazonaws.com/Prod/get-result';
```

### 3️⃣ Chạy Local Development Server
```bash
# Sử dụng Python (đơn giản nhất)
python -m http.server 8000

# Hoặc VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

Truy cập: `http://localhost:8000`

### 4️⃣ Deploy lên AWS Amplify
1. Push code lên GitHub repository của bạn
2. Vào AWS Console → Amplify
3. Chọn "New app" → "Host web app"
4. Connect GitHub repository
5. Amplify tự động build & deploy

**⚠️ Lưu ý**: Cấu hình biến môi trường `API_ENDPOINT_*` trên Amplify Console nếu không muốn hard-code vào `config.js`.

---

## 📖 Hướng dẫn Sử dụng

### Phân tích Văn bản
1. Chọn tab **"Văn bản"**
2. Nhập văn bản vào ô textarea (tối đa 5000 bytes UTF-8)
3. Click **"Phân tích"** hoặc nhấn **Ctrl + Enter**
4. Xem kết quả:
   - **Stats Cards**: Tổng quan nhanh (sentiment, số entities, phrases)
   - **Sentiment Breakdown**: Biểu đồ thanh 4 cảm xúc với phần trăm
   - **Entities Table**: Bảng thực thể được phát hiện
   - **Key Phrases**: Tags của các cụm từ quan trọng
   - **Language Info**: Ngôn ngữ phát hiện + thông tin dịch (nếu có)
   - **PII Detection**: Thông tin cá nhân được che
   - **Syntax Analysis**: 15 tokens đầu tiên với từ loại (tiếng Việt)
   - **Toxicity Analysis**: Mức độ độc hại của nội dung

### Phân tích Hình ảnh
1. Chọn tab **"Hình ảnh"**
2. Click **"Chọn hình ảnh"** (JPG, PNG, HEIC, max 5MB)
3. Click **"Phân tích"**
4. Đợi polling (loading spinner, tối đa 6 phút)
5. Kết quả hiển thị tương tự Text Analysis

### Ví dụ Test
**Tiếng Anh:**
```
Amazon Web Services is a great cloud platform. Jeff Bezos is the founder of Amazon, which is headquartered in Seattle.
```
- Sentiment: POSITIVE (89%)
- Entities: Amazon Web Services, Jeff Bezos, Amazon, Seattle

**Tiếng Việt:**
```
Tôi rất thích dịch vụ này. AWS Comprehend thật tuyệt vời!
```
- Sẽ tự động dịch sang tiếng Anh để phân tích
- Translation Info hiển thị thông báo đã dịch

---

## 🛠️ Công nghệ Sử dụng

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| HTML5 | - | Semantic markup |
| CSS3 | - | Purple gradient theme, glassmorphism |
| JavaScript | ES6+ | Modular architecture, no framework |
| ES6 Modules | - | Import/Export between files |

### Backend
| Service | Runtime | Libraries |
|---------|---------|-----------|
| AWS Lambda | Python 3.12 | boto3 (AWS SDK) |
| API Gateway | REST API | CORS enabled |

### AWS AI/ML Services
- **Amazon Comprehend**: Sentiment, Entities, Key Phrases, Syntax, PII, Toxicity
- **Amazon Translate**: Multi-language translation
- **Amazon Textract**: OCR for image analysis

### DevOps
- **AWS Amplify**: Hosting, CI/CD
- **GitHub**: Version control, collaboration
- **Git**: Source control

---

## 📊 Chi phí & AWS Free Tier

| Service | Free Tier Limit | Estimated Usage |
|---------|-----------------|-----------------|
| **Comprehend** | 50K units/month (3 months) | ~1000 requests/month |
| **Translate** | 2M chars/month (12 months) | ~100K chars/month |
| **Textract** | 1K pages/month (3 months) | ~50 images/month |
| **Lambda** | 1M requests/month | ~500 requests/month |
| **API Gateway** | 1M requests/month | ~500 requests/month |
| **S3** | 5GB storage | <100MB |
| **DynamoDB** | 25GB storage | <1GB |
| **Amplify** | 1000 build minutes/month | ~50 minutes/month |

**💰 Ước tính**: Dự án nằm hoàn toàn trong Free Tier nếu sử dụng hợp lý (~$0/month).

---

## 🐛 Troubleshooting

### Lỗi thường gặp

#### 1. Module loading error
```
Failed to load module script: Expected a JavaScript module script
```
**Giải pháp**: 
- Đảm bảo `<script type="module" src="js/app.js"></script>` có `type="module"`
- Chạy trên local server (không dùng `file://`)

#### 2. CORS error khi gọi API
```
Access to fetch at 'https://...' from origin 'http://localhost:8000' has been blocked by CORS
```
**Giải pháp**: 
- Kiểm tra API Gateway đã enable CORS
- Response headers phải có `Access-Control-Allow-Origin: *`

#### 3. 404 Not Found khi polling
```
GET /get-result/abc123 → 404
```
**Giải pháp**: 
- Kiểm tra response body: có thể là `{"status": "PROCESSING"}` (không phải lỗi)
- Chờ thêm vài lần polling (S3 trigger có độ trễ)

#### 4. Blank results sau phân tích
**Giải pháp**: 
- Mở Console (F12) → Network tab
- Kiểm tra API response field names (camelCase vs PascalCase)
- Tham khảo `docs/BACKEND_API_V2.md` cho format chính xác

---

## 📚 Tài liệu Tham khảo

### AWS Documentation
- [AWS Comprehend](https://docs.aws.amazon.com/comprehend/)
- [AWS Lambda Python](https://docs.aws.amazon.com/lambda/latest/dg/lambda-python.html)
- [Amazon Translate](https://docs.aws.amazon.com/translate/)
- [Amazon Textract](https://docs.aws.amazon.com/textract/)
- [AWS Amplify Hosting](https://docs.aws.amazon.com/amplify/)

---

## 🎓 Bối cảnh Học thuật

**Môn học**: Điện toán Đám mây (CLCO432779)  
**Học kỳ**: 1 (2025-2026)  
**Trường**: Đại học Sư phạm Kỹ thuật TP.HCM (HCMUTE)

### Kiến thức được áp dụng
- ✅ **IaaS**: EC2-like resources (S3, DynamoDB)
- ✅ **PaaS**: Lambda, API Gateway, Amplify
- ✅ **SaaS**: Comprehend, Translate, Textract
- ✅ **Serverless Architecture**: Event-driven, auto-scaling
- ✅ **Cloud Design Patterns**: Presigned URLs, Polling, Async processing

---

## 📄 License

Dự án này được phát triển cho mục đích học tập. Code được public để chia sẻ kiến thức.

---

© 2025 Sentiment Analyzer - HCMUTE - CLCO432779
