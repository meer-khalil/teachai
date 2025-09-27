// Cypress Custom Commands - TeachAI E2E Testing

// Authentication Commands
Cypress.Commands.add('loginViaAPI', (email, password) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: { email, password }
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body.success).to.be.true;
    
    const token = response.body.data.token;
    window.localStorage.setItem('auth_token', token);
    window.localStorage.setItem('user', JSON.stringify(response.body.data.user));
    
    return response.body.data;
  });
});

Cypress.Commands.add('loginViaUI', (email, password) => {
  cy.visit('/login');
  cy.get('[data-testid="email-input"]')
    .type(email)
    .should('have.value', email);
  
  cy.get('[data-testid="password-input"]')
    .type(password)
    .should('have.value', password);
  
  cy.get('[data-testid="login-button"]').click();
  
  // Wait for successful login
  cy.url().should('not.include', '/login');
  cy.get('[data-testid="user-menu"]').should('be.visible');
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  
  // Verify logout
  cy.url().should('include', '/');
  cy.window().then((win) => {
    expect(win.localStorage.getItem('auth_token')).to.be.null;
  });
});

// Registration Commands
Cypress.Commands.add('registerUser', (userData) => {
  cy.visit('/signup');
  
  cy.get('[data-testid="name-input"]').type(userData.name);
  cy.get('[data-testid="email-input"]').type(userData.email);
  cy.get('[data-testid="password-input"]').type(userData.password);
  cy.get('[data-testid="confirm-password-input"]').type(userData.password);
  
  if (userData.role) {
    cy.get('[data-testid="role-select"]').select(userData.role);
  }
  
  cy.get('[data-testid="register-button"]').click();
});

// Chat Commands
Cypress.Commands.add('startNewChat', (subject = 'general') => {
  cy.get('[data-testid="new-chat-button"]').click();
  
  if (subject !== 'general') {
    cy.get('[data-testid="subject-select"]').select(subject);
  }
  
  cy.get('[data-testid="chat-input"]').should('be.visible').and('be.focused');
});

Cypress.Commands.add('sendMessage', (message, options = {}) => {
  const { waitForResponse = true, timeout = 15000 } = options;
  
  cy.get('[data-testid="chat-input"]')
    .clear()
    .type(message);
  
  cy.get('[data-testid="send-button"]').click();
  
  // Verify message appears in chat
  cy.get('[data-testid="chat-messages"]')
    .should('contain', message);
  
  if (waitForResponse) {
    // Wait for AI response
    cy.get('[data-testid="typing-indicator"]', { timeout })
      .should('be.visible');
    
    cy.get('[data-testid="typing-indicator"]', { timeout })
      .should('not.exist');
    
    cy.get('[data-testid="chat-messages"] .ai-message', { timeout })
      .should('have.length.greaterThan', 0);
  }
});

Cypress.Commands.add('selectConversation', (conversationTitle) => {
  cy.get('[data-testid="conversation-list"]')
    .contains(conversationTitle)
    .click();
  
  cy.get('[data-testid="conversation-title"]')
    .should('contain', conversationTitle);
});

Cypress.Commands.add('deleteConversation', (conversationTitle) => {
  cy.get('[data-testid="conversation-list"]')
    .contains(conversationTitle)
    .parent()
    .find('[data-testid="delete-conversation"]')
    .click();
  
  cy.get('[data-testid="confirm-delete"]').click();
  
  // Verify conversation is removed
  cy.get('[data-testid="conversation-list"]')
    .should('not.contain', conversationTitle);
});

// Quiz Commands
Cypress.Commands.add('createQuiz', (quizData) => {
  cy.visit('/quiz/create');
  
  cy.get('[data-testid="subject-input"]').type(quizData.subject);
  cy.get('[data-testid="topic-input"]').type(quizData.topic);
  cy.get('[data-testid="difficulty-select"]').select(quizData.difficulty);
  cy.get('[data-testid="num-questions-input"]').clear().type(quizData.numQuestions.toString());
  
  if (quizData.questionTypes) {
    quizData.questionTypes.forEach(type => {
      cy.get(`[data-testid="question-type-${type}"]`).check();
    });
  }
  
  cy.get('[data-testid="generate-quiz-button"]').click();
  
  // Wait for quiz generation
  cy.get('[data-testid="generating-spinner"]', { timeout: 30000 })
    .should('not.exist');
  
  cy.get('[data-testid="quiz-questions"]')
    .should('be.visible');
});

Cypress.Commands.add('answerQuizQuestion', (questionIndex, answer, questionType = 'multiple_choice') => {
  const questionSelector = `[data-testid="question-${questionIndex}"]`;
  
  if (questionType === 'multiple_choice') {
    cy.get(`${questionSelector} [data-testid="option-${answer}"]`).click();
  } else if (questionType === 'short_answer') {
    cy.get(`${questionSelector} [data-testid="answer-input"]`).type(answer);
  } else if (questionType === 'true_false') {
    cy.get(`${questionSelector} [data-testid="${answer}-button"]`).click();
  }
});

