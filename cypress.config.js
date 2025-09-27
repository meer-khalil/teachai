const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    // Base URL for the application
    baseUrl: 'http://localhost:3000',
    
    // Support file
    supportFile: 'cypress/support/e2e.js',
    
    // Spec patterns
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    // Video and screenshot settings
    video: true,
    screenshotOnRunFailure: true,
    
    // Viewport settings
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Test isolation
    testIsolation: true,
    
    // Timeouts
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    
    // Retry configuration
    retries: {
      runMode: 2,
      openMode: 0
    },
    
    // Environment variables
    env: {
      apiUrl: 'http://localhost:5000/api',
      testUser: {
        email: 'test@teachai.com',
        password: 'testpassword123',
        name: 'Test User'
      }
    },
    
    // Setup node events
    setupNodeEvents(on, config) {
      // Task for database seeding
      on('task', {
        // Seed test data
        seedDatabase() {
          return new Promise((resolve) => {
            // Database seeding logic would go here
            console.log('Seeding test database...');
            resolve('Database seeded successfully');
          });
        },
        
        // Clean test data
        cleanDatabase() {
          return new Promise((resolve) => {
            // Database cleanup logic would go here
            console.log('Cleaning test database...');
            resolve('Database cleaned successfully');
          });
        },
        
        // Log messages
        log(message) {
          console.log(message);
          return null;
        }
      });

      // Browser launch options
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome' && browser.isHeadless) {
          launchOptions.args.push('--disable-gpu');
          launchOptions.args.push('--no-sandbox');
          launchOptions.args.push('--disable-dev-shm-usage');
        }
        
        return launchOptions;
      });

      return config;
    }
  },

  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack'
    },
    supportFile: 'cypress/support/component.js',
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    indexHtmlFile: 'cypress/support/component-index.html'
  },

  // Global configuration
  chromeWebSecurity: false,
  modifyObstructiveCode: false,
  
  // Folders
  fixturesFolder: 'cypress/fixtures',
  screenshotsFolder: 'cypress/screenshots',
  videosFolder: 'cypress/videos',
  downloadsFolder: 'cypress/downloads',

  // Reporter configuration
  reporter: 'mochawesome',
  reporterOptions: {
    reportDir: 'cypress/reports',
    overwrite: false,
    html: true,
    json: true,
    timestamp: 'mmddyyyy_HHMMss'
  }
});