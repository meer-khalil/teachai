// E2E Test: User Authentication Flow - TeachAI
describe('Authentication Flow', () => {
  const testUser = {
    name: 'Test User',
    email: 'testuser@teachai.com',
    password: 'TestPassword123!',
    role: 'student'
  };

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  describe('User Registration', () => {
    it('should successfully register a new user', () => {
      // Intercept registration API call
      cy.intercept('POST', '**/api/auth/register', {
        statusCode: 201,
        body: {
          success: true,
          data: {
            user: {
              _id: '64a1b2c3d4e5f6789012345',
              name: testUser.name,
              email: testUser.email,
              role: testUser.role
            },
            token: 'mock-jwt-token'
          },
          message: 'User registered successfully'
        }
      }).as('registerUser');

      cy.visit('/signup');
      
      // Verify signup page elements
      cy.get('[data-testid="page-title"]').should('contain', 'Sign Up');
      cy.get('[data-testid="name-input"]').should('be.visible');
      cy.get('[data-testid="email-input"]').should('be.visible');
      cy.get('[data-testid="password-input"]').should('be.visible');
      cy.get('[data-testid="confirm-password-input"]').should('be.visible');
      cy.get('[data-testid="register-button"]').should('be.visible');

      // Fill and submit registration form
      cy.registerUser(testUser);
      
      // Wait for API call
      cy.wait('@registerUser');
      
      // Verify successful registration
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="welcome-message"]').should('contain', testUser.name);
      cy.shouldBeAuthenticated();
    });

    it('should show validation errors for invalid input', () => {
      cy.visit('/signup');

      // Test empty form submission
      cy.get('[data-testid="register-button"]').click();
      
      cy.get('[data-testid="name-error"]').should('contain', 'Name is required');
      cy.get('[data-testid="email-error"]').should('contain', 'Email is required');
      cy.get('[data-testid="password-error"]').should('contain', 'Password is required');

      // Test invalid email format
      cy.get('[data-testid="email-input"]').type('invalid-email');
      cy.get('[data-testid="register-button"]').click();
      cy.get('[data-testid="email-error"]').should('contain', 'valid email');

      // Test password mismatch
      cy.get('[data-testid="email-input"]').clear().type(testUser.email);
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="confirm-password-input"]').type('password456');
      cy.get('[data-testid="register-button"]').click();
      cy.get('[data-testid="password-error"]').should('contain', 'Passwords do not match');
    });

    it('should handle registration errors gracefully', () => {
      // Mock registration failure
      cy.intercept('POST', '**/api/auth/register', {
        statusCode: 400,
        body: {
          success: false,
          message: 'Email already exists'
        }
      }).as('registerUserError');

      cy.visit('/signup');
      cy.registerUser(testUser);
      
      cy.wait('@registerUserError');
      
      cy.expectError('Email already exists');
      cy.url().should('include', '/signup');
    });
  });

  describe('User Login', () => {
    it('should successfully log in with valid credentials', () => {
      // Mock successful login
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            user: {
              _id: '64a1b2c3d4e5f6789012345',
              name: testUser.name,
              email: testUser.email,
              role: testUser.role
            },
            token: 'mock-jwt-token'
          },
          message: 'Login successful'
        }
      }).as('loginUser');

      cy.loginViaUI(testUser.email, testUser.password);
      
      cy.wait('@loginUser');
      
      // Verify successful login
      cy.url().should('include', '/dashboard');
      cy.shouldBeAuthenticated();
      cy.get('[data-testid="user-name"]').should('contain', testUser.name);
    });

    it('should show error for invalid credentials', () => {
      // Mock login failure
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 401,
        body: {
          success: false,
          message: 'Invalid credentials'
        }
      }).as('loginUserError');

      cy.loginViaUI('wrong@email.com', 'wrongpassword');
      
      cy.wait('@loginUserError');
      
      cy.expectError('Invalid credentials');
      cy.url().should('include', '/login');
      cy.shouldNotBeAuthenticated();
    });

    it('should validate required fields', () => {
      cy.visit('/login');

      // Test empty form submission
      cy.get('[data-testid="login-button"]').click();
      
      cy.get('[data-testid="email-error"]').should('contain', 'Email is required');
      cy.get('[data-testid="password-error"]').should('contain', 'Password is required');

      // Test invalid email format
      cy.get('[data-testid="email-input"]').type('invalid-email');
      cy.get('[data-testid="login-button"]').click();
      cy.get('[data-testid="email-error"]').should('contain', 'valid email');
    });

    it('should redirect authenticated users away from login page', () => {
      // Mock authenticated user
      cy.mockAuthenticatedUser(testUser);
      
      cy.visit('/login');
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
    });
  });

  describe('User Logout', () => {
    beforeEach(() => {
      // Set up authenticated user
      cy.mockAuthenticatedUser(testUser);
    });

    it('should successfully log out user', () => {
      cy.visit('/dashboard');
      
      cy.shouldBeAuthenticated();
      
      // Logout
      cy.logout();
      
      // Verify logout
      cy.shouldNotBeAuthenticated();
      cy.url().should('include', '/');
    });
  });

  describe('Protected Routes', () => {
    const protectedRoutes = ['/dashboard', '/chat', '/profile', '/quiz'];

    protectedRoutes.forEach(route => {
      it(`should redirect unauthenticated users from ${route} to login`, () => {
        cy.visit(route);
        
        cy.url().should('include', '/login');
        cy.get('[data-testid="login-form"]').should('be.visible');
      });
    });

    it('should allow authenticated users to access protected routes', () => {
      cy.mockAuthenticatedUser(testUser);
      
      protectedRoutes.forEach(route => {
        cy.visit(route);
        cy.url().should('include', route);
        cy.shouldBeAuthenticated();
      });
    });
  });

  describe('Password Reset Flow', () => {
    it('should handle forgot password request', () => {
      cy.intercept('POST', '**/api/auth/forgot-password', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Password reset email sent'
        }
      }).as('forgotPassword');

      cy.visit('/login');
      cy.get('[data-testid="forgot-password-link"]').click();
      
      cy.url().should('include', '/forgot-password');
      
      cy.get('[data-testid="email-input"]').type(testUser.email);
      cy.get('[data-testid="send-reset-button"]').click();
      
      cy.wait('@forgotPassword');
      
      cy.expectSuccess('Password reset email sent');
    });

    it('should handle password reset with valid token', () => {
      const resetToken = 'valid-reset-token';
      
      cy.intercept('POST', `**/api/auth/reset-password/${resetToken}`, {
        statusCode: 200,
        body: {
          success: true,
          message: 'Password reset successful'
        }
      }).as('resetPassword');

      cy.visit(`/reset-password/${resetToken}`);
      
      const newPassword = 'NewPassword123!';
      cy.get('[data-testid="password-input"]').type(newPassword);
      cy.get('[data-testid="confirm-password-input"]').type(newPassword);
      cy.get('[data-testid="reset-button"]').click();
      
      cy.wait('@resetPassword');
      
      cy.expectSuccess('Password reset successful');
      cy.url().should('include', '/login');
    });
  });

  describe('Session Management', () => {
    it('should handle expired token gracefully', () => {
      // Set up expired token
      cy.window().then((win) => {
        win.localStorage.setItem('auth_token', 'expired-token');
      });

      // Mock API call that returns 401
      cy.intercept('GET', '**/api/auth/profile', {
        statusCode: 401,
        body: {
          success: false,
          message: 'Token expired'
        }
      }).as('getProfile');

      cy.visit('/dashboard');
      
      cy.wait('@getProfile');
      
      // Should redirect to login and clear token
      cy.url().should('include', '/login');
      cy.shouldNotBeAuthenticated();
    });

    it('should persist authentication across page reloads', () => {
      cy.mockAuthenticatedUser(testUser);
      
      cy.visit('/dashboard');
      cy.shouldBeAuthenticated();
      
      // Reload page
      cy.reload();
      
      // Should still be authenticated
      cy.shouldBeAuthenticated();
      cy.get('[data-testid="user-name"]').should('contain', testUser.name);
    });
  });

  describe('Role-based Access', () => {
    it('should handle student role permissions', () => {
      cy.mockAuthenticatedUser({ ...testUser, role: 'student' });
      
      cy.visit('/dashboard');
      
      // Student should see student-specific features
      cy.get('[data-testid="student-dashboard"]').should('be.visible');
      cy.get('[data-testid="teacher-tools"]').should('not.exist');
    });

    it('should handle teacher role permissions', () => {
      cy.mockAuthenticatedUser({ ...testUser, role: 'teacher' });
      
      cy.visit('/dashboard');
      
      // Teacher should see teacher-specific features
      cy.get('[data-testid="teacher-dashboard"]').should('be.visible');
      cy.get('[data-testid="teacher-tools"]').should('be.visible');
    });
  });
});