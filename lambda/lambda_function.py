import json
import boto3


comprehend = boto3.client('comprehend')
translate = boto3.client('translate')


SUPPORTED_SENTIMENT_LANGUAGES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ar', 'hi', 'ja', 'ko', 'zh', 'zh-TW']


def lambda_handler(event, context):
    try:
        # 1. Lấy văn bản
        body = json.loads(event['body'])
        original_text = body['text']


        if not original_text.strip():
            raise ValueError("Input text cannot be empty.")


        # 2. Phát hiện ngôn ngữ gốc
        lang_response = comprehend.detect_dominant_language(Text=original_text)
        dominant_language = lang_response['Languages'][0]['LanguageCode']
        
        text_for_analysis = original_text
        analysis_language = dominant_language
        translation_info = None


        # 3. Dịch nếu cần
        if dominant_language not in SUPPORTED_SENTIMENT_LANGUAGES:
            translate_response = translate.translate_text(
                Text=original_text,
                SourceLanguageCode=dominant_language,
                TargetLanguageCode='en'
            )
            text_for_analysis = translate_response['TranslatedText']
            analysis_language = 'en'
            translation_info = f"Translated from {dominant_language} to {analysis_language} for analysis."


        # --- BẮT ĐẦU NÂNG CẤP MỚI ---


        # 4. Thực hiện song song 3 tác vụ phân tích
        # Sử dụng boto3 để gọi các API
        sentiment_response = comprehend.detect_sentiment(Text=text_for_analysis, LanguageCode=analysis_language)
        entities_response = comprehend.detect_entities(Text=text_for_analysis, LanguageCode=analysis_language)
        key_phrases_response = comprehend.detect_key_phrases(Text=text_for_analysis, LanguageCode=analysis_language)


        # 5. Trích xuất kết quả từ các response
        sentiment = sentiment_response.get('Sentiment', 'UNKNOWN')
        scores = sentiment_response.get('SentimentScore', {})
        
        entities = entities_response.get('Entities', [])
        # Chỉ lấy các thông tin cần thiết từ entities
        simple_entities = [{'text': entity['Text'], 'type': entity['Type'], 'score': entity['Score']} for entity in entities]


        key_phrases = key_phrases_response.get('KeyPhrases', [])
        # Chỉ lấy các thông tin cần thiết từ key_phrases
        simple_key_phrases = [{'text': phrase['Text'], 'score': phrase['Score']} for phrase in key_phrases]
        
        # --- KẾT THÚC NÂNG CẤP ---


        # 6. Chuẩn bị response tổng hợp
        response_body = {
            'originalLanguage': dominant_language,
            'analysisLanguage': analysis_language,
            'translationInfo': translation_info,
            'sentiment': sentiment,
            'scores': scores,
            'entities': simple_entities,       # Thêm entities vào response
            'keyPhrases': simple_key_phrases  # Thêm key phrases vào response
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
            'body': json.dumps(response_body, ensure_ascii=False) # ensure_ascii=False để hiển thị tiếng Việt đúng
        }


    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
            'body': json.dumps({'error': str(e)})
        }
