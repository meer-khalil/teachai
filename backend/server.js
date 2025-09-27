require('dotenv').config()
const cloudinary = require('cloudinary');

const app = require('./app');
const connectDatabase = require('./config/database');
// const cloudinary = require('cloudinary');
const { appLogger, errorLogger } = require('./middlewares/logger');
const { applicationMonitor } = require('./utils/monitoring');
const PORT = process.env.PORT || 4000;


// UncaughtException Error
process.on('uncaughtException', (err) => {
    errorLogger.error('Uncaught Exception', { 
        error: err.message, 
        stack: err.stack,
        pid: process.pid 
    });
    
    applicationMonitor.emit('error', err, { 
        type: 'uncaughtException', 
        severity: 'critical' 
    });
    
    console.log(`Error: ${err.message}`);
    
    // Graceful shutdown
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});

cloudinary.config({
    cloud_name: 'dorkg3ul4',
    api_key: '352236855563716',
    api_secret: 'RsdJiFa0fS8wRzp-EBwUoOR1m_A',
});

connectDatabase();

const server = app.listen(PORT, () => {
    const message = `Server running on http://localhost:${PORT}`;
    console.log(message);
    appLogger.info('Server Started', { 
        port: PORT, 
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid
    });
});


// Unhandled Promise Rejection
process.on('unhandledRejection', (err) => {
    errorLogger.error('Unhandled Promise Rejection', { 
        error: err.message, 
        stack: err.stack,
        pid: process.pid 
    });
    
    applicationMonitor.emit('error', err, { 
        type: 'unhandledRejection', 
        severity: 'critical' 
    });
    
    console.log(`Error: ${err.message}`);
    server.close(() => {
        appLogger.info('Server Closed due to Unhandled Promise Rejection');
        process.exit(1);
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    appLogger.info('SIGTERM received, shutting down gracefully');
    applicationMonitor.stopMonitoring();
    
    server.close(() => {
        appLogger.info('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    appLogger.info('SIGINT received, shutting down gracefully');
    applicationMonitor.stopMonitoring();
    
    server.close(() => {
        appLogger.info('Process terminated');
        process.exit(0);
    });
});