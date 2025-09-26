# 👥 Contributing to TeachAI

Thank you for your interest in contributing to TeachAI! This document provides guidelines and information for contributors who want to help improve this AI-powered educational platform.

## 🌟 **Ways to Contribute**

### 🐛 **Bug Reports**
- Report bugs through [GitHub Issues](https://github.com/meer-khalil/teachai/issues)
- Use the bug report template
- Include detailed reproduction steps
- Provide environment information

### 💡 **Feature Requests**
- Suggest new educational features
- Propose AI model improvements
- Request new integrations
- Share user experience enhancements

### 💻 **Code Contributions**
- Fix bugs and implement features
- Improve AI algorithms
- Enhance user interface
- Optimize performance

### 📚 **Documentation**
- Improve existing documentation
- Add examples and tutorials
- Translate content
- Create video guides

---

## 🚀 **Getting Started**

### **Development Setup**

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/teachai.git
   cd teachai
   ```

2. **Set Up Development Environment**
   ```bash
   # Install frontend dependencies
   npm install --legacy-peer-deps
   
   # Install backend dependencies
   cd backend && npm install
   
   # Set up Python virtual environment
   cd ../flaskApi
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # or venv\Scripts\activate  # Windows
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**
   ```bash
   # Backend
   cp backend/config/config.env.example backend/.env
   # Edit backend/.env with your configuration
   
   # AI Services
   # Edit flaskApi/config.py with your OpenAI API key
   ```

4. **Start Development Servers**
   ```bash
   # Use the development startup script
   .\start-project.bat  # Windows
   ./start-project.sh   # Linux/Mac
   ```

### **Development Workflow**

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b bugfix/issue-number
   ```

2. **Make Changes**
   - Follow coding standards
   - Write comprehensive tests
   - Update documentation

3. **Test Your Changes**
   ```bash
   # Frontend tests
   npm test
   
   # Backend tests
   cd backend && npm test
   
   # AI services tests
   cd flaskApi && python -m pytest
   ```

4. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat: add new lesson planning feature"
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Use the PR template
   - Provide detailed description
   - Link related issues
   - Add screenshots if UI changes

---

## 📝 **Coding Standards**

### **Frontend (React/JavaScript)**

#### **Code Style**
```javascript
// Use ES6+ features
const LessonPlan = ({ topic, grade }) => {
  const [content, setContent] = useState('');
  
  useEffect(() => {
    generateLessonPlan(topic, grade);
  }, [topic, grade]);
  
  return (
    <div className="lesson-plan">
      {/* Component JSX */}
    </div>
  );
};

// Export at bottom
export default LessonPlan;
```

#### **File Naming**
- Components: `PascalCase.jsx` (e.g., `LessonPlanGenerator.jsx`)
- Utilities: `camelCase.js` (e.g., `apiHelpers.js`)
- Constants: `UPPER_SNAKE_CASE.js` (e.g., `API_ENDPOINTS.js`)

#### **Component Structure**
```javascript
// 1. Imports
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// 2. Component definition
const ComponentName = ({ props }) => {
  // 3. State declarations
  const [state, setState] = useState(initialState);
  
  // 4. Effects and lifecycle
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // 5. Event handlers
  const handleSubmit = (e) => {
    // Handler logic
  };
  
  // 6. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

// 7. Export
export default ComponentName;
```

### **Backend (Node.js/Express)**

#### **Code Style**
```javascript
// Controller example
exports.createLessonPlan = asyncErrorHandler(async (req, res, next) => {
  const { topic, grade, duration } = req.body;
  
  // Validation
  if (!topic || !grade) {
    return next(new ErrorHandler('Topic and grade are required', 400));
  }
  
  // Business logic
  const lessonPlan = await LessonPlan.create({
    topic,
    grade,
    duration,
    user: req.user.id
  });
  
  res.status(201).json({
    success: true,
    lessonPlan
  });
});
```

#### **File Structure**
```
controllers/
├── lessonPlanController.js
├── quizController.js
└── userController.js

models/
├── LessonPlan.js
├── Quiz.js
└── User.js

routes/
├── lessonPlanRoute.js
├── quizRoute.js
└── userRoute.js
```

### **AI Services (Python/Flask)**

#### **Code Style**
```python
# Function documentation
def generate_lesson_plan(topic: str, grade: str, language: str = "English") -> dict:
    """
    Generate a comprehensive lesson plan using AI.
    
    Args:
        topic (str): The lesson topic
        grade (str): Target grade level
        language (str): Content language
        
    Returns:
        dict: Generated lesson plan content
        
    Raises:
        ValueError: If required parameters are missing
    """
    if not topic or not grade:
        raise ValueError("Topic and grade are required")
    
    # Implementation
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": LESSON_PLAN_PROMPT},
            {"role": "user", "content": f"Topic: {topic}, Grade: {grade}"}
        ]
    )
    
    return {
        "content": response.choices[0].message.content,
        "topic": topic,
        "grade": grade
    }
