# Ứng dụng Phân tích Cảm xúc Đa Ngôn ngữ (Sentiment Analysis Web App)

Đây là dự án cuối kỳ cho môn học **Điện toán đám mây (CLCO432779)**. Ứng dụng này là một công cụ web sử dụng kiến trúc "serverless" trên nền tảng Amazon Web Services (AWS) để cung cấp khả năng phân tích văn bản thông minh theo thời gian thực.

## Thành viên nhóm

*   **[Nguyễn Văn Quang Duy - @quangduyreal](https://github.com/QuangDuyReal)** - Chịu trách nhiệm phát triển Backend & Hạ tầng Cloud (AWS).
*   **[Đỗ Kiến Hưng - @darktheDE](https://github.com/darktheDE)** - Chịu trách nhiệm phát triển Frontend & Tích hợp (UI/UX, Amplify).

## Mục tiêu dự án

Dự án nhằm mục đích xây dựng một ứng dụng web có khả năng:
1.  Nhận một đoạn văn bản từ người dùng.
2.  Sử dụng các dịch vụ AI/ML của AWS để phân tích và trích xuất các thông tin sâu sắc từ văn bản đó.
3.  Hiển thị kết quả một cách trực quan và dễ hiểu cho người dùng.
4.  Chứng minh sự hiểu biết và khả năng vận dụng kiến trúc "serverless" và các mô hình dịch vụ đám mây (IaaS, PaaS, SaaS).

## Các tính năng chính

*   **Phân tích Cảm xúc (Sentiment Analysis):** Xác định cảm xúc tổng thể của văn bản (Tích cực, Tiêu cực, Trung tính, Hỗn hợp) với độ tin cậy chi tiết cho từng loại cảm xúc.
*   **Hỗ trợ Đa ngôn ngữ:** Tự động phát hiện ngôn ngữ của văn bản đầu vào. Hỗ trợ 12 ngôn ngữ chính: tiếng Anh (en), Tây Ban Nha (es), Pháp (fr), Đức (de), Ý (it), Bồ Đào Nha (pt), Ả Rập (ar), Hindi (hi), Nhật (ja), Hàn (ko), Trung Quốc giản thể (zh) và phồn thể (zh-TW). Đối với các ngôn ngữ khác (như tiếng Việt), hệ thống tự động dịch sang tiếng Anh bằng Amazon Translate trước khi phân tích.
*   **Trích xuất Thực thể (Entity Recognition):** Nhận diện và phân loại các thực thể được đặt tên như Tên người (PERSON), Tổ chức (ORGANIZATION), Địa điểm (LOCATION), và nhiều loại khác với điểm tin cậy.
*   **Trích xuất Cụm từ khóa (Key Phrase Extraction):** Rút ra các cụm từ quan trọng nhất để tóm tắt nội dung chính của văn bản với điểm đánh giá độ quan trọng.
*   **(Tính năng mở rộng - Tùy chọn) Phân tích Cảm xúc từ Hình ảnh:** Cho phép người dùng upload ảnh chứa văn bản (ví dụ: ảnh chụp bình luận), hệ thống sẽ tự động đọc chữ (OCR) và thực hiện phân tích.

## Cấu trúc Dự án

```
sentiment-analysis/
├── index.html              # Trang chính của ứng dụng
├── css/
│   └── style.css          # File CSS tạo kiểu giao diện
├── js/
│   ├── config.js          # Cấu hình API endpoint (không commit lên Git)
│   └── app.js             # Logic JavaScript chính
├── lambda/
│   └── sentiment_function.py  # Code Lambda function (Python)
├── .gitignore             # Danh sách file không đẩy lên Git
└── README.md              # File này
```

## Sơ đồ Kiến trúc Hệ thống

```
+----------------+
| Người dùng     |
| (Trình duyệt)  |
+----------------+
       |
       | 1. Truy cập trang web
       v
+-----------------------------+                +-------------------------+
| AWS Amplify Hosting         |                | Amazon API Gateway      |
| (Frontend: HTML, JS, CSS)   |--------------->| (REST API /analyze)     |
| - CI/CD từ GitHub           | 2. POST request +-------------------------+
+-----------------------------+                | 3. Trigger Lambda
                                                v
                                       +-------------------------+
                                       | AWS Lambda Function     |
                                       | (Python + boto3)        |
                                       +-------------------------+
                                          |                    |
                    4a. Detect language   |                    | 4b. Translate (nếu cần)
                                          v                    v
                                  +------------------+   +------------------+
                                  | AWS Comprehend   |   | Amazon Translate |
                                  | - Sentiment      |   | (vi → en)        |
                                  | - Entities       |   +------------------+
                                  | - Key Phrases    |
                                  +------------------+

<-- 5. Trả kết quả JSON về frontend theo chiều ngược lại -->

```

**Luồng hoạt động chi tiết:**

1.  **Frontend (AWS Amplify):** 
    - Xây dựng bằng HTML, CSS, JavaScript thuần (vanilla JS - không dùng framework)
    - Triển khai trên **AWS Amplify Hosting** với CI/CD tự động từ GitHub
    - File `js/config.js` chứa API endpoint (được gitignore để bảo mật)
    
2.  **API Gateway:** 
    - Cung cấp REST API endpoint `/analyze` với phương thức POST
    - Nhận request JSON từ frontend và trigger Lambda function
    - Bật CORS để cho phép frontend gọi API
    
3.  **AWS Lambda (Backend Logic):** 
    - Runtime: Python 3.x với thư viện boto3
    - **Bước 1:** Parse request body để lấy văn bản
    - **Bước 2:** Gọi `comprehend.detect_dominant_language()` để phát hiện ngôn ngữ
    - **Bước 3:** Nếu ngôn ngữ không nằm trong 12 ngôn ngữ hỗ trợ, gọi `translate.translate_text()` để dịch sang tiếng Anh
    - **Bước 4:** Gọi song song 3 API của Comprehend:
        - `detect_sentiment()` → Cảm xúc + điểm số
        - `detect_entities()` → Thực thể (người, địa điểm, tổ chức...)
        - `detect_key_phrases()` → Cụm từ khóa
    - **Bước 5:** Format và trả về JSON response với CORS headers
    
4.  **AWS Comprehend:** 
    - Dịch vụ AI/ML cốt lõi để phân tích văn bản
    - Hỗ trợ 12 ngôn ngữ chính cho sentiment analysis
    
5.  **Amazon Translate:** 
    - Tự động dịch các ngôn ngữ không được hỗ trợ (như tiếng Việt) sang tiếng Anh
    - Đảm bảo độ chính xác cao cho phân tích
    
6.  **AWS IAM:** 
    - Quản lý quyền truy cập: Lambda cần permissions cho Comprehend, Translate và CloudWatch Logs

## Hướng dẫn cài đặt và chạy dự án (dành cho người phát triển)

### Yêu cầu
*   Tài khoản AWS
*   Cài đặt Git
*   Node.js (để chạy các công cụ frontend nếu cần)
*   Python 3.9+ (cho backend Lambda)

### Triển khai Backend
1.  Tạo IAM Role với các policy `AWSLambdaBasicExecutionRole`, `ComprehendReadOnly`, `TranslateReadOnly`.
2.  Tạo Lambda Function, chọn runtime Python và gán Role đã tạo.
3.  Dán code từ file `lambda/sentiment_function.py` vào trình soạn thảo code của Lambda.
4.  Tạo REST API trên API Gateway, tạo resource `/analyze` với phương thức `POST`, tích hợp với Lambda Function.
5.  Kích hoạt CORS và Deploy API.

### Triển khai Frontend
1.  Clone repository này về máy:
    ```bash
    git clone https://github.com/darktheDE/sentiment-analysis.git
    cd sentiment-analysis
    ```
2.  Tạo file `js/config.js` và thêm API endpoint:
    ```javascript
    const API_ENDPOINT = 'https://xxxxxx.execute-api.region.amazonaws.com/prod/analyze';
    ```
    (Thay thế bằng "Invoke URL" thực tế từ API Gateway của bạn)
    
3.  **QUAN TRỌNG:** Đảm bảo file `.gitignore` có dòng `js/config.js` để không push API endpoint lên GitHub.

4.  Test ứng dụng trên máy local (có thể dùng Live Server extension trong VS Code).

5.  Push code lên GitHub repository của bạn:
    ```bash
    git add .
    git commit -m "Initial frontend setup"
    git push origin main
    ```

6.  Trên AWS Console:
    - Vào dịch vụ **AWS Amplify**
    - Chọn "New app" → "Host web app"
    - Kết nối với GitHub repository
    - Amplify sẽ tự động deploy mỗi khi có git push

## Hướng dẫn sử dụng

1.  Truy cập URL ứng dụng (được cung cấp bởi AWS Amplify sau khi deploy).
2.  Nhập một đoạn văn bản vào ô textarea. Hỗ trợ nhiều ngôn ngữ:
    - Tiếng Anh, Tây Ban Nha, Pháp, Đức, Ý, Bồ Đào Nha
    - Tiếng Ả Rập, Hindi, Nhật, Hàn, Trung Quốc
    - Tiếng Việt (sẽ tự động dịch sang tiếng Anh trước khi phân tích)
3.  Nhấn nút **"Phân tích"**.
4.  Xem kết quả hiển thị:
    - **Cảm xúc:** Tích cực/Tiêu cực/Trung tính/Hỗn hợp với phần trăm độ tin cậy
    - **Thực thể:** Bảng các tên người, tổ chức, địa điểm được phát hiện
    - **Từ khóa:** Danh sách các cụm từ quan trọng

### Ví dụ văn bản để test:
```
Amazon Web Services is a great cloud platform. Jeff Bezos is the founder of Amazon, which is headquartered in Seattle.
```
**Kết quả mong đợi:** 
- Sentiment: POSITIVE (89%)
- Entities: AWS, Jeff Bezos, Amazon, Seattle
- Key Phrases: great cloud platform, founder, etc.

## Công nghệ sử dụng

### Frontend
- HTML5, CSS3, JavaScript (Vanilla JS - không dùng framework)
- AWS Amplify Hosting với CI/CD

### Backend
- AWS Lambda (Python 3.x)
- AWS API Gateway (REST API)
- Thư viện: `boto3` (AWS SDK for Python)

### AI/ML Services
- AWS Comprehend (Sentiment Analysis, Entity Recognition, Key Phrase Extraction)
- Amazon Translate (Dịch tự động)

### Security & IAM
- IAM Roles với least-privilege permissions
- CORS configuration
- API secrets management với `.gitignore`

## Lưu ý quan trọng

⚠️ **Bảo mật:** Không bao giờ commit file `js/config.js` chứa API endpoint lên GitHub. File này phải được thêm vào `.gitignore`.

💡 **Chi phí:** Dự án sử dụng AWS Free Tier. Lưu ý giới hạn:
- Comprehend: 50,000 units/tháng (3 tháng đầu)
- Translate: 2 triệu ký tự/tháng (12 tháng đầu)
- Lambda: 1 triệu request miễn phí/tháng

📚 **Tài liệu tham khảo:**
- [AWS Comprehend Documentation](https://docs.aws.amazon.com/comprehend/)
- [AWS Lambda Python](https://docs.aws.amazon.com/lambda/latest/dg/lambda-python.html)
- [AWS Amplify Hosting](https://docs.aws.amazon.com/amplify/)

---
_Dự án được thực hiện trong khuôn khổ môn học **Điện toán đám mây (CLCO432779)** - HCMUTE, Học kỳ 5 (2025-2026)._
