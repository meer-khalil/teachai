# Flask AI Testing Configuration - TeachAI Python Services
import pytest
import sys
import os
from unittest.mock import Mock, patch, MagicMock
import tempfile
import shutil
from pathlib import Path

# Add the parent directory to the Python path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Test configuration
pytest_plugins = []

def pytest_configure(config):
    """Configure pytest with custom markers and settings"""
    config.addinivalue_line(
        "markers", "unit: mark test as a unit test"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as an integration test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )
    config.addinivalue_line(
        "markers", "ai_service: mark test as AI service related"
    )

@pytest.fixture(scope="session")
def app():
    """Create application instance for testing"""
    from app import create_app
    
    # Create test app with testing configuration
    app = create_app('testing')
    
    # Create test client
    app_context = app.app_context()
    app_context.push()
    
    yield app
    
    app_context.pop()

@pytest.fixture(scope="function")
def client(app):
    """Create test client for API requests"""
    return app.test_client()

@pytest.fixture(scope="function")
def temp_dir():
    """Create temporary directory for test files"""
    temp_directory = tempfile.mkdtemp()
    yield temp_directory
    shutil.rmtree(temp_directory)

@pytest.fixture(scope="function")
def sample_files(temp_dir):
    """Create sample files for testing"""
    files = {}
    
    # Sample text file
    text_file = Path(temp_dir) / "sample.txt"
    text_file.write_text("This is a sample text file for testing.")
    files['text'] = str(text_file)
    
    # Sample PDF content (mock)
    pdf_file = Path(temp_dir) / "sample.pdf"
    pdf_file.write_bytes(b"Sample PDF content for testing")
    files['pdf'] = str(pdf_file)
    
    # Sample CSV file
    csv_file = Path(temp_dir) / "sample.csv"
    csv_file.write_text("name,age,grade\nJohn,15,10\nJane,16,11")
    files['csv'] = str(csv_file)
    
    return files

@pytest.fixture
def mock_openai_client():
    """Mock OpenAI client for testing"""
    with patch('openai.OpenAI') as mock_client:
        mock_instance = MagicMock()
        mock_client.return_value = mock_instance
        
        # Mock chat completions
        mock_instance.chat.completions.create.return_value = MagicMock(
            choices=[MagicMock(
                message=MagicMock(content="Test AI response")
            )]
        )
        
        # Mock embeddings
        mock_instance.embeddings.create.return_value = MagicMock(
            data=[MagicMock(embedding=[0.1] * 1536)]
        )
        
        yield mock_instance

@pytest.fixture
def mock_youtube_transcript():
    """Mock YouTube transcript API"""
    with patch('youtube_transcript_api.YouTubeTranscriptApi') as mock_api:
        mock_api.get_transcript.return_value = [
            {'text': 'Hello, this is a test video transcript.', 'start': 0.0, 'duration': 5.0},
            {'text': 'This is the second part of the transcript.', 'start': 5.0, 'duration': 4.0}
        ]
        yield mock_api

@pytest.fixture
def sample_quiz_data():
    """Sample quiz data for testing"""
    return {
        'subject': 'Mathematics',
        'topic': 'Algebra',
        'difficulty': 'intermediate',
        'num_questions': 5,
        'question_types': ['multiple_choice', 'short_answer']
    }

@pytest.fixture
def sample_lesson_data():
    """Sample lesson plan data for testing"""
    return {
        'subject': 'Science',
        'topic': 'Photosynthesis',
        'grade': '9',
        'duration': '45 minutes',
        'learning_objectives': [
            'Understand the process of photosynthesis',
            'Identify the components needed for photosynthesis'
        ]
    }

@pytest.fixture
def sample_presentation_data():
    """Sample presentation data for testing"""
    return {
        'topic': 'Solar System',
        'slides': 10,
        'audience': 'high school',
        'include_images': True,
        'style': 'educational'
    }

