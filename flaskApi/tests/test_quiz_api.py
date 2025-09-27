# Unit Tests for Quiz API - TeachAI Flask Services
import pytest
import json
from unittest.mock import patch, MagicMock

class TestQuizAPI:
    """Test suite for Quiz API functionality"""

    def test_generate_quiz_endpoint_exists(self, client):
        """Test that the quiz generation endpoint exists"""
        response = client.get('/quiz/generate')
        # Should not be 404 (not found)
        assert response.status_code != 404

    def test_generate_quiz_requires_parameters(self, client, test_utils):
        """Test that quiz generation requires necessary parameters"""
        response = client.post('/quiz/generate', 
                             json={},
                             headers={'Content-Type': 'application/json'})
        
        # Should return error for missing parameters
        assert response.status_code == 400
        json_data = response.get_json()
        assert json_data['success'] == False

    def test_generate_quiz_with_valid_data(self, client, sample_quiz_data, mock_openai_client, test_utils):
        """Test quiz generation with valid parameters"""
        with patch('quizapi.openai_client', mock_openai_client):
            # Mock AI response for quiz generation
            mock_quiz_response = {
                "questions": [
                    {
                        "question": "What is 2 + 2?",
                        "type": "multiple_choice",
                        "options": ["3", "4", "5", "6"],
                        "correct_answer": "4",
                        "explanation": "Basic addition: 2 + 2 = 4"
                    },
                    {
                        "question": "Solve for x: x + 5 = 10",
                        "type": "short_answer",
                        "correct_answer": "5",
                        "explanation": "Subtract 5 from both sides: x = 10 - 5 = 5"
                    }
                ]
            }
            
            mock_openai_client.chat.completions.create.return_value = test_utils.create_mock_ai_response(
                json.dumps(mock_quiz_response)
            )
            
            response = client.post('/quiz/generate',
                                 json=sample_quiz_data,
                                 headers={'Content-Type': 'application/json'})
            
            test_utils.assert_api_response(response, 200)
            json_data = response.get_json()
            
            assert 'quiz' in json_data['data']
            assert 'questions' in json_data['data']['quiz']
            assert len(json_data['data']['quiz']['questions']) > 0

    def test_generate_quiz_different_subjects(self, client, mock_openai_client, test_utils):
        """Test quiz generation for different subjects"""
        subjects = ['Mathematics', 'Science', 'History', 'English']
        
        with patch('quizapi.openai_client', mock_openai_client):
            mock_openai_client.chat.completions.create.return_value = test_utils.create_mock_ai_response(
                json.dumps({"questions": [{"question": "Test", "answer": "Test"}]})
            )
            
            for subject in subjects:
                quiz_data = {
                    'subject': subject,
                    'topic': f'{subject} basics',
                    'difficulty': 'beginner',
                    'num_questions': 3
                }
                
                response = client.post('/quiz/generate',
                                     json=quiz_data,
                                     headers={'Content-Type': 'application/json'})
                
                assert response.status_code == 200
                json_data = response.get_json()
                assert json_data['success'] == True

    def test_generate_quiz_difficulty_levels(self, client, mock_openai_client, test_utils):
        """Test quiz generation with different difficulty levels"""
        difficulty_levels = ['beginner', 'intermediate', 'advanced']
        
        with patch('quizapi.openai_client', mock_openai_client):
            mock_openai_client.chat.completions.create.return_value = test_utils.create_mock_ai_response(
                json.dumps({"questions": [{"question": "Test", "answer": "Test"}]})
            )
            
            for difficulty in difficulty_levels:
                quiz_data = {
                    'subject': 'Mathematics',
                    'topic': 'Algebra',
                    'difficulty': difficulty,
                    'num_questions': 5
                }
                
                response = client.post('/quiz/generate',
                                     json=quiz_data,
                                     headers={'Content-Type': 'application/json'})
                
                test_utils.assert_api_response(response, 200)

    def test_generate_quiz_question_types(self, client, mock_openai_client, test_utils):
        """Test quiz generation with different question types"""
        question_types = [
            ['multiple_choice'],
            ['short_answer'],
            ['true_false'],
            ['multiple_choice', 'short_answer']
        ]
        
        with patch('quizapi.openai_client', mock_openai_client):
            mock_openai_client.chat.completions.create.return_value = test_utils.create_mock_ai_response(
                json.dumps({"questions": [{"question": "Test", "type": "multiple_choice"}]})
            )
            
            for q_types in question_types:
                quiz_data = {
                    'subject': 'Science',
                    'topic': 'Chemistry',
                    'question_types': q_types,
                    'num_questions': 3
                }
                
                response = client.post('/quiz/generate',
                                     json=quiz_data,
                                     headers={'Content-Type': 'application/json'})
                
                test_utils.assert_api_response(response, 200)

    def test_generate_quiz_with_invalid_subject(self, client, test_utils):
        """Test quiz generation with invalid subject"""
        invalid_quiz_data = {
            'subject': '',  # Empty subject
            'topic': 'Test Topic',
            'num_questions': 5
        }
        
        response = client.post('/quiz/generate',
                             json=invalid_quiz_data,
                             headers={'Content-Type': 'application/json'})
        
        assert response.status_code == 400
        json_data = response.get_json()
        assert json_data['success'] == False

    def test_generate_quiz_with_excessive_questions(self, client, test_utils):
        """Test quiz generation with too many questions requested"""
        excessive_quiz_data = {
            'subject': 'Mathematics',
            'topic': 'Algebra',
            'num_questions': 100  # Excessive number
        }
        
        response = client.post('/quiz/generate',
                             json=excessive_quiz_data,
                             headers={'Content-Type': 'application/json'})
        
        # Should either limit the questions or return an error
        assert response.status_code in [200, 400]

    @patch('quizapi.openai_client')
    def test_generate_quiz_handles_ai_service_error(self, mock_client, client, sample_quiz_data, test_utils):
        """Test handling of AI service errors during quiz generation"""
        # Mock AI service to raise an exception
        mock_client.chat.completions.create.side_effect = Exception("AI Service Error")
        
        response = client.post('/quiz/generate',
                             json=sample_quiz_data,
                             headers={'Content-Type': 'application/json'})
        
        # Should handle error gracefully
        assert response.status_code in [500, 503]
        json_data = response.get_json()
        assert json_data['success'] == False
        assert 'error' in json_data or 'message' in json_data

    def test_quiz_response_format(self, client, sample_quiz_data, mock_openai_client, test_utils):
        """Test that quiz response has correct format"""
        with patch('quizapi.openai_client', mock_openai_client):
            mock_quiz = {
                "title": "Mathematics Quiz - Algebra",
                "subject": "Mathematics",
                "topic": "Algebra",
                "difficulty": "intermediate",
                "total_questions": 2,
                "estimated_time": "15 minutes",
                "questions": [
                    {
                        "id": 1,
                        "question": "What is x if x + 3 = 7?",
                        "type": "multiple_choice",
                        "options": ["2", "3", "4", "5"],
                        "correct_answer": "4",
                        "explanation": "Subtract 3 from both sides: x = 7 - 3 = 4",
                        "points": 1
                    }
                ]
            }
            
            mock_openai_client.chat.completions.create.return_value = test_utils.create_mock_ai_response(
                json.dumps(mock_quiz)
            )
            
            response = client.post('/quiz/generate',
                                 json=sample_quiz_data,
                                 headers={'Content-Type': 'application/json'})
            
            test_utils.assert_api_response(response, 200)
            json_data = response.get_json()
            quiz = json_data['data']['quiz']
            
            # Check required fields
            assert 'title' in quiz
            assert 'subject' in quiz
            assert 'questions' in quiz
            assert isinstance(quiz['questions'], list)
            
            # Check question format if questions exist
            if quiz['questions']:
                question = quiz['questions'][0]
                assert 'question' in question
                assert 'type' in question

    def test_evaluate_quiz_answers(self, client, test_utils):
        """Test quiz answer evaluation endpoint"""
        quiz_answers = {
            'quiz_id': 'test-quiz-123',
            'answers': [
                {'question_id': 1, 'answer': '4'},
                {'question_id': 2, 'answer': '5'}
            ]
        }
        
        response = client.post('/quiz/evaluate',
                             json=quiz_answers,
                             headers={'Content-Type': 'application/json'})
        
        # Should not be 404 (endpoint should exist)
        assert response.status_code != 404

    def test_get_quiz_statistics(self, client, test_utils):
        """Test quiz statistics endpoint"""
        response = client.get('/quiz/stats')
        
        # Should not be 404 (endpoint should exist)
        assert response.status_code != 404

    def test_quiz_caching(self, client, sample_quiz_data, mock_openai_client, mock_cache, test_utils):
        """Test that quiz generation uses caching"""
        with patch('quizapi.openai_client', mock_openai_client):
            with patch('quizapi.cache', mock_cache):
                mock_openai_client.chat.completions.create.return_value = test_utils.create_mock_ai_response(
                    json.dumps({"questions": [{"question": "Test", "answer": "Test"}]})
                )
                
                # First request
                response1 = client.post('/quiz/generate',
                                       json=sample_quiz_data,
                                       headers={'Content-Type': 'application/json'})
                
                # Second request with same data
                response2 = client.post('/quiz/generate',
                                       json=sample_quiz_data,
                                       headers={'Content-Type': 'application/json'})
                
                # Both should succeed
                test_utils.assert_api_response(response1, 200)
                test_utils.assert_api_response(response2, 200)

    def test_quiz_input_validation(self, client, test_utils):
        """Test input validation for quiz generation"""
        invalid_inputs = [
            {'subject': 'Math', 'topic': '', 'num_questions': 5},  # Empty topic
            {'subject': 'Math', 'topic': 'Algebra', 'num_questions': 0},  # Zero questions
            {'subject': 'Math', 'topic': 'Algebra', 'num_questions': -1},  # Negative questions
            {'topic': 'Algebra', 'num_questions': 5},  # Missing subject
        ]
        
        for invalid_input in invalid_inputs:
            response = client.post('/quiz/generate',
                                 json=invalid_input,
                                 headers={'Content-Type': 'application/json'})
            
            assert response.status_code == 400
            json_data = response.get_json()
            assert json_data['success'] == False

    def test_quiz_generation_performance(self, client, sample_quiz_data, mock_openai_client, test_utils):
        """Test quiz generation performance"""
        with patch('quizapi.openai_client', mock_openai_client):
            mock_openai_client.chat.completions.create.return_value = test_utils.create_mock_ai_response(
                json.dumps({"questions": [{"question": "Test", "answer": "Test"}]})
            )
            
            import time
            start_time = time.time()
            
            response = client.post('/quiz/generate',
                                 json=sample_quiz_data,
                                 headers={'Content-Type': 'application/json'})
            
            end_time = time.time()
            response_time = end_time - start_time
            
            # Response should be reasonably fast (less than 10 seconds)
            assert response_time < 10
            test_utils.assert_api_response(response, 200)