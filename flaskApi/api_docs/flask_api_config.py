# Flask AI Services API Configuration - TeachAI Platform
from flask import Flask
from flask_restx import Api, Resource, fields, Namespace
from marshmallow import Schema, fields as ma_fields, validate
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_api_documentation(app):
    """Create Flask-RESTX API documentation for TeachAI AI Services"""
    
    # API configuration
    api = Api(
        app,
        version='1.0',
        title='TeachAI AI Services API',
        description='''
        Comprehensive AI-powered educational services API for the TeachAI platform.
        
        ## Features
        - Quiz generation with multiple question types
        - Lesson plan creation aligned with curriculum standards  
        - Essay grading with detailed feedback
        - Content analysis (plagiarism detection, AI detection)
        - File processing (PDF analysis, content extraction)
        - YouTube video transcript analysis
        - AI-powered presentation generation
        
        ## Authentication
        Most endpoints require API key authentication via the X-API-KEY header.
        
        ## Rate Limits
        - Quiz generation: 20 requests/hour per user
        - Essay grading: 10 requests/hour per user
        - File processing: 5 requests/hour per user
        - General endpoints: 100 requests/hour per user
        
        ## Support
        For technical support: support@teachai.com
        ''',
        doc='/docs/',
        contact='TeachAI Support Team',
        contact_email='support@teachai.com',
        license='MIT',
        license_url='https://opensource.org/licenses/MIT'
    )
    
    # API namespaces for organization
    quiz_ns = api.namespace('quiz', description='Quiz generation and management')
    lesson_ns = api.namespace('lesson', description='Lesson plan creation')
    grade_ns = api.namespace('grade', description='Essay grading services')
    analyze_ns = api.namespace('analyze', description='Content analysis tools')
    file_ns = api.namespace('file', description='File processing services')
    youtube_ns = api.namespace('youtube', description='YouTube content analysis')
    presentation_ns = api.namespace('presentation', description='AI presentation generation')
    
    # Common response models
    success_response = api.model('SuccessResponse', {
        'success': fields.Boolean(required=True, description='Request success status', example=True),
        'data': fields.Raw(description='Response data'),
        'message': fields.String(description='Success message', example='Operation completed successfully'),
        'timestamp': fields.DateTime(description='Response timestamp'),
        'requestId': fields.String(description='Unique request identifier')
    })
    
    error_response = api.model('ErrorResponse', {
        'success': fields.Boolean(required=True, description='Request success status', example=False),
        'message': fields.String(required=True, description='Error message', example='Invalid input provided'),
        'error': fields.String(description='Error code', example='VALIDATION_ERROR'),
        'details': fields.Raw(description='Additional error details'),
        'timestamp': fields.DateTime(description='Error timestamp'),
        'requestId': fields.String(description='Unique request identifier')
    })
    
    # Quiz generation models
    quiz_request = api.model('QuizRequest', {
        'subject': fields.String(required=True, description='Educational subject', example='Mathematics'),
        'topic': fields.String(required=True, description='Specific topic within subject', example='Algebra'),
        'difficulty': fields.String(required=True, description='Difficulty level', enum=['beginner', 'intermediate', 'advanced'], example='intermediate'),
        'num_questions': fields.Integer(required=True, description='Number of questions to generate', min=1, max=50, example=10),
        'question_types': fields.List(fields.String, description='Types of questions to include', example=['multiple_choice', 'short_answer']),
        'grade_level': fields.String(description='Target grade level', example='10'),
        'duration': fields.String(description='Expected quiz duration', example='30 minutes'),
        'include_explanations': fields.Boolean(description='Include answer explanations', default=True, example=True)
    })
    
    quiz_question = api.model('QuizQuestion', {
        'id': fields.Integer(description='Question number', example=1),
        'question': fields.String(required=True, description='Question text', example='What is the solution to x + 5 = 12?'),
        'type': fields.String(required=True, description='Question type', enum=['multiple_choice', 'short_answer', 'true_false', 'fill_blank'], example='multiple_choice'),
        'options': fields.List(fields.String, description='Answer options (for multiple choice)', example=['x = 5', 'x = 7', 'x = 17', 'x = 2']),
        'correct_answer': fields.String(required=True, description='Correct answer', example='x = 7'),
        'explanation': fields.String(description='Answer explanation', example='Subtract 5 from both sides: x = 12 - 5 = 7'),
        'points': fields.Integer(description='Points for correct answer', example=1),
        'difficulty': fields.String(description='Question difficulty', example='intermediate')
    })
    
    quiz_response = api.model('QuizResponse', {
        'quiz': fields.Nested(api.model('Quiz', {
            'id': fields.String(description='Unique quiz identifier', example='quiz_64a1b2c3d4e5f6789012345'),
            'title': fields.String(description='Generated quiz title', example='Mathematics Quiz - Algebra'),
            'subject': fields.String(description='Quiz subject', example='Mathematics'),
            'topic': fields.String(description='Quiz topic', example='Algebra'),
            'difficulty': fields.String(description='Quiz difficulty level', example='intermediate'),
            'total_questions': fields.Integer(description='Number of questions', example=10),
            'estimated_time': fields.String(description='Estimated completion time', example='25 minutes'),
            'total_points': fields.Integer(description='Total possible points', example=10),
            'questions': fields.List(fields.Nested(quiz_question), description='Quiz questions'),
            'instructions': fields.String(description='Quiz instructions'),
            'created_at': fields.DateTime(description='Quiz creation timestamp')
        }))
    })
    
    # Lesson plan models
    lesson_request = api.model('LessonPlanRequest', {
        'subject': fields.String(required=True, description='Educational subject', example='Science'),
        'topic': fields.String(required=True, description='Lesson topic', example='Photosynthesis'),
        'grade_level': fields.String(required=True, description='Target grade level', example='9'),
        'duration': fields.String(required=True, description='Lesson duration', example='45 minutes'),
        'learning_objectives': fields.List(fields.String, description='Learning objectives', example=['Understand the process of photosynthesis', 'Identify factors affecting photosynthesis']),
        'curriculum_standard': fields.String(description='Curriculum standard alignment', example='NGSS 5-LS1-1'),
        'classroom_size': fields.Integer(description='Expected class size', example=25),
        'available_resources': fields.List(fields.String, description='Available teaching resources', example=['projector', 'lab equipment', 'worksheets'])
    })
    
    lesson_response = api.model('LessonPlanResponse', {
        'lesson_plan': fields.Nested(api.model('LessonPlan', {
            'id': fields.String(description='Unique lesson plan ID', example='lesson_64a1b2c3d4e5f6789012346'),
            'title': fields.String(description='Lesson title', example='Understanding Photosynthesis'),
            'subject': fields.String(description='Subject area', example='Science'),
            'topic': fields.String(description='Specific topic', example='Photosynthesis'),
            'grade_level': fields.String(description='Target grade', example='9'),
            'duration': fields.String(description='Lesson duration', example='45 minutes'),
            'learning_objectives': fields.List(fields.String, description='Learning objectives'),
            'materials_needed': fields.List(fields.String, description='Required materials'),
            'lesson_structure': fields.Nested(api.model('LessonStructure', {
                'opening': fields.String(description='Lesson opening activity'),
                'introduction': fields.String(description='Topic introduction'),
                'main_activity': fields.String(description='Main learning activity'),
                'guided_practice': fields.String(description='Guided practice session'),
                'independent_practice': fields.String(description='Independent practice'),
                'closure': fields.String(description='Lesson closure and summary'),
                'assessment': fields.String(description='Assessment method')
            })),
            'differentiation': fields.String(description='Differentiation strategies'),
            'extension_activities': fields.List(fields.String, description='Optional extension activities'),
            'homework_assignment': fields.String(description='Homework assignment'),
            'standards_alignment': fields.List(fields.String, description='Curriculum standards'),
            'created_at': fields.DateTime(description='Creation timestamp')
        }))
    })
    
    # Essay grading models
    essay_request = api.model('EssayGradingRequest', {
        'essay_text': fields.String(required=True, description='Essay content to grade', example='The solar system consists of eight planets...'),
        'topic': fields.String(required=True, description='Essay topic or prompt', example='Describe the solar system'),
        'grade_level': fields.String(required=True, description='Student grade level', example='8'),
        'criteria': fields.List(fields.String, description='Grading criteria', example=['content', 'grammar', 'structure', 'creativity']),
        'max_points': fields.Integer(description='Maximum possible points', default=100, example=100),
        'rubric_type': fields.String(description='Rubric type to use', enum=['standard', 'detailed', 'custom'], default='standard')
    })
    
    essay_response = api.model('EssayGradingResponse', {
        'grading_result': fields.Nested(api.model('EssayGradingResult', {
            'id': fields.String(description='Grading session ID', example='grade_64a1b2c3d4e5f6789012347'),
            'overall_score': fields.Integer(description='Overall essay score', example=85),
            'letter_grade': fields.String(description='Letter grade', example='B+'),
            'category_scores': fields.Nested(api.model('CategoryScores', {
                'content': fields.Integer(description='Content score', example=88),
                'grammar': fields.Integer(description='Grammar score', example=82),
                'structure': fields.Integer(description='Structure score', example=90),
                'creativity': fields.Integer(description='Creativity score', example=80)
            })),
            'detailed_feedback': fields.String(description='Comprehensive feedback', example='Strong content knowledge with room for improvement in grammar...'),
            'strengths': fields.List(fields.String, description='Essay strengths', example=['Clear thesis statement', 'Good use of examples']),
            'areas_for_improvement': fields.List(fields.String, description='Areas to improve', example=['Grammar and punctuation', 'Paragraph transitions']),
            'suggestions': fields.List(fields.String, description='Specific suggestions', example=['Review comma usage rules', 'Add transition sentences']),
            'word_count': fields.Integer(description='Essay word count', example=350),
            'reading_level': fields.String(description='Estimated reading level', example='Grade 8.5'),
            'graded_at': fields.DateTime(description='Grading timestamp')
        }))
    })
    
    # File processing models
    file_upload = api.model('FileUpload', {
        'file_type': fields.String(description='Type of file uploaded', enum=['pdf', 'docx', 'txt'], example='pdf'),
        'processing_type': fields.String(description='Type of processing requested', enum=['extract_text', 'summarize', 'analyze'], example='extract_text'),
        'language': fields.String(description='Document language', default='english', example='english')
    })
    
    file_response = api.model('FileProcessingResponse', {
        'processing_result': fields.Nested(api.model('FileProcessingResult', {
            'id': fields.String(description='Processing session ID', example='file_64a1b2c3d4e5f6789012348'),
            'filename': fields.String(description='Original filename', example='document.pdf'),
            'file_type': fields.String(description='File type', example='pdf'),
            'extracted_text': fields.String(description='Extracted text content'),
            'summary': fields.String(description='Document summary (if requested)'),
            'key_points': fields.List(fields.String, description='Key points identified'),
            'word_count': fields.Integer(description='Document word count', example=1250),
            'page_count': fields.Integer(description='Number of pages', example=5),
            'language_detected': fields.String(description='Detected language', example='english'),
            'processed_at': fields.DateTime(description='Processing timestamp')
        }))
    })
    
    # YouTube analysis models
    youtube_request = api.model('YouTubeAnalysisRequest', {
        'video_url': fields.String(required=True, description='YouTube video URL', example='https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
        'analysis_type': fields.String(required=True, description='Type of analysis', enum=['transcript', 'summary', 'quiz', 'notes'], example='summary'),
        'language': fields.String(description='Transcript language', default='en', example='en'),
        'include_timestamps': fields.Boolean(description='Include timestamp markers', default=True)
    })
    
    youtube_response = api.model('YouTubeAnalysisResponse', {
        'analysis_result': fields.Nested(api.model('YouTubeAnalysisResult', {
            'id': fields.String(description='Analysis session ID', example='yt_64a1b2c3d4e5f6789012349'),
            'video_id': fields.String(description='YouTube video ID', example='dQw4w9WgXcQ'),
            'video_title': fields.String(description='Video title', example='Educational Video Title'),
            'duration': fields.String(description='Video duration', example='12:34'),
            'transcript': fields.String(description='Full video transcript'),
            'summary': fields.String(description='Video summary'),
            'key_points': fields.List(fields.String, description='Key learning points'),
            'timestamps': fields.List(fields.Nested(api.model('Timestamp', {
                'time': fields.String(description='Timestamp', example='02:15'),
                'topic': fields.String(description='Topic at timestamp', example='Introduction to photosynthesis')
            }))),
            'language': fields.String(description='Transcript language', example='en'),
            'analyzed_at': fields.DateTime(description='Analysis timestamp')
        }))
    })
    
    # Register quiz endpoints
    @quiz_ns.route('/generate')
    class QuizGeneration(Resource):
        @quiz_ns.doc('generate_quiz')
        @quiz_ns.expect(quiz_request)
        @quiz_ns.marshal_with(quiz_response, code=200, description='Quiz generated successfully')
        @quiz_ns.response(400, 'Invalid input data', error_response)
        @quiz_ns.response(429, 'Rate limit exceeded', error_response)
        def post(self):
            """Generate a new quiz based on specified parameters"""
            pass
    
    @quiz_ns.route('/evaluate')
    class QuizEvaluation(Resource):
        @quiz_ns.doc('evaluate_quiz')
        def post(self):
            """Evaluate quiz answers and provide score"""
            pass
    
    # Register lesson plan endpoints
    @lesson_ns.route('/generate')
    class LessonPlanGeneration(Resource):
        @lesson_ns.doc('generate_lesson_plan')
        @lesson_ns.expect(lesson_request)
        @lesson_ns.marshal_with(lesson_response, code=200, description='Lesson plan generated successfully')
        @lesson_ns.response(400, 'Invalid input data', error_response)
        def post(self):
            """Generate a comprehensive lesson plan"""
            pass
    
    # Register essay grading endpoints
    @grade_ns.route('/essay')
    class EssayGrading(Resource):
        @grade_ns.doc('grade_essay')
        @grade_ns.expect(essay_request)
        @grade_ns.marshal_with(essay_response, code=200, description='Essay graded successfully')
        @grade_ns.response(400, 'Invalid essay data', error_response)
        def post(self):
            """Grade an essay and provide detailed feedback"""
            pass
    
    # Register file processing endpoints
    @file_ns.route('/upload')
    class FileProcessing(Resource):
        @file_ns.doc('process_file')
        @file_ns.expect(file_upload)
        @file_ns.marshal_with(file_response, code=200, description='File processed successfully')
        @file_ns.response(400, 'Invalid file or parameters', error_response)
        def post(self):
            """Upload and process a document file"""
            pass
    
    # Register YouTube analysis endpoints
    @youtube_ns.route('/analyze')
    class YouTubeAnalysis(Resource):
        @youtube_ns.doc('analyze_youtube_video')
        @youtube_ns.expect(youtube_request)
        @youtube_ns.marshal_with(youtube_response, code=200, description='Video analyzed successfully')
        @youtube_ns.response(400, 'Invalid video URL or parameters', error_response)
        def post(self):
            """Analyze YouTube video and extract educational content"""
            pass
    
    # Register content analysis endpoints
    @analyze_ns.route('/plagiarism')
    class PlagiarismCheck(Resource):
        @analyze_ns.doc('check_plagiarism')
        def post(self):
            """Check text for potential plagiarism"""
            pass
    
    @analyze_ns.route('/ai-detection')
    class AIDetection(Resource):
        @analyze_ns.doc('detect_ai_content')
        def post(self):
            """Detect if content was generated by AI"""
            pass
    
    return api

# Marshmallow schemas for request validation
class QuizRequestSchema(Schema):
    """Schema for quiz generation requests"""
    subject = ma_fields.Str(required=True, validate=validate.Length(min=1, max=100))
    topic = ma_fields.Str(required=True, validate=validate.Length(min=1, max=200))
    difficulty = ma_fields.Str(required=True, validate=validate.OneOf(['beginner', 'intermediate', 'advanced']))
    num_questions = ma_fields.Int(required=True, validate=validate.Range(min=1, max=50))
    question_types = ma_fields.List(ma_fields.Str(), missing=['multiple_choice'])
    grade_level = ma_fields.Str(validate=validate.Length(min=1, max=10))
    duration = ma_fields.Str()
    include_explanations = ma_fields.Bool(missing=True)

class LessonPlanRequestSchema(Schema):
    """Schema for lesson plan generation requests"""
    subject = ma_fields.Str(required=True, validate=validate.Length(min=1, max=100))
    topic = ma_fields.Str(required=True, validate=validate.Length(min=1, max=200))
    grade_level = ma_fields.Str(required=True, validate=validate.Length(min=1, max=10))
    duration = ma_fields.Str(required=True)
    learning_objectives = ma_fields.List(ma_fields.Str(), required=True)
    curriculum_standard = ma_fields.Str()
    classroom_size = ma_fields.Int(validate=validate.Range(min=1, max=100))
    available_resources = ma_fields.List(ma_fields.Str())

class EssayGradingRequestSchema(Schema):
    """Schema for essay grading requests"""
    essay_text = ma_fields.Str(required=True, validate=validate.Length(min=50, max=10000))
    topic = ma_fields.Str(required=True, validate=validate.Length(min=1, max=200))
    grade_level = ma_fields.Str(required=True, validate=validate.Length(min=1, max=10))
    criteria = ma_fields.List(ma_fields.Str(), missing=['content', 'grammar', 'structure'])
    max_points = ma_fields.Int(validate=validate.Range(min=1, max=1000), missing=100)
    rubric_type = ma_fields.Str(validate=validate.OneOf(['standard', 'detailed', 'custom']), missing='standard')

class YouTubeAnalysisRequestSchema(Schema):
    """Schema for YouTube video analysis requests"""
    video_url = ma_fields.Url(required=True)
    analysis_type = ma_fields.Str(required=True, validate=validate.OneOf(['transcript', 'summary', 'quiz', 'notes']))
    language = ma_fields.Str(validate=validate.Length(min=2, max=5), missing='en')
    include_timestamps = ma_fields.Bool(missing=True)

# Export schemas for use in route handlers
schemas = {
    'quiz_request': QuizRequestSchema(),
    'lesson_request': LessonPlanRequestSchema(),
    'essay_request': EssayGradingRequestSchema(),
    'youtube_request': YouTubeAnalysisRequestSchema()
}

logger.info("Flask AI Services API documentation configured successfully")