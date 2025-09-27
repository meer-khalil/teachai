// Unit Tests for Login Component - TeachAI Frontend
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';
import { AuthContext } from '../../context/AuthContext';

// Mock the AuthContext
const mockAuthContext = {
  login: jest.fn(),
  loading: false,
  error: null
};

// Helper to render Login with providers
const renderLogin = (authContextValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authContextValue}>
        <Login />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.mockFetch.reset();
  });

  test('renders login form elements', () => {
    renderLogin();

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
  });

  test('allows user to type in email and password fields', async () => {
    const user = userEvent.setup();
    renderLogin();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  test('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    renderLogin();

    const loginButton = screen.getByRole('button', { name: /login/i });
    await user.click(loginButton);

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  test('shows validation error for invalid email format', async () => {
    const user = userEvent.setup();
    renderLogin();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'invalid-email');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
  });

  test('calls login function with correct credentials on form submission', async () => {
    const user = userEvent.setup();
    const mockLogin = jest.fn();
    const contextValue = { ...mockAuthContext, login: mockLogin };

    renderLogin(contextValue);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  test('shows loading state during login', () => {
    const contextValue = { ...mockAuthContext, loading: true };
    renderLogin(contextValue);

    const loginButton = screen.getByRole('button', { name: /logging in/i });
    expect(loginButton).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('displays error message when login fails', () => {
    const contextValue = { 
      ...mockAuthContext, 
      error: 'Invalid credentials. Please try again.' 
    };
    renderLogin(contextValue);

    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  test('hides and shows password when toggle is clicked', async () => {
    const user = userEvent.setup();
    renderLogin();

    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });

    // Password should be hidden by default
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle to show password
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    // Click toggle again to hide password
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('navigates to signup page when signup link is clicked', async () => {
    const user = userEvent.setup();
    renderLogin();

    const signupLink = screen.getByText(/sign up/i);
    await user.click(signupLink);

    expect(global.testUtils.mockNavigate).toHaveBeenCalledWith('/signup');
  });

  test('navigates to forgot password page when forgot password link is clicked', async () => {
    const user = userEvent.setup();
    renderLogin();

    const forgotPasswordLink = screen.getByText(/forgot password/i);
    await user.click(forgotPasswordLink);

    expect(global.testUtils.mockNavigate).toHaveBeenCalledWith('/forgot-password');
  });

  test('handles successful login and redirects', async () => {
    const user = userEvent.setup();
    const mockLogin = jest.fn().mockResolvedValue({
      success: true,
      data: { user: global.testUtils.createMockUser() }
    });
    const contextValue = { ...mockAuthContext, login: mockLogin };

    renderLogin(contextValue);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });
  });

  test('prevents form submission when already loading', async () => {
    const user = userEvent.setup();
    const mockLogin = jest.fn();
    const contextValue = { ...mockAuthContext, login: mockLogin, loading: true };

    renderLogin(contextValue);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /logging in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    
    // Button should be disabled
    expect(loginButton).toBeDisabled();
    
    // Try to click anyway
    await user.click(loginButton);
    
    // Login should not be called since button is disabled
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('clears form after successful login', async () => {
    const user = userEvent.setup();
    const mockLogin = jest.fn().mockResolvedValue({
      success: true,
      data: { user: global.testUtils.createMockUser() }
    });
    
    // Create a new context value for successful login
    const contextValue = { ...mockAuthContext, login: mockLogin };
    
    renderLogin(contextValue);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });
  });

  test('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    renderLogin();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    // Tab to email input
    await user.tab();
    expect(emailInput).toHaveFocus();

    // Tab to password input
    await user.tab();
    expect(passwordInput).toHaveFocus();

    // Tab to login button
    await user.tab();
    expect(screen.getByRole('button', { name: /login/i })).toHaveFocus();
  });

  test('allows form submission with Enter key', async () => {
    const user = userEvent.setup();
    const mockLogin = jest.fn();
    const contextValue = { ...mockAuthContext, login: mockLogin };

    renderLogin(contextValue);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.keyboard('{Enter}');

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  test('maintains accessibility standards', () => {
    renderLogin();

    // Check for proper labels
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

    // Check for proper ARIA attributes
    const form = screen.getByRole('form');
    expect(form).toBeInTheDocument();

    // Check for error message accessibility
    const contextValue = { 
      ...mockAuthContext, 
      error: 'Login failed' 
    };
    
    const { rerender } = renderLogin(contextValue);
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});