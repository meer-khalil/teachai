# TeachAI Test Users Documentation

## 🎯 Overview

This document provides comprehensive information about test users created for the TeachAI platform development and testing environment. These users cover all platform roles, subscription plans, and user states.

## 🚀 Quick Setup

### Run the User Seeding Script
```bash
# Navigate to backend directory
cd backend

# Create all test users
npm run seed:users

# Alternative command
node scripts/seed-users.js

# Clean up test users (when needed)
npm run seed:users:cleanup
```

### 💾 Credentials File

After running the seeding script, a **descriptive credentials file** is automatically created:
- **Location:** `backend/credentials/test-user-credentials-YYYY-MM-DD.json`
- **Contents:** All test user credentials in JSON format
- **Purpose:** Easy reference for development and testing
- **Security:** Automatically ignored by git (.gitignore)

**Example file:** `test-user-credentials-2025-09-28.json`

## 👥 Test User Credentials

### 🔑 Administrator Users

#### Super Administrator
- **Email**: `admin@teachai.com`
- **Password**: `Admin123!@#`
- **Role**: Admin
- **Features**: Full platform access, user management, analytics, system configuration
- **2FA**: Disabled
- **Status**: Verified

#### Platform Manager  
- **Email**: `manager@teachai.com`
- **Password**: `Manager123!@#`
- **Role**: Admin
- **Features**: Administrative access, content management, user oversight
- **2FA**: Enabled
- **Status**: Verified

---

### 👤 Regular Users (Different Plans & States)

#### Premium Teacher (Premium Plan)
- **Email**: `alice.teacher@teachai.com`
- **Password**: `Teacher123!@#`
- **Plan**: Premium
- **Usage Limit**: 1,000 requests/day
- **Features**: Full AI tools, advanced analytics, priority support
- **Status**: Verified, Active subscription

#### Professional Educator (Pro Plan)
- **Email**: `bob.educator@teachai.com`
- **Password**: `Educator123!@#`
- **Plan**: Pro
- **Usage Limit**: 500 requests/day
- **Features**: Enhanced AI tools, collaboration features
- **2FA**: Enabled
- **Status**: Verified

#### Free Plan Student
- **Email**: `carol.student@teachai.com`
- **Password**: `Student123!@#`
- **Plan**: Free
- **Usage Limit**: 10 requests/day
- **Features**: Basic AI chatbots, limited file uploads
- **Status**: Verified

#### Unverified New User
- **Email**: `david.new@teachai.com`
- **Password**: `NewUser123!@#`
- **Plan**: Free
- **Status**: **NOT VERIFIED** (for testing email verification flow)
- **Purpose**: Test registration and OTP verification process

#### Enterprise Power User
- **Email**: `emma.power@teachai.com`
- **Password**: `PowerUser123!@#`
- **Plan**: Enterprise
- **Usage Limit**: 5,000 requests/day
- **Features**: All premium features, custom integrations, dedicated support
- **2FA**: Enabled
- **Status**: Verified

#### Trial User
- **Email**: `frank.trial@teachai.com`
- **Password**: `TrialUser123!@#`
- **Plan**: Trial
- **Usage Limit**: 100 requests/day
- **Purpose**: Test trial functionality and conversion flows
- **Status**: Verified

#### Team Collaboration User
- **Email**: `grace.collab@teachai.com`
- **Password**: `Collab123!@#`
- **Plan**: Team
- **Usage Limit**: 2,000 requests/day
- **Features**: Team collaboration, shared workspaces, multi-user features
- **Status**: Verified

#### Near-Limit Test User
- **Email**: `henry.test@teachai.com`
- **Password**: `Tester123!@#`
- **Plan**: Free
- **Usage**: 8/10 requests used
- **Purpose**: Test usage limit restrictions and upgrade prompts
- **2FA**: Enabled
- **Status**: Verified

## 📊 Subscription Plans Overview

