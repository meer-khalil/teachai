// MongoDB initialization script for Docker
db = db.getSiblingDB('teachai');

// Create application user
db.createUser({
  user: 'teachai_user',
  pwd: 'teachai_password',
  roles: [
    {
      role: 'readWrite',
      db: 'teachai'
    }
  ]
});

// Create indexes for performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "createdAt": -1 });

db.chathistories.createIndex({ "userId": 1, "createdAt": -1 });
db.chathistories.createIndex({ "chatbotType": 1 });

db.posts.createIndex({ "title": "text", "content": "text" });
db.posts.createIndex({ "createdAt": -1 });

db.payments.createIndex({ "userId": 1 });
db.payments.createIndex({ "status": 1 });
db.payments.createIndex({ "createdAt": -1 });

db.usages.createIndex({ "userId": 1 }, { unique: true });

// Create collections with validation
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email"],
      properties: {
        name: {
          bsonType: "string",
          description: "must be a string and is required"
        },
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
          description: "must be a valid email address and is required"
        }
      }
    }
  }
});

print("MongoDB initialization completed successfully");