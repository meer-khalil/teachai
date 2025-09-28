const mongoose = require('mongoose');
const { optimizeDbConnection, queryOptimizationMiddleware, connectionMonitor } = require('../middlewares/databaseOptimization');

// Fallback MongoDB URIs for different environments
const FALLBACK_MONGO_URI = 'mongodb://127.0.0.1:27017/teachai';
// const FALLBACK_MONGO_URI = 'mongodb://localhost:27017/teachai';
// const FALLBACK_MONGO_URI = 'mongodb+srv://khalil:raeela123@cluster0.zd8175o.mongodb.net/teachai?retryWrites=true&w=majority';

const connectDatabase = () => {
    // Get MongoDB URI with fallback
    const mongoUri = process.env.MONGO_URI || FALLBACK_MONGO_URI;
    
    // Log which URI is being used
    if (!process.env.MONGO_URI) {
        console.log('⚠️  No MONGO_URI environment variable found, using fallback URI');
    }
    
    // Get optimized connection options
    const connectionOptions = Object.assign(
        { useNewUrlParser: true, useUnifiedTopology: true },
        optimizeDbConnection()
    );
    
    // Initialize query optimization middleware
    queryOptimizationMiddleware();
    
    // Initialize connection monitoring
    connectionMonitor();
    
    console.log('🔄 Connecting to MongoDB with optimized settings...');
    console.log(`🔗 Using MongoDB URI: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials in logs
    
    mongoose.connect(mongoUri, connectionOptions)
        .then(() => {
            console.log("✅ Mongoose Connected with Performance Optimizations");
            console.log(`📊 Connection Pool Size: ${connectionOptions.maxPoolSize}`);
            console.log(`⚡ Socket Timeout: ${connectionOptions.socketTimeoutMS}ms`);
            console.log(`🗜️  Compression: ${connectionOptions.compressors ? 'Enabled' : 'Disabled'}`);
        })
        .catch((error) => {
            console.error("❌ Mongoose Connection Error:", error);
        });
};

module.exports = connectDatabase;