import json
import boto3

# =================================================================
# KHỞI TẠO CÁC CLIENT CHO CÁC DỊCH VỤ AWS
# =================================================================
# Boto3 sẽ tự động tìm kiếm credentials (thông tin đăng nhập) 
# từ IAM Role được gán cho Lambda function này.
comprehend = boto3.client('comprehend')
translate = boto3.client('translate')


# =================================================================
# HÀM HỖ TRỢ ĐỂ CHE THÔNG TIN CÁ NHÂN (PII)
# =================================================================
def redact_pii(text, pii_entities):
    """
    Hàm này nhận vào một chuỗi văn bản và danh sách các thực thể PII,
    sau đó trả về một phiên bản văn bản đã được che đi.
    Ví dụ: 'john.doe@example.com' -> '[EMAIL]****************'
    """
    # Chuyển chuỗi thành danh sách các ký tự để dễ dàng thay đổi
    redacted_text_list = list(text)

    # Duyệt qua từng thực thể PII đã được phát hiện
    for entity in pii_entities:
        start_offset = entity['BeginOffset']
        end_offset = entity['EndOffset']
        pii_type = f"[{entity['Type']}]"  # Ví dụ: [EMAIL], [PHONE]

        # Thay thế các ký tự gốc bằng dấu '*'
        for i in range(start_offset, end_offset):
            redacted_text_list[i] = '*'
        
        # Ghi đè loại PII lên trên các dấu '*'
        for i in range(len(pii_type)):
            if start_offset + i < end_offset:
                redacted_text_list[start_offset + i] = pii_type[i]
                
    return "".join(redacted_text_list)


# =================================================================
# HÀM LAMBDA CHÍNH (MAIN HANDLER)
# =================================================================
def lambda_handler(event, context):
    """
    Hàm chính được trigger bởi API Gateway.
    Nó thực hiện toàn bộ luồng phân tích văn bản.
    """
    try:
        # --- BƯỚC 1: LẤY VÀ KIỂM TRA DỮ LIỆU ĐẦU VÀO ---
        body = json.loads(event.get('body', '{}'))
        original_text = body.get('text', '').strip()

        if not original_text:
            raise ValueError("Input text cannot be empty.")

        # --- BƯỚC 2: PHÁT HIỆN NGÔN NGỮ GỐC ---
        lang_response = comprehend.detect_dominant_language(Text=original_text)
        dominant_language_code = lang_response['Languages'][0]['LanguageCode']
        
        # --- BƯỚC 3: PHÁT HIỆN VÀ CHE THÔNG TIN CÁ NHÂN (PII) ---
        pii_response = comprehend.detect_pii_entities(Text=original_text, LanguageCode=dominant_language_code)
        pii_entities = pii_response.get('Entities', [])
        
        redacted_text = original_text
        simple_pii_list = []
        if pii_entities:
            simple_pii_list = [{'type': pii['Type'], 'score': pii['Score']} for pii in pii_entities]
            redacted_text = redact_pii(original_text, pii_entities)

        # --- BƯỚC 4: DỊCH VĂN BẢN (NẾU CẦN) ĐỂ PHÂN TÍCH ---
        # Chúng ta sẽ phân tích trên văn bản đã được che PII để bảo vệ quyền riêng tư
        text_for_analysis = redacted_text
        analysis_language_code = dominant_language_code
        translation_info = None

        # Luôn dịch sang tiếng Anh để có kết quả phân tích tốt nhất từ Comprehend
        # vì 'en' là ngôn ngữ được hỗ trợ đầy đủ nhất.
        if dominant_language_code != 'en':
            translate_response = translate.translate_text(
                Text=text_for_analysis,
                SourceLanguageCode=dominant_language_code,
                TargetLanguageCode='en'
            )
            text_for_analysis = translate_response['TranslatedText']
            analysis_language_code = 'en'
            translation_info = f"Translated from '{dominant_language_code}' to '{analysis_language_code}' for analysis."

        # --- BƯỚC 5: GỌI CÁC API PHÂN TÍCH TRÊN VĂN BẢN CUỐI CÙNG ---
        sentiment_response = comprehend.detect_sentiment(Text=text_for_analysis, LanguageCode=analysis_language_code)
        entities_response = comprehend.detect_entities(Text=text_for_analysis, LanguageCode=analysis_language_code)
        key_phrases_response = comprehend.detect_key_phrases(Text=text_for_analysis, LanguageCode=analysis_language_code)

        # --- BƯỚC 6: TỔNG HỢP KẾT QUẢ ---
        final_response_body = {
            'originalText': original_text,
            'redactedText': redacted_text if pii_entities else None,
            'detectedPiiEntities': simple_pii_list,
            'detectedLanguage': dominant_language_code,
            'translationInfo': translation_info,
            'analyzedText': text_for_analysis,
            'sentiment': sentiment_response.get('Sentiment', 'UNKNOWN'),
            'sentimentScores': sentiment_response.get('SentimentScore', {}),
            'detectedEntities': [{'text': entity['Text'], 'type': entity['Type']} for entity in entities_response.get('Entities', [])],
            'detectedKeyPhrases': [{'text': phrase['Text']} for phrase in key_phrases_response.get('KeyPhrases', [])]
        }
        
        # --- BƯỚC 7: TRẢ KẾT QUẢ VỀ CHO API GATEWAY ---
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
            # ensure_ascii=False rất quan trọng để hiển thị đúng ký tự tiếng Việt trong JSON
            'body': json.dumps(final_response_body, ensure_ascii=False)
        }

    except Exception as e:
        # Ghi lại lỗi vào log của CloudWatch để dễ dàng gỡ lỗi
        print(f"ERROR: {str(e)}")
        return {
            'statusCode': 500,
            'headers': { 'Access-Control-Allow-Origin': '*' },
            'body': json.dumps({'error': str(e)})
        }
