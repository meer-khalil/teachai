/**
 * TeachAI Platform - User Seeding Script
 * Creates test users for all platform roles for development and testing
 * 
 * Usage:
 * - Development: node scripts/seed-users.js
 * - Testing: npm run seed:users
 * 
 * Created: September 2025
 * Purpose: Development & Testing Environment Setup
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const User = require('../models/userModel');
const Usage = require('../models/usageModel');
const connectDatabase = require('../config/database');

// Try to load environment variables from multiple possible locations
const possibleEnvPaths = [
  path.join(__dirname, '../config/.env'),
  path.join(__dirname, '../.env'),
  path.join(__dirname, '../../.env'),
  '.env'
];

let envLoaded = false;
for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log(`📝 Loaded environment variables from: ${envPath}`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.log('⚠️  No .env file found, using fallback configuration');
}

// Test user credentials for different roles
const TEST_USERS = [
  // Admin Users
  {
    firstName: 'Super',
    lastName: 'Admin',
    email: 'admin@teachai.com',
    password: 'Admin123!@#',
    role: 'admin',
    verified: true,
    country: 'USA',
    TwoFA: false,
    description: 'Super Administrator - Full platform access'
  },
  {
    firstName: 'John',
    lastName: 'Manager',
    email: 'manager@teachai.com', 
    password: 'Manager123!@#',
    role: 'admin',
    verified: true,
    country: 'UK',
    TwoFA: true,
    description: 'Platform Manager - Administrative access'
  },

  // Regular Users - Different plans and statuses
  {
    firstName: 'Alice',
    lastName: 'Teacher',
    email: 'alice.teacher@teachai.com',
    password: 'Teacher123!@#',
    role: 'user',
    verified: true,
    country: 'Canada',
    TwoFA: false,
    plan: 'Premium',
    usageLimit: 1000,
    description: 'Premium Teacher - Active premium subscription'
  },
  {
    firstName: 'Bob',
    lastName: 'Educator',
    email: 'bob.educator@teachai.com',
    password: 'Educator123!@#',
    role: 'user',
    verified: true,
    country: 'Australia',
    TwoFA: true,
    plan: 'Pro',
    usageLimit: 500,
    description: 'Professional Educator - Pro plan subscriber'
  },
  {
    firstName: 'Carol',
    lastName: 'Student',
    email: 'carol.student@teachai.com',
    password: 'Student123!@#',
    role: 'user',
    verified: true,
    country: 'USA',
    TwoFA: false,
    plan: 'Free',
    usageLimit: 10,
    description: 'Free Plan User - Basic access'
  },
  {
    firstName: 'David',
    lastName: 'NewUser',
    email: 'david.new@teachai.com',
    password: 'NewUser123!@#',
    role: 'user',
    verified: false,
    country: 'Germany',
    TwoFA: false,
    plan: 'Free',
    usageLimit: 10,
    description: 'Unverified User - Testing email verification flow'
  },
  {
    firstName: 'Emma',
    lastName: 'PowerUser',
    email: 'emma.power@teachai.com',
    password: 'PowerUser123!@#',
    role: 'user',
    verified: true,
    country: 'France',
    TwoFA: true,
    plan: 'Enterprise',
    usageLimit: 5000,
    description: 'Enterprise User - Maximum features access'
  },
  {
    firstName: 'Frank',
    lastName: 'TrialUser',
    email: 'frank.trial@teachai.com',
    password: 'TrialUser123!@#',
    role: 'user',
    verified: true,
    country: 'Japan',
    TwoFA: false,
    plan: 'Trial',
    usageLimit: 100,
    description: 'Trial User - Testing trial functionality'
  },
  {
    firstName: 'Grace',
    lastName: 'Collaborator',
    email: 'grace.collab@teachai.com',
    password: 'Collab123!@#',
    role: 'user',
    verified: true,
    country: 'Brazil',
    TwoFA: false,
    plan: 'Team',
    usageLimit: 2000,
    description: 'Team Plan User - Testing collaboration features'
  },
  {
    firstName: 'Henry',
    lastName: 'Tester',
    email: 'henry.test@teachai.com',
    password: 'Tester123!@#',
    role: 'user',
    verified: true,
    country: 'India',
    TwoFA: true,
    plan: 'Free',
    usageLimit: 10,
    usageCount: 8, // Almost reached limit
    description: 'Near-limit User - Testing usage restrictions'
  }
];

// Usage plans configuration
const USAGE_PLANS = {
  'Free': { limit: 10, storage: 10, files: 1 },
  'Trial': { limit: 100, storage: 100, files: 5 },
  'Pro': { limit: 500, storage: 1000, files: 25 },
  'Premium': { limit: 1000, storage: 5000, files: 50 },
  'Team': { limit: 2000, storage: 10000, files: 100 },
  'Enterprise': { limit: 5000, storage: 50000, files: 500 }
};

/**
 * Hash password using bcrypt
 */
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Create or update a user
 */
