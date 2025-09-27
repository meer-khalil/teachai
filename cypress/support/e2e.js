// Cypress Support Commands - TeachAI E2E Testing
import './commands';

// Import commands.js using ES2015 syntax:
// import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on uncaught exceptions
  // that are not critical to the test
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  
  if (err.message.includes('Non-passive event listener')) {
    return false;
  }
  
  if (err.message.includes('ChunkLoadError')) {
    return false;
  }
  
  // Return false to prevent the error from failing the test
  return false;
});

// Before each test
beforeEach(() => {
  // Set up intercepts for common API calls
  cy.intercept('GET', '**/api/auth/profile', { fixture: 'user.json' }).as('getUserProfile');
  cy.intercept('GET', '**/api/chat/history', { fixture: 'chatHistory.json' }).as('getChatHistory');
  cy.intercept('POST', '**/api/auth/login', { fixture: 'authSuccess.json' }).as('login');
  cy.intercept('POST', '**/api/auth/register', { fixture: 'authSuccess.json' }).as('register');
  
  // Clear local storage and session storage
  cy.clearLocalStorage();
  cy.clearCookies();
  
  // Set viewport for consistent testing
  cy.viewport(1280, 720);
});

// After each test
afterEach(() => {
  // Clean up any test data if needed
  cy.clearLocalStorage();
  cy.clearCookies();
});

// Global utilities available in tests
Cypress.Commands.add('resetTestData', () => {
  cy.task('cleanDatabase');
  cy.task('seedDatabase');
});

// Authentication helpers
Cypress.Commands.add('loginAsTestUser', () => {
  const testUser = Cypress.env('testUser');
  
  cy.visit('/login');
  cy.get('[data-testid="email-input"]').type(testUser.email);
  cy.get('[data-testid="password-input"]').type(testUser.password);
  cy.get('[data-testid="login-button"]').click();
  
  cy.wait('@login');
  cy.url().should('not.include', '/login');
});

Cypress.Commands.add('loginWithCredentials', (email, password) => {
  cy.visit('/login');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
});

// API helpers
Cypress.Commands.add('makeAuthenticatedRequest', (method, url, body = {}) => {
  return cy.window().then((win) => {
    const token = win.localStorage.getItem('auth_token');
    
    return cy.request({
      method,
      url: `${Cypress.env('apiUrl')}${url}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body
    });
  });
});

// Chat helpers
Cypress.Commands.add('sendChatMessage', (message, subject = 'general') => {
  cy.get('[data-testid="chat-input"]').type(message);
  cy.get('[data-testid="chat-send-button"]').click();
  
  // Wait for response
  cy.get('[data-testid="chat-messages"]').should('contain', message);
});

Cypress.Commands.add('waitForChatResponse', () => {
  cy.get('[data-testid="chat-loading"]', { timeout: 15000 }).should('not.exist');
  cy.get('[data-testid="chat-response"]').should('be.visible');
});

// Form helpers
Cypress.Commands.add('fillForm', (formData) => {
  Object.entries(formData).forEach(([field, value]) => {
    cy.get(`[data-testid="${field}-input"]`).clear().type(value);
  });
});

Cypress.Commands.add('submitForm', (formSelector = 'form') => {
  cy.get(formSelector).submit();
});

// Wait for loading states
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('[data-testid="loading-spinner"]', { timeout: 10000 }).should('not.exist');
});

Cypress.Commands.add('waitForApiCall', (alias) => {
  cy.wait(alias);
});

// Navigation helpers
Cypress.Commands.add('navigateToPage', (page) => {
  cy.get(`[data-testid="nav-${page}"]`).click();
  cy.url().should('include', `/${page}`);
});

// File upload helpers
Cypress.Commands.add('uploadFile', (selector, filePath, mimeType = 'text/plain') => {
  cy.get(selector).attachFile({
    filePath,
    mimeType
  });
});

// Accessibility helpers
Cypress.Commands.add('checkAccessibility', () => {
  cy.injectAxe();
  cy.checkA11y();
});

// Visual regression helpers (if using visual testing)
Cypress.Commands.add('compareSnapshot', (name) => {
  cy.matchImageSnapshot(name);
});

// Database helpers
Cypress.Commands.add('seedTestData', () => {
  cy.task('seedDatabase');
});

Cypress.Commands.add('cleanTestData', () => {
  cy.task('cleanDatabase');
});

// Local storage helpers
Cypress.Commands.add('setAuthToken', (token) => {
  window.localStorage.setItem('auth_token', token);
});

Cypress.Commands.add('getAuthToken', () => {
  return cy.window().then((win) => {
    return win.localStorage.getItem('auth_token');
  });
});

// Custom assertions
Cypress.Commands.add('shouldBeAuthenticated', () => {
  cy.getAuthToken().should('exist');
  cy.get('[data-testid="user-menu"]').should('be.visible');
});

Cypress.Commands.add('shouldNotBeAuthenticated', () => {
  cy.getAuthToken().should('not.exist');
  cy.get('[data-testid="login-button"]').should('be.visible');
});

// Error handling
Cypress.Commands.add('expectError', (message) => {
  cy.get('[data-testid="error-message"]').should('be.visible').and('contain', message);
});

Cypress.Commands.add('expectSuccess', (message) => {
  cy.get('[data-testid="success-message"]').should('be.visible').and('contain', message);
});

console.log('🧪 Cypress E2E support loaded');