```

#### **File Organization**
```python
# Module imports
import os
import json
from typing import Dict, List, Optional

# Third-party imports
import openai
from flask import Flask, request, jsonify

# Local imports
from config import DevelopmentConfig
from utils import create_chat_data
```

---

## 🧪 **Testing Guidelines**

### **Frontend Testing**

#### **Component Tests**
```javascript
// LessonPlan.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import LessonPlan from '../LessonPlan';

describe('LessonPlan Component', () => {
  test('renders lesson plan form', () => {
    render(<LessonPlan />);
    expect(screen.getByText('Create Lesson Plan')).toBeInTheDocument();
  });
  
  test('submits form with valid data', async () => {
    render(<LessonPlan />);
    fireEvent.change(screen.getByLabelText('Topic'), {
      target: { value: 'Photosynthesis' }
    });
    fireEvent.click(screen.getByText('Generate'));
    // Assert expected behavior
  });
});
```

#### **Integration Tests**
```javascript
// api.test.js
import { generateLessonPlan } from '../api/lessonPlan';

describe('Lesson Plan API', () => {
  test('generates lesson plan successfully', async () => {
    const result = await generateLessonPlan({
      topic: 'Math',
      grade: '5th Grade'
    });
    expect(result.success).toBe(true);
    expect(result.lessonPlan).toBeDefined();
  });
});
```

### **Backend Testing**

#### **Controller Tests**
```javascript
// lessonPlan.test.js
const request = require('supertest');
const app = require('../app');

describe('Lesson Plan Routes', () => {
  test('POST /api/v1/lesson-plans creates lesson plan', async () => {
    const response = await request(app)
      .post('/api/v1/lesson-plans')
      .set('Authorization', `Bearer ${token}`)
      .send({
        topic: 'Science',
        grade: '6th Grade'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

### **AI Services Testing**

#### **Unit Tests**
```python
# test_lesson_planner.py
import pytest
from lessonplannerapi import generate_lesson_plan

class TestLessonPlanner:
    def test_generate_lesson_plan_success(self):
        result = generate_lesson_plan(
            topic="Mathematics",
            grade="8th Grade",
            language="English"
        )
        assert "content" in result
        assert result["topic"] == "Mathematics"
    
    def test_generate_lesson_plan_missing_params(self):
        with pytest.raises(ValueError):
            generate_lesson_plan("", "8th Grade", "English")
```

---

## 📋 **Pull Request Guidelines**

### **PR Template**
```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings introduced

## Screenshots (if applicable)
Add screenshots for UI changes

## Related Issues
Closes #123
```

### **PR Review Process**

1. **Automated Checks**
   - CI/CD pipeline passes
   - Code quality checks pass
   - Security scans complete

2. **Code Review**
   - At least one reviewer approval
   - All comments addressed
   - No merge conflicts

3. **Testing**
   - All tests pass
   - Manual testing completed
   - Performance impact assessed

---

## 🏗️ **Architecture Contribution**

### **Adding New Features**

#### **Frontend Features**
1. Create component in appropriate directory
2. Add routing if needed
3. Connect to backend APIs
4. Add tests and documentation

#### **Backend APIs**
1. Create controller function
2. Add route definition
3. Update database models if needed
4. Add validation and error handling

#### **AI Features**
1. Implement core AI logic
2. Add Flask route
3. Handle streaming responses
4. Add caching if appropriate

### **Database Changes**

#### **Schema Updates**
```javascript
// models/NewModel.js
const mongoose = require('mongoose');

const newModelSchema = new mongoose.Schema({
  field1: {
    type: String,
    required: true,
    maxlength: 100
  },
  field2: {
    type: Date,
    default: Date.now
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('NewModel', newModelSchema);
```

#### **Migration Scripts**
```javascript
// migrations/001_add_new_field.js
const mongoose = require('mongoose');

module.exports = {
  async up() {
    await mongoose.connection.collection('lessons')
      .updateMany({}, { $set: { newField: 'defaultValue' } });
  },
  
  async down() {
    await mongoose.connection.collection('lessons')
      .updateMany({}, { $unset: { newField: '' } });
  }
};
```

---

## 🔧 **Development Tools**

### **Required Tools**
- **Node.js 18+** - JavaScript runtime
- **Python 3.11+** - AI services
- **MongoDB** - Database
- **Git** - Version control
- **VS Code** - Recommended editor

### **Recommended Extensions**
```json
{
  "recommendations": [
    "ms-python.python",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-python.flake8",
    "ms-toolsai.jupyter"
  ]
}
```

### **Code Formatting**

#### **Prettier Configuration**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false
}
```

#### **ESLint Configuration**
```json
{
  "extends": [
    "react-app",
    "react-app/jest"
  ],
  "rules": {
    "no-unused-vars": "warn",
    "no-console": "warn"
  }
}
```

---

## 📊 **Performance Guidelines**

### **Frontend Performance**
- Use React.memo() for expensive components
- Implement lazy loading for routes
- Optimize images and assets
- Minimize bundle size

### **Backend Performance**
- Use database indexing
- Implement caching strategies
- Optimize API queries
- Use connection pooling

### **AI Services Performance**
- Cache AI responses when appropriate
- Optimize prompt engineering
- Use streaming for long responses
- Implement rate limiting

---

## 🚨 **Issue Reporting**

### **Bug Report Template**
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. iOS]
- Browser [e.g. chrome, safari]
- Version [e.g. 22]

**Additional context**
Any other context about the problem.
```

### **Feature Request Template**
```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions you've considered.

**Educational Context**
How this feature would benefit educators or students.

**Additional context**
Any other context or screenshots.
```

---

## 🏆 **Recognition**

### **Contributors**
We recognize and appreciate all contributors:
- Code contributors
- Documentation writers
- Bug reporters
- Feature requesters
- Community supporters

### **Hall of Fame**
Outstanding contributors will be featured in:
- README.md acknowledgments
- Project documentation
- Release notes
- Community highlights

---

## 📞 **Getting Help**

### **Community Channels**
- 💬 **Discord**: Join our developer community
- 📧 **Email**: contribute@teachai.com
- 🐛 **Issues**: GitHub Issues for bugs and features
- 📚 **Docs**: Comprehensive documentation

### **Mentorship Program**
New contributors can get help from experienced team members:
- Code review guidance
- Architecture discussions
- Best practices training
- Career development advice

---

## 📄 **License**

By contributing to TeachAI, you agree that your contributions will be licensed under the MIT License.

---

**🎓 Thank you for helping make TeachAI better for educators worldwide!**

*Every contribution, no matter how small, makes a difference in transforming education through technology.*