# 🔑 TeachAI Test User Credentials

## 📁 What's in this directory?

This directory contains automatically generated test user credentials for the TeachAI platform development environment.

## 🚀 Latest Credentials File

**Current file:** `test-user-credentials-2025-09-28.json`

### Quick Access Credentials:

| Role | Email | Password | Plan | Features |
|------|-------|----------|------|----------|
| **Admin** | admin@teachai.com | Admin123!@# | Free | Full platform access |
| **Premium User** | alice.teacher@teachai.com | Teacher123!@# | Free | AI tools, analytics |
| **Free User** | carol.student@teachai.com | Student123!@# | Free | Basic AI chatbots |
| **Unverified** | david.new@teachai.com | NewUser123!@# | Free | For testing registration |

## 🔧 How to Use

1. **Start Backend:** `cd backend && npm start`
2. **Start Frontend:** `npm start` 
3. **Login:** Visit http://localhost:3000/login
4. **Test:** Use any email/password combination from the JSON file

## 🗑️ Clean Up

Remove test users when done:
```bash
npm run seed:users:cleanup
```

## ⚠️ Important Notes

- **Development Only:** These credentials are for testing only
- **Never Production:** Don't use these in production environments
- **Auto-Generated:** New files created each time you run the seeding script
- **Git Ignored:** Credential files are automatically excluded from git commits

## 📊 Testing Scenarios

- **Admin Features:** Use admin@teachai.com
- **User Registration:** Use david.new@teachai.com (unverified)
- **Premium Features:** Use alice.teacher@teachai.com
- **Free Plan Limits:** Use carol.student@teachai.com
- **2FA Testing:** Use users with two_factor: true

## 🔄 Regenerate Credentials

To create fresh test users and credentials:
```bash
cd backend
npm run seed:users
```

This will create a new timestamped credentials file with all current test users.