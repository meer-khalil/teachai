"""
Flask-RESTX API Documentation Configuration for TeachAI Flask Services
Provides comprehensive API documentation with Swagger UI integration
"""

from flask_restx import Api, Resource, fields, Namespace
from marshmallow import Schema, fields as ma_fields, validate, ValidationError
import os
from datetime import datetime
from typing import Dict, Any

# API Configuration
api = Api(
    version='1.0',
    title='TeachAI Flask AI Services API',
    description='''
    ## AI-Powered Educational Services API
    
    This API provides comprehensive AI-powered educational tools including:
    - Quiz and assessment generation
    - Lesson planning and curriculum development  
    - Essay grading and feedback
    - Content analysis and plagiarism detection
    - Educational video analysis
    - Presentation generation
    
    ### Authentication
    Most endpoints require authentication. Include your API key in the request headers:
    ```
    Authorization: Bearer YOUR_API_KEY
    ```
    
    ### Rate Limits
    - Free tier: 10 requests per hour
    - Premium: 1000 requests per hour
    - Processing time varies: 2-30 seconds depending on complexity
    
    ### Error Handling
    All endpoints return consistent error responses with detailed messages and error codes.
    ''',
    doc='/docs/',
    authorizations={
        'Bearer': {
            'type': 'apiKey',
            'in': 'header',
            'name': 'Authorization',
            'description': 'Add a JWT token to the header with ** Bearer &lt;JWT&gt; ** token format'
        }
    },
    security='Bearer',
    contact='support@teachai.com',
    contact_url='https://teachai.com/support',
    license='MIT',
    license_url='https://opensource.org/licenses/MIT'
)

# Define namespaces for different service categories
quiz_ns = api.namespace('quiz', description='Quiz and Assessment Generation Services')
lesson_ns = api.namespace('lesson', description='Lesson Planning and Curriculum Services') 
essay_ns = api.namespace('essay', description='Essay Grading and Content Analysis')
content_ns = api.namespace('content', description='Content Analysis and Verification')
presentation_ns = api.namespace('presentation', description='AI Presentation Generation')
video_ns = api.namespace('video', description='Video Analysis and Educational Content Extraction')
health_ns = api.namespace('health', description='API Health and Status Monitoring')

# Marshmallow Validation Schemas
class QuizGenerationSchema(Schema):
    """Schema for quiz generation requests"""
    topic = ma_fields.Str(required=True, validate=validate.Length(min=1, max=200))
    grade_level = ma_fields.Str(required=True, validate=validate.OneOf([
        'elementary', 'middle_school', 'high_school', 'college',
        '1st grade', '2nd grade', '3rd grade', '4th grade', '5th grade',
        '6th grade', '7th grade', '8th grade', '9th grade', '10th grade',
        '11th grade', '12th grade', 'freshman', 'sophomore', 'junior', 'senior'
    ]))
    num_questions = ma_fields.Int(required=True, validate=validate.Range(min=1, max=50))
    question_types = ma_fields.List(ma_fields.Str(validate=validate.OneOf([
        'multiple_choice', 'true_false', 'short_answer', 'essay', 'fill_blank'
    ])), required=True)
    difficulty = ma_fields.Str(validate=validate.OneOf(['easy', 'medium', 'hard']), missing='medium')
    subject = ma_fields.Str(validate=validate.Length(max=100))
    include_solutions = ma_fields.Bool(missing=True)
    custom_instructions = ma_fields.Str(validate=validate.Length(max=500))

class LessonPlanSchema(Schema):
    """Schema for lesson plan generation requests"""
    subject = ma_fields.Str(required=True, validate=validate.Length(min=1, max=100))
    topic = ma_fields.Str(required=True, validate=validate.Length(min=1, max=200))
    grade_level = ma_fields.Str(required=True)
    duration_minutes = ma_fields.Int(required=True, validate=validate.Range(min=15, max=180))
    learning_objectives = ma_fields.List(ma_fields.Str(), required=True)
    teaching_style = ma_fields.Str(validate=validate.OneOf([
        'lecture', 'interactive', 'hands_on', 'discussion', 'project_based'
    ]), missing='interactive')
    resources_available = ma_fields.List(ma_fields.Str())
    assessment_type = ma_fields.Str(validate=validate.OneOf([
        'formative', 'summative', 'diagnostic', 'peer', 'self'
    ]))

class EssayGradingSchema(Schema):
    """Schema for essay grading requests"""
    essay_text = ma_fields.Str(required=True, validate=validate.Length(min=50, max=10000))
    prompt = ma_fields.Str(required=True, validate=validate.Length(min=10, max=1000))
    grade_level = ma_fields.Str(required=True)
    rubric_criteria = ma_fields.List(ma_fields.Str(validate=validate.OneOf([
        'thesis_clarity', 'evidence_support', 'organization', 'grammar_mechanics',
        'creativity', 'critical_thinking', 'conclusion_strength', 'voice_tone'
    ])), required=True)
    max_score = ma_fields.Int(validate=validate.Range(min=10, max=1000), missing=100)
    detailed_feedback = ma_fields.Bool(missing=True)

# Flask-RESTX Models for API Documentation
quiz_generation_model = api.model('QuizGeneration', {
    'topic': fields.String(required=True, description='Topic for quiz generation', example='Photosynthesis'),
    'grade_level': fields.String(required=True, description='Target grade level', example='10th grade'),
    'num_questions': fields.Integer(required=True, description='Number of questions to generate', example=5),
    'question_types': fields.List(fields.String, required=True, description='Types of questions to include', 
                                 example=['multiple_choice', 'true_false']),
    'difficulty': fields.String(description='Question difficulty level', example='medium', 
                               enum=['easy', 'medium', 'hard']),
    'subject': fields.String(description='Subject area', example='biology'),
    'include_solutions': fields.Boolean(description='Include answer explanations', default=True),
    'custom_instructions': fields.String(description='Additional instructions for generation')
})

quiz_response_model = api.model('QuizResponse', {
    'quiz': fields.Raw(description='Generated quiz object with questions and metadata'),
    'processing_time': fields.Float(description='Time taken to generate quiz in seconds'),
    'question_count': fields.Integer(description='Total number of questions generated'),
    'estimated_completion_time': fields.String(description='Estimated time to complete quiz')
})

lesson_plan_model = api.model('LessonPlan', {
    'subject': fields.String(required=True, description='Subject area', example='Biology'),
    'topic': fields.String(required=True, description='Lesson topic', example='Cell Division'),
    'grade_level': fields.String(required=True, description='Target grade level', example='9th grade'),
    'duration_minutes': fields.Integer(required=True, description='Lesson duration in minutes', example=50),
    'learning_objectives': fields.List(fields.String, required=True, description='Learning objectives',
                                     example=['Understand mitosis process', 'Identify phases of cell division']),
    'teaching_style': fields.String(description='Preferred teaching approach', example='interactive',
                                   enum=['lecture', 'interactive', 'hands_on', 'discussion', 'project_based']),
    'resources_available': fields.List(fields.String, description='Available teaching resources',
                                     example=['microscopes', 'slides', 'projector']),
    'assessment_type': fields.String(description='Type of assessment', example='formative',
                                   enum=['formative', 'summative', 'diagnostic', 'peer', 'self'])
})

lesson_plan_response_model = api.model('LessonPlanResponse', {
    'lesson_plan': fields.Raw(description='Complete lesson plan with activities and timeline'),
    'processing_time': fields.Float(description='Generation time in seconds'),
    'estimated_prep_time': fields.String(description='Estimated preparation time for teacher')
})

essay_grading_model = api.model('EssayGrading', {
    'essay_text': fields.String(required=True, description='Student essay content'),
    'prompt': fields.String(required=True, description='Essay prompt/assignment'),
    'grade_level': fields.String(required=True, description='Student grade level', example='high_school'),
    'rubric_criteria': fields.List(fields.String, required=True, description='Grading criteria',
                                 example=['thesis_clarity', 'evidence_support', 'organization', 'grammar_mechanics']),
    'max_score': fields.Integer(description='Maximum possible score', example=100, default=100),
    'detailed_feedback': fields.Boolean(description='Provide detailed feedback', default=True)
})

essay_grading_response_model = api.model('EssayGradingResponse', {
    'grade': fields.Float(description='Overall grade score'),
    'percentage': fields.Float(description='Grade as percentage'),
    'letter_grade': fields.String(description='Letter grade equivalent'),
    'rubric_scores': fields.Raw(description='Individual rubric criteria scores'),
    'feedback': fields.Raw(description='Detailed feedback and suggestions'),
    'strengths': fields.List(fields.String, description='Essay strengths'),
    'areas_for_improvement': fields.List(fields.String, description='Areas needing improvement'),
    'processing_time': fields.Float(description='Grading time in seconds')
})

# Content Analysis Models
plagiarism_check_model = api.model('PlagiarismCheck', {
    'text': fields.String(required=True, description='Text content to check for plagiarism'),
    'check_online': fields.Boolean(description='Check against online sources', default=True),
    'check_internal_db': fields.Boolean(description='Check against internal database', default=True),
    'detailed_report': fields.Boolean(description='Generate detailed similarity report', default=False)
})

ai_detection_model = api.model('AIDetection', {
    'text': fields.String(required=True, description='Text content to analyze for AI generation'),
    'provide_analysis': fields.Boolean(description='Provide detailed analysis', default=True),
    'detailed_metrics': fields.Boolean(description='Include detailed detection metrics', default=False)
})

# Video Analysis Models  
video_analysis_model = api.model('VideoAnalysis', {
    'youtube_url': fields.String(required=True, description='YouTube video URL'),
    'analysis_type': fields.String(description='Type of analysis to perform', example='educational',
                                  enum=['educational', 'summary', 'quiz_generation', 'key_points']),
    'include_transcript': fields.Boolean(description='Include video transcript', default=True),
    'generate_summary': fields.Boolean(description='Generate content summary', default=True),
    'extract_key_points': fields.Boolean(description='Extract key learning points', default=True),
    'target_grade_level': fields.String(description='Target educational level', example='high_school')
})

# Presentation Generation Models
presentation_model = api.model('PresentationGeneration', {
    'topic': fields.String(required=True, description='Presentation topic'),
    'audience': fields.String(required=True, description='Target audience', example='high school students'),
    'duration_minutes': fields.Integer(required=True, description='Presentation duration', example=30),
    'slide_count': fields.Integer(description='Number of slides to generate', example=15),
    'include_examples': fields.Boolean(description='Include examples and case studies', default=True),
    'include_images': fields.Boolean(description='Include relevant images', default=True),
    'presentation_style': fields.String(description='Presentation style', example='educational',
                                      enum=['educational', 'business', 'academic', 'casual']),
    'key_points': fields.List(fields.String, description='Key points to cover')
})

# Health Check Models
health_response_model = api.model('HealthResponse', {
    'status': fields.String(description='API health status', example='healthy'),
    'version': fields.String(description='API version', example='1.0.0'),
    'timestamp': fields.DateTime(description='Current server time'),
    'services': fields.Raw(description='Individual service status'),
    'uptime': fields.String(description='Service uptime'),
    'memory_usage': fields.Raw(description='Memory usage statistics')
})

# Error Response Models
error_response_model = api.model('ErrorResponse', {
    'error': fields.String(description='Error type'),
    'message': fields.String(description='Error message'),
    'details': fields.Raw(description='Additional error details'),
    'timestamp': fields.DateTime(description='Error timestamp'),
    'request_id': fields.String(description='Request tracking ID')
})

# Validation Helper Functions
def validate_request_data(schema_class, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate request data against Marshmallow schema
    
    Args:
        schema_class: Marshmallow schema class
        data: Request data to validate
        
    Returns:
        Validated and cleaned data
        
    Raises:
        ValidationError: If validation fails
    """
    schema = schema_class()
    try:
        return schema.load(data)
    except ValidationError as e:
        raise ValidationError(f"Validation failed: {e.messages}")

def create_error_response(error_type: str, message: str, details: Any = None) -> Dict[str, Any]:
    """
    Create standardized error response
    
    Args:
        error_type: Type of error
        message: Error message
        details: Additional error details
        
    Returns:
        Standardized error response dictionary
    """
    return {
        'error': error_type,
        'message': message,
        'details': details,
        'timestamp': datetime.utcnow().isoformat(),
        'request_id': os.urandom(8).hex()
    }

# Export commonly used items
__all__ = [
    'api',
    'quiz_ns', 'lesson_ns', 'essay_ns', 'content_ns', 'presentation_ns', 'video_ns', 'health_ns',
    'QuizGenerationSchema', 'LessonPlanSchema', 'EssayGradingSchema',
    'quiz_generation_model', 'quiz_response_model',
    'lesson_plan_model', 'lesson_plan_response_model', 
    'essay_grading_model', 'essay_grading_response_model',
    'plagiarism_check_model', 'ai_detection_model',
    'video_analysis_model', 'presentation_model',
    'health_response_model', 'error_response_model',
    'validate_request_data', 'create_error_response'
]