const createUser = async (userData) => {
  try {
    // Check if user exists
    const existingUser = await User.findOne({ email: userData.email });
    
    if (existingUser) {
      console.log(`📝 User ${userData.email} already exists - updating...`);
      
      // Update existing user
      const updatedUser = await User.findOneAndUpdate(
        { email: userData.email },
        {
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          verified: userData.verified,
          country: userData.country,
          TwoFA: userData.TwoFA,
          password: await hashPassword(userData.password)
        },
        { new: true }
      );

      return updatedUser;
    }

    // Create new user
    const hashedPassword = await hashPassword(userData.password);
    
    const user = await User.create({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: hashedPassword,
      role: userData.role,
      verified: userData.verified,
      country: userData.country,
      TwoFA: userData.TwoFA
    });

    console.log(`✅ Created user: ${userData.email} (${userData.role})`);
    return user;

  } catch (error) {
    console.error(`❌ Error creating user ${userData.email}:`, error.message);
    throw error;
  }
};

/**
 * Create usage record for user
 */
const createUsageRecord = async (user, userData) => {
  try {
    const planConfig = USAGE_PLANS[userData.plan || 'Free'];
    
    // Check if usage record exists
    const existingUsage = await Usage.findOne({ user: user._id });
    
    if (existingUsage) {
      // Update existing usage
      await Usage.findOneAndUpdate(
        { user: user._id },
        {
          plan: userData.plan || 'Free',
          usageLimit: userData.usageLimit || planConfig.limit,
          usageCount: userData.usageCount || 0,
          storageLimit: planConfig.storage,
          noOfFilesUploadedLimit: planConfig.files,
          payment: (userData.plan && userData.plan !== 'Free') ? true : false
        }
      );
    } else {
      // Create new usage record
      await Usage.create({
        user: user._id,
        plan: userData.plan || 'Free',
        usageLimit: userData.usageLimit || planConfig.limit,
        usageCount: userData.usageCount || 0,
        storageLimit: planConfig.storage,
        noOfFilesUploadedLimit: planConfig.files,
        payment: (userData.plan && userData.plan !== 'Free') ? true : false
      });
    }

    console.log(`📊 Created usage record for ${user.email} - Plan: ${userData.plan || 'Free'}`);

  } catch (error) {
    console.error(`❌ Error creating usage for ${user.email}:`, error.message);
  }
};

/**
 * Generate summary report
 */
const generateSummary = () => {
  console.log('\n🎯 TEST USER CREDENTIALS SUMMARY');
  console.log('=====================================');
  
  TEST_USERS.forEach((user, index) => {
    console.log(`\n${index + 1}. ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${user.password}`);
    console.log(`   Role: ${user.role.toUpperCase()}`);
    console.log(`   Plan: ${user.plan || 'Free'}`);
    console.log(`   Verified: ${user.verified ? 'YES' : 'NO'}`);
    console.log(`   2FA: ${user.TwoFA ? 'ENABLED' : 'DISABLED'}`);
    console.log(`   Purpose: ${user.description}`);
  });

  console.log('\n📝 QUICK ACCESS CREDENTIALS');
  console.log('============================');
  console.log('🔑 ADMIN ACCESS:');
  console.log('   Email: admin@teachai.com');
  console.log('   Password: Admin123!@#');
  console.log('');
  console.log('👤 PREMIUM USER:');
  console.log('   Email: alice.teacher@teachai.com'); 
  console.log('   Password: Teacher123!@#');
  console.log('');
  console.log('🆓 FREE USER:');
  console.log('   Email: carol.student@teachai.com');
  console.log('   Password: Student123!@#');
  
  console.log('\n🌐 LOGIN URL: http://localhost:3000/login');
  console.log('🚀 Dashboard: http://localhost:3000/user/dashboard');
};

/**
 * Save test user credentials to a file for easy reference
 */
const saveCredentialsToFile = () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `test-user-credentials-${timestamp.split('T')[0]}.json`;
  const filepath = path.join(__dirname, '..', 'credentials', filename);
  
  // Ensure credentials directory exists
  const credentialsDir = path.dirname(filepath);
  if (!fs.existsSync(credentialsDir)) {
    fs.mkdirSync(credentialsDir, { recursive: true });
  }

  const credentials = {
    generated: new Date().toISOString(),
    purpose: "TeachAI Platform - Development Testing Credentials",
    warning: "🚨 DEVELOPMENT ONLY - Never use these credentials in production!",
    platform: {
      name: "TeachAI",
      frontend_url: "http://localhost:3000",
      backend_url: "http://localhost:4000",
      login_url: "http://localhost:3000/login"
    },
    users: TEST_USERS.map(user => ({
      role: user.role,
      email: user.email,
      password: user.password,
      plan: user.subscription?.plan || 'Free',
      daily_limit: user.subscription?.dailyRequestLimit || 10,
      verified: user.verified,
      two_factor: user.twoFactorEnabled,
      description: getUserDescription(user)
    })),
    usage_instructions: [
      "1. Ensure backend is running: cd backend && npm start",
      "2. Start frontend: npm start", 
      "3. Visit http://localhost:3000/login",
      "4. Use any email/password combination above",
      "5. Test role-based features and subscription limits"
    ],
    cleanup: {
      command: "npm run seed:users:cleanup",
      description: "Removes all test users from database"
    }
  };

  fs.writeFileSync(filepath, JSON.stringify(credentials, null, 2), 'utf8');
  
  console.log(`💾 Credentials saved to: ${path.relative(process.cwd(), filepath)}`);
  console.log(`📁 Full path: ${filepath}`);
  
  return filepath;
};

/**
 * Get user description based on role and plan
 */
const getUserDescription = (user) => {
  const descriptions = {
    'admin@teachai.com': 'Super Administrator - Full platform access',
    'manager@teachai.com': 'Platform Manager - Administrative access with 2FA',
    'alice.teacher@teachai.com': 'Premium Teacher - Full AI tools, advanced analytics',
    'bob.educator@teachai.com': 'Professional Educator - Enhanced features with 2FA',
    'carol.student@teachai.com': 'Free Plan Student - Basic AI chatbots only',
    'david.new@teachai.com': 'Unverified User - Test registration/OTP flow',
    'emma.power@teachai.com': 'Enterprise User - Maximum features and limits',
    'frank.trial@teachai.com': 'Trial User - Test trial functionality',
    'grace.collab@teachai.com': 'Team User - Collaboration features',
    'henry.test@teachai.com': 'Near-Limit User - Test usage restrictions'
  };
  
  return descriptions[user.email] || `${user.role} user with ${user.subscription?.plan || 'Free'} plan`;
};

/**
 * Main seeding function
 */
const seedUsers = async () => {
  try {
    console.log('🚀 Starting TeachAI User Seeding Process...\n');

    // Connect to database
    if (!mongoose.connection.readyState) {
      connectDatabase();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for connection
    }

    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    // Create all test users
    for (const userData of TEST_USERS) {
      try {
        const existingUser = await User.findOne({ email: userData.email });
        const user = await createUser(userData);
        await createUsageRecord(user, userData);
        
        if (existingUser) {
          updatedCount++;
        } else {
          createdCount++;
        }

      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to process ${userData.email}:`, error.message);
      }
    }

    // Summary
    console.log('\n📊 SEEDING COMPLETE!');
    console.log('====================');
    console.log(`✅ Created: ${createdCount} users`);
    console.log(`📝 Updated: ${updatedCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);
    console.log(`📋 Total Processed: ${TEST_USERS.length} users\n`);

    generateSummary();

    // Save credentials to file
    const credentialsFile = saveCredentialsToFile();

    console.log('\n💡 NEXT STEPS:');
    console.log('===============');
    console.log('1. Start the backend: npm start');
    console.log('2. Start the frontend: npm start');
    console.log('3. Visit: http://localhost:3000/login');
    console.log(`4. Check saved credentials: ${path.basename(credentialsFile)}`);
    console.log('5. Use any credentials above to test different roles');
    console.log('6. Test features based on user roles and plans\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

/**
 * Cleanup function - removes all test users
 */
const cleanupTestUsers = async () => {
  try {
    console.log('🧹 Cleaning up test users...');
    
    const testEmails = TEST_USERS.map(user => user.email);
    
    // Find all test users
    const testUsers = await User.find({ email: { $in: testEmails } });
    const testUserIds = testUsers.map(user => user._id);
    
    // Delete usage records
    await Usage.deleteMany({ user: { $in: testUserIds } });
    console.log(`🗑️ Deleted ${testUserIds.length} usage records`);
    
    // Delete users
    const deleteResult = await User.deleteMany({ email: { $in: testEmails } });
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} test users`);
    
    console.log('✅ Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
};

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'cleanup') {
    cleanupTestUsers()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    seedUsers()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}

module.exports = {
  seedUsers,
  cleanupTestUsers,
  TEST_USERS,
  USAGE_PLANS
};