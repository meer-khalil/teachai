// Test Setup for TeachAI React Application
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import 'jest-canvas-mock';

// Configure React Testing Library
configure({
  testIdAttribute: 'data-testid',
});

// Mock window.matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Setup fetch mock helper
global.mockFetch = {
  success: (data) => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data }),
      headers: new Headers(),
      statusText: 'OK',
    });
  },
  error: (message, status = 400) => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status,
      json: async () => ({ success: false, message }),
      headers: new Headers(),
      statusText: 'Error',
    });
  },
  networkError: () => {
    fetch.mockRejectedValueOnce(new Error('Network Error'));
  },
  reset: () => {
    fetch.mockReset();
  }
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    // Only show errors that are not React warnings or testing-library warnings
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || 
       args[0].includes('Consider adding an error boundary') ||
       args[0].includes('ReactDOMTestUtils'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    // Only show warnings that are not React warnings
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning:')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Reset mocks before each test
beforeEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset fetch mock
  global.mockFetch.reset();
  
  // Clear storage mocks
  localStorageMock.clear();
  sessionStorageMock.clear();
  
  // Reset DOM
  document.body.innerHTML = '';
  
  // Clear timers
  jest.clearAllTimers();
});

// Global test utilities
global.testUtils = {
  // Create mock user for tests
  createMockUser: (overrides = {}) => ({
    _id: '64a1b2c3d4e5f6789012345',
    name: 'Test User',
    email: 'test@example.com',
    role: 'student',
    avatar: null,
    isVerified: true,
    createdAt: new Date().toISOString(),
    ...overrides
  }),

  // Create mock auth token
  createMockToken: () => 'mock-jwt-token-for-testing',

  // Create mock chat conversation
  createMockConversation: (overrides = {}) => ({
    conversationId: 'conv-123',
    title: 'Test Conversation',
    subject: 'mathematics',
    grade: '10',
    lastMessage: 'What is algebra?',
    timestamp: new Date().toISOString(),
    messageCount: 2,
    ...overrides
  }),

  // Create mock API response
  createMockResponse: (data, success = true) => ({
    success,
    data,
    message: success ? 'Success' : 'Error occurred'
  }),

  // Wait for async operations
  waitFor: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock React Router navigation
  mockNavigate: jest.fn(),

  // Mock authentication context
  createMockAuthContext: (overrides = {}) => ({
    user: global.testUtils.createMockUser(),
    token: global.testUtils.createMockToken(),
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    updateProfile: jest.fn(),
    ...overrides
  }),

  // Mock chat context
  createMockChatContext: (overrides = {}) => ({
    conversations: [global.testUtils.createMockConversation()],
    currentConversation: null,
    loading: false,
    sendMessage: jest.fn(),
    loadConversations: jest.fn(),
    deleteConversation: jest.fn(),
    ...overrides
  }),

  // Render with providers helper
  renderWithProviders: (ui, options = {}) => {
    const { render } = require('@testing-library/react');
    const { BrowserRouter } = require('react-router-dom');
    
    const AllTheProviders = ({ children }) => {
      return (
        <BrowserRouter>
          {children}
        </BrowserRouter>
      );
    };

    return render(ui, { wrapper: AllTheProviders, ...options });
  },

  // Fire event helper
  fireEvent: require('@testing-library/react').fireEvent,

  // User event helper (for more realistic user interactions)
  userEvent: require('@testing-library/user-event').default
};

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => global.testUtils.mockNavigate,
  useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
  useParams: () => ({}),
}));

// Mock environment variables
process.env.REACT_APP_API_URL = 'http://localhost:5000/api';
process.env.REACT_APP_ENV = 'test';

console.log('🧪 React test environment setup complete');