| Plan | Daily Requests | Storage | File Uploads | Price | Features |
|------|---------------|---------|--------------|-------|----------|
| Free | 10 | 10MB | 1 | $0 | Basic chatbots, 30+ languages |
| Trial | 100 | 100MB | 5 | $0 (14 days) | Enhanced features trial |
| Pro | 500 | 1GB | 25 | $19/month | Advanced AI tools, collaboration |
| Premium | 1,000 | 5GB | 50 | $49/month | Full AI suite, priority support |
| Team | 2,000 | 10GB | 100 | $99/month | Team features, shared workspaces |
| Enterprise | 5,000 | 50GB | 500 | Custom | Custom integrations, dedicated support |

## 🧪 Testing Scenarios

### Authentication Testing
1. **Login Flow**: Use any verified user credentials
2. **Registration**: Use `david.new@teachai.com` for OTP verification testing
3. **2FA Testing**: Use `bob.educator@teachai.com` or `henry.test@teachai.com`
4. **Password Reset**: Test with any verified user email

### Role-Based Access Testing
1. **Admin Features**: Login as `admin@teachai.com`
   - User management dashboard
   - System analytics
   - Platform configuration
2. **User Features**: Login as any regular user
   - AI chatbots access
   - Content creation
   - Usage tracking

### Subscription Plan Testing
1. **Free Limits**: Use `carol.student@teachai.com` or `henry.test@teachai.com`
2. **Premium Features**: Use `alice.teacher@teachai.com`
3. **Trial Experience**: Use `frank.trial@teachai.com`
4. **Team Collaboration**: Use `grace.collab@teachai.com`

### Feature-Specific Testing
1. **Usage Limits**: Use `henry.test@teachai.com` (near limit)
2. **File Uploads**: Test different limits per plan
3. **Collaboration**: Use team plan users
4. **Analytics**: Use admin or premium users

## 🔧 Development Workflow

### Initial Setup
1. Run backend: `npm start` (from backend directory)
2. Seed test users: `npm run seed:users`
3. Start frontend: `npm start` (from root directory)
4. Visit: `http://localhost:3000/login`

### Testing Different Flows
1. **New User Registration**: 
   - Register with new email
   - Test OTP verification
   - Check email notifications

2. **Existing User Login**:
   - Use provided credentials
   - Test 2FA flow (where enabled)
   - Verify dashboard access

3. **Admin Operations**:
   - Login as admin
   - Access user management
   - View platform analytics

### Database Cleanup
```bash
# Remove all test users when needed
npm run seed:users:cleanup
```

## 🔐 Security Considerations

- **Development Only**: These credentials are for development/testing ONLY
- **Never Use in Production**: All passwords are known and documented
- **Regular Cleanup**: Remove test data before production deployment
- **Password Pattern**: All passwords follow `[Role]123!@#` format for easy testing

## 📱 Quick Access URLs

- **Login**: `http://localhost:3000/login`
- **Registration**: `http://localhost:3000/signup`
- **Dashboard**: `http://localhost:3000/user/dashboard`
- **Admin Panel**: `http://localhost:3000/admin` (if available)

## 🛠 Script Maintenance

### Adding New Test Users
1. Edit `backend/scripts/seed-users.js`
2. Add new user object to `TEST_USERS` array
3. Run seeding script to create new users

### Updating Existing Users
1. Modify user data in the script
2. Re-run seeding script (will update existing users)
3. Script handles both creation and updates automatically

### Plan Configuration
- Plans are configured in `USAGE_PLANS` object
- Modify limits and features as needed
- Script automatically creates usage records

## 📋 Troubleshooting

### Common Issues
1. **Database Connection**: Ensure MongoDB is running
2. **Duplicate Email**: Script handles updates automatically
3. **Permission Errors**: Check file system permissions for scripts directory

### Verification
```bash
# Check if users were created
# Login to MongoDB and query users collection
# Or use admin dashboard to view user list
```

## 🎯 Testing Checklist

- [ ] Admin login and dashboard access
- [ ] User registration and OTP verification  
- [ ] Different subscription plan features
- [ ] Usage limit enforcement
- [ ] File upload restrictions
- [ ] 2FA authentication flow
- [ ] Collaboration features (team plans)
- [ ] Email notifications
- [ ] Password reset functionality
- [ ] Role-based access control

This comprehensive test user setup ensures thorough testing of all TeachAI platform features across different user types, plans, and scenarios.