@pytest.fixture
def sample_essay_data():
    """Sample essay for grading"""
    return {
        'essay_text': """
        The solar system consists of eight planets orbiting the sun. 
        Mercury is the closest planet to the sun, followed by Venus, 
        Earth, and Mars. These are called the inner planets. 
        The outer planets include Jupiter, Saturn, Uranus, and Neptune.
        """,
        'topic': 'Solar System',
        'grade_level': '8',
        'criteria': ['content', 'grammar', 'structure', 'creativity']
    }

@pytest.fixture
def mock_file_upload():
    """Mock file upload for testing"""
    from io import BytesIO
    from werkzeug.datastructures import FileStorage
    
    def create_mock_file(filename, content, content_type='text/plain'):
        return FileStorage(
            stream=BytesIO(content.encode() if isinstance(content, str) else content),
            filename=filename,
            content_type=content_type
        )
    
    return create_mock_file

@pytest.fixture
def authenticated_headers():
    """Headers for authenticated requests"""
    return {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
    }

@pytest.fixture(autouse=True)
def setup_test_environment():
    """Set up test environment variables"""
    test_env = {
        'FLASK_ENV': 'testing',
        'OPENAI_API_KEY': 'test-api-key',
        'TESTING': 'True',
        'WTF_CSRF_ENABLED': 'False'
    }
    
    # Store original values
    original_values = {}
    for key, value in test_env.items():
        original_values[key] = os.environ.get(key)
        os.environ[key] = value
    
    yield
    
    # Restore original values
    for key, original_value in original_values.items():
        if original_value is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = original_value

@pytest.fixture
def mock_cache():
    """Mock Redis cache for testing"""
    cache_data = {}
    
    class MockCache:
        def get(self, key):
            return cache_data.get(key)
        
        def set(self, key, value, timeout=None):
            cache_data[key] = value
            return True
        
        def delete(self, key):
            return cache_data.pop(key, None) is not None
        
        def clear(self):
            cache_data.clear()
            return True
    
    return MockCache()

@pytest.fixture
def cleanup_files():
    """Cleanup generated files after tests"""
    files_to_cleanup = []
    
    def add_file(filepath):
        files_to_cleanup.append(filepath)
    
    yield add_file
    
    # Cleanup
    for filepath in files_to_cleanup:
        try:
            if os.path.exists(filepath):
                if os.path.isfile(filepath):
                    os.remove(filepath)
                elif os.path.isdir(filepath):
                    shutil.rmtree(filepath)
        except Exception as e:
            print(f"Warning: Could not cleanup {filepath}: {e}")

# Custom test utilities
class TestUtils:
    """Utility class for common test operations"""
    
    @staticmethod
    def create_test_response(data=None, status_code=200, message="Success"):
        """Create a standardized test response"""
        return {
            'success': status_code < 400,
            'data': data,
            'message': message,
            'status_code': status_code
        }
    
    @staticmethod
    def assert_api_response(response, expected_status=200):
        """Assert API response format and status"""
        assert response.status_code == expected_status
        
        if response.content_type == 'application/json':
            json_data = response.get_json()
            assert 'success' in json_data
            assert isinstance(json_data['success'], bool)
            
            if json_data['success']:
                assert json_data['success'] == (expected_status < 400)
    
    @staticmethod
    def create_mock_ai_response(content, model="gpt-3.5-turbo"):
        """Create mock AI response object"""
        return MagicMock(
            choices=[MagicMock(
                message=MagicMock(content=content)
            )],
            model=model,
            usage=MagicMock(
                prompt_tokens=100,
                completion_tokens=50,
                total_tokens=150
            )
        )

# Make test utilities available globally
@pytest.fixture
def test_utils():
    """Provide test utilities to tests"""
    return TestUtils

# Configure logging for tests
import logging
logging.basicConfig(level=logging.DEBUG)

print("🧪 Flask AI test environment setup complete")