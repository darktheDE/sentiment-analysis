# Ứng dụng Phân tích Cảm xúc Đa Ngôn ngữ (Sentiment Analysis Web App)

Đây là dự án cuối kỳ cho môn học **Điện toán đám mây (CLCO432779)**. Ứng dụng này là một công cụ web sử dụng kiến trúc "serverless" trên nền tảng Amazon Web Services (AWS) để cung cấp khả năng phân tích văn bản thông minh theo thời gian thực.

## Thành viên nhóm

*   **Nguyễn Văn Quang Duy - @quangduyreal** - Chịu trách nhiệm phát triển Backend & Hạ tầng Cloud (AWS).
*   **Đỗ Kiến Hưng - @darktheDE** - Chịu trách nhiệm phát triển Frontend & Tích hợp (UI/UX, Amplify).

## Mục tiêu dự án

Dự án nhằm mục đích xây dựng một ứng dụng web có khả năng:
1.  Nhận một đoạn văn bản từ người dùng.
2.  Sử dụng các dịch vụ AI/ML của AWS để phân tích và trích xuất các thông tin sâu sắc từ văn bản đó.
3.  Hiển thị kết quả một cách trực quan và dễ hiểu cho người dùng.
4.  Chứng minh sự hiểu biết và khả năng vận dụng kiến trúc "serverless" và các mô hình dịch vụ đám mây (IaaS, PaaS, SaaS).

## Các tính năng chính

*   **Phân tích Cảm xúc (Sentiment Analysis):** Xác định cảm xúc tổng thể của văn bản (Tích cực, Tiêu cực, Trung tính) với độ tin cậy chi tiết.
*   **Hỗ trợ Đa ngôn ngữ:** Tự động phát hiện ngôn ngữ của văn bản đầu vào. Đối với các ngôn ngữ không được hỗ trợ phân tích cảm xúc trực tiếp (như tiếng Việt), hệ thống sẽ tự động dịch sang tiếng Anh trước khi phân tích để đảm bảo kết quả chính xác.
*   **Trích xuất Thực thể (Entity Recognition):** Nhận diện và phân loại các thực thể được đặt tên như Tên người, Tổ chức, Địa điểm, Ngày tháng...
*   **Trích xuất Cụm từ khóa (Key Phrase Extraction):** Rút ra các cụm từ quan trọng nhất để tóm tắt nội dung chính của văn bản.
*   **(Tính năng mở rộng - Tùy chọn) Phân tích Cảm xúc từ Hình ảnh:** Cho phép người dùng upload ảnh chứa văn bản (ví dụ: ảnh chụp bình luận), hệ thống sẽ tự động đọc chữ (OCR) và thực hiện phân tích.

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
| S3 Static Website           |                | Amazon API Gateway      |
| (Frontend: HTML, JS, CSS)   |--------------->| (API Endpoint URL)      |
+-----------------------------+ 2. JS gọi API  +-------------------------+
                                                | 3. Trigger Lambda
                                                v
                                       +-------------------------+
                                       | AWS Lambda Function     |
                                       | (Backend Logic)         |
                                       +-------------------------+
                                                | 4. Gọi API Comprehend
                                                v
                                       +-------------------------+
                                       | AWS Comprehend          |
                                       | (Sentiment Analysis)    |
                                       +-------------------------+

<-- Luồng dữ liệu trả về theo chiều ngược lại -->

```

**Luồng hoạt động chính:**
1.  **Frontend:** Được xây dựng bằng HTML, CSS, JavaScript và triển khai trên **AWS Amplify Hosting**. Amplify được kết nối với repository GitHub này để thực hiện CI/CD (triển khai tự động mỗi khi có `git push`).
2.  **API Gateway:** Đóng vai trò cổng giao tiếp, tiếp nhận các request từ frontend và kích hoạt hàm Lambda tương ứng.
3.  **AWS Lambda:** Chứa toàn bộ logic backend (viết bằng Python). Hàm này điều phối việc gọi đến các dịch vụ AI khác.
4.  **AWS Comprehend:** Dịch vụ AI/ML cốt lõi, thực hiện các tác vụ:
    *   `DetectDominantLanguage`
    *   `DetectSentiment`
    *   `DetectEntities`
    *   `DetectKeyPhrases`
5.  **Amazon Translate:** Được sử dụng để dịch văn bản sang tiếng Anh khi ngôn ngữ gốc không được Comprehend hỗ trợ trực tiếp.
6.  **AWS IAM:** Quản lý và phân quyền an toàn, đảm bảo Lambda chỉ có những quyền cần thiết để tương tác với các dịch vụ khác.

## Hướng dẫn cài đặt và chạy dự án (dành cho người phát triển)

### Yêu cầu
*   Tài khoản AWS
*   Cài đặt Git
*   Node.js (để chạy các công cụ frontend nếu cần)
*   Python 3.9+ (cho backend Lambda)

### Triển khai Backend (Phần của Duy)
1.  Tạo IAM Role với các policy `AWSLambdaBasicExecutionRole`, `ComprehendReadOnly`, `TranslateReadOnly`.
2.  Tạo Lambda Function, chọn runtime Python và gán Role đã tạo.
3.  Dán code từ file `lambda/sentiment_function.py` vào trình soạn thảo code của Lambda.
4.  Tạo REST API trên API Gateway, tạo resource `/analyze` với phương thức `POST`, tích hợp với Lambda Function.
5.  Kích hoạt CORS và Deploy API.

### Triển khai Frontend (Phần của Hưng)
1.  Clone repository này về máy.
2.  Mở file `frontend/script.js` và thay thế biến `apiUrl` bằng "Invoke URL" của API Gateway đã deploy.
3.  Tạo repository mới trên GitHub và đẩy code lên.
4.  Trên AWS Console, vào dịch vụ Amplify, kết nối với repository vừa tạo và tiến hành triển khai.

## Hướng dẫn sử dụng

1.  Truy cập vào URL của ứng dụng được cung cấp bởi AWS Amplify.
2.  Nhập một đoạn văn bản bất kỳ (tiếng Anh hoặc tiếng Việt) vào ô "Nhập bình luận".
3.  Nhấn nút "Phân tích".
4.  Chờ trong giây lát và xem kết quả được hiển thị ở các mục Cảm xúc, Thực thể, và Từ khóa.

---
_Dự án được thực hiện trong khuôn khổ môn học Điện toán đám mây - [HCMUTE], [2025-2026]._