Cypress.Commands.add('submitQuiz', () => {
  cy.get('[data-testid="submit-quiz-button"]').click();
  
  // Wait for results
  cy.get('[data-testid="quiz-results"]', { timeout: 10000 })
    .should('be.visible');
});

// Lesson Plan Commands
Cypress.Commands.add('createLessonPlan', (lessonData) => {
  cy.visit('/lessons/create');
  
  cy.get('[data-testid="subject-input"]').type(lessonData.subject);
  cy.get('[data-testid="topic-input"]').type(lessonData.topic);
  cy.get('[data-testid="grade-select"]').select(lessonData.grade);
  cy.get('[data-testid="duration-input"]').clear().type(lessonData.duration);
  
  if (lessonData.objectives) {
    lessonData.objectives.forEach((objective, index) => {
      if (index > 0) {
        cy.get('[data-testid="add-objective-button"]').click();
      }
      cy.get(`[data-testid="objective-${index}"]`).type(objective);
    });
  }
  
  cy.get('[data-testid="generate-lesson-button"]').click();
  
  // Wait for lesson generation
  cy.get('[data-testid="generating-spinner"]', { timeout: 30000 })
    .should('not.exist');
  
  cy.get('[data-testid="lesson-plan"]')
    .should('be.visible');
});

// File Upload Commands
Cypress.Commands.add('uploadDocument', (filePath, fileType = 'pdf') => {
  cy.get('[data-testid="file-upload"]').attachFile(filePath);
  
  // Wait for upload to complete
  cy.get('[data-testid="upload-progress"]', { timeout: 30000 })
    .should('not.exist');
  
  cy.get('[data-testid="upload-success"]')
    .should('be.visible');
});

// Profile Management Commands
Cypress.Commands.add('updateProfile', (profileData) => {
  cy.visit('/profile');
  
  if (profileData.name) {
    cy.get('[data-testid="name-input"]').clear().type(profileData.name);
  }
  
  if (profileData.email) {
    cy.get('[data-testid="email-input"]').clear().type(profileData.email);
  }
  
  if (profileData.bio) {
    cy.get('[data-testid="bio-textarea"]').clear().type(profileData.bio);
  }
  
  if (profileData.avatar) {
    cy.get('[data-testid="avatar-upload"]').attachFile(profileData.avatar);
  }
  
  cy.get('[data-testid="save-profile-button"]').click();
  
  cy.get('[data-testid="success-message"]')
    .should('be.visible')
    .and('contain', 'Profile updated successfully');
});

// Navigation Commands
Cypress.Commands.add('navigateTo', (page) => {
  const routes = {
    'dashboard': '/dashboard',
    'chat': '/chat',
    'quiz': '/quiz',
    'lessons': '/lessons',
    'profile': '/profile',
    'settings': '/settings'
  };
  
  const route = routes[page] || `/${page}`;
  
  cy.get(`[data-testid="nav-${page}"]`).click();
  cy.url().should('include', route);
  cy.get('[data-testid="page-title"]').should('be.visible');
});

// Search Commands
Cypress.Commands.add('searchContent', (query) => {
  cy.get('[data-testid="search-input"]').type(query);
  cy.get('[data-testid="search-button"]').click();
  
  cy.get('[data-testid="search-results"]')
    .should('be.visible');
});

// Utility Commands
Cypress.Commands.add('waitForSpinner', (timeout = 10000) => {
  cy.get('[data-testid="loading-spinner"]', { timeout })
    .should('not.exist');
});

Cypress.Commands.add('checkToast', (message, type = 'success') => {
  cy.get(`[data-testid="toast-${type}"]`)
    .should('be.visible')
    .and('contain', message);
});

Cypress.Commands.add('dismissToast', () => {
  cy.get('[data-testid="toast-close"]').click();
  cy.get('[data-testid*="toast-"]').should('not.exist');
});

// API Mocking Commands
Cypress.Commands.add('mockApiCall', (method, url, response, statusCode = 200) => {
  cy.intercept(method.toUpperCase(), `**/api${url}`, {
    statusCode,
    body: response
  }).as(`${method}${url.replace(/[\/\:]/g, '_')}`);
});

Cypress.Commands.add('mockAuthenticatedUser', (userData = {}) => {
  const defaultUser = {
    _id: '64a1b2c3d4e5f6789012345',
    name: 'Test User',
    email: 'test@teachai.com',
    role: 'student',
    ...userData
  };
  
  cy.window().then((win) => {
    win.localStorage.setItem('auth_token', 'mock-jwt-token');
    win.localStorage.setItem('user', JSON.stringify(defaultUser));
  });
});

// Accessibility Commands
Cypress.Commands.add('checkA11y', (context = null, options = {}) => {
  cy.injectAxe();
  cy.checkA11y(context, options);
});

// Visual Testing Commands (if using percy or similar)
Cypress.Commands.add('takeSnapshot', (name) => {
  if (Cypress.env('PERCY_TOKEN')) {
    cy.percySnapshot(name);
  }
});

console.log('🔧 Cypress custom commands loaded');