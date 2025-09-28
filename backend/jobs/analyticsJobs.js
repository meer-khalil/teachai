const cron = require('node-cron');
const { 
  calculateDailyMetrics, 
  updateRealtimeMetrics,
  updateUserBehaviorInsights,
  cleanOldAnalyticsData 
} = require('../utils/analyticsUtil');
const { AnalyticsEvent, UserSession } = require('../models/analyticsModel');

class AnalyticsJobScheduler {
  constructor() {
    this.jobs = new Map();
  }

  // Start all scheduled jobs
  startAllJobs() {
    console.log('Starting analytics job scheduler...');
    
    // Start individual jobs
    this.scheduleRealtimeMetricsUpdate();
    this.scheduleDailyMetricsCalculation();
    this.scheduleUserBehaviorUpdate();
    this.scheduleDataCleanup();
    this.scheduleSessionCleanup();

    console.log('All analytics jobs scheduled successfully');
  }

  // Stop all jobs
  stopAllJobs() {
    console.log('Stopping all analytics jobs...');
    this.jobs.forEach(job => job.stop());
    this.jobs.clear();
  }

  // Update real-time metrics every 30 seconds
  scheduleRealtimeMetricsUpdate() {
    const job = cron.schedule('*/30 * * * * *', async () => {
      try {
        await updateRealtimeMetrics();
        // console.log('Real-time metrics updated');
      } catch (error) {
        console.error('Error in real-time metrics job:', error);
      }
    }, {
      scheduled: true,
      timezone: "America/New_York"
    });

    this.jobs.set('realtimeMetrics', job);
    console.log('Real-time metrics job scheduled (every 30 seconds)');
  }

  // Calculate daily metrics every day at 1:00 AM
  scheduleDailyMetricsCalculation() {
    const job = cron.schedule('0 1 * * *', async () => {
      try {
        console.log('Starting daily metrics calculation...');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        await calculateDailyMetrics(yesterday);
        console.log('Daily metrics calculation completed');
      } catch (error) {
        console.error('Error in daily metrics calculation job:', error);
      }
    }, {
      scheduled: true,
      timezone: "America/New_York"
    });

    this.jobs.set('dailyMetrics', job);
    console.log('Daily metrics calculation job scheduled (daily at 1:00 AM)');
  }

  // Update user behavior insights every 6 hours
  scheduleUserBehaviorUpdate() {
    const job = cron.schedule('0 */6 * * *', async () => {
      try {
        console.log('Starting user behavior insights update...');
        
        // Get users with recent activity (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const activeUsers = await AnalyticsEvent.distinct('userId', {
          timestamp: { $gte: sevenDaysAgo },
          userId: { $exists: true }
        });

        console.log(`Updating behavior insights for ${activeUsers.length} active users`);

        // Process users in batches to avoid overwhelming the system
        const batchSize = 10;
        for (let i = 0; i < activeUsers.length; i += batchSize) {
          const batch = activeUsers.slice(i, i + batchSize);
          
          await Promise.all(
            batch.map(userId => updateUserBehaviorInsights(userId))
          );
          
          // Small delay between batches
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log('User behavior insights update completed');
      } catch (error) {
        console.error('Error in user behavior update job:', error);
      }
    }, {
      scheduled: true,
      timezone: "America/New_York"
    });

    this.jobs.set('userBehavior', job);
    console.log('User behavior update job scheduled (every 6 hours)');
  }

  // Clean old data every day at 3:00 AM
  scheduleDataCleanup() {
    const job = cron.schedule('0 3 * * *', async () => {
      try {
        console.log('Starting analytics data cleanup...');
        await cleanOldAnalyticsData();
        console.log('Analytics data cleanup completed');
      } catch (error) {
        console.error('Error in data cleanup job:', error);
      }
    }, {
      scheduled: true,
      timezone: "America/New_York"
    });

    this.jobs.set('dataCleanup', job);
    console.log('Data cleanup job scheduled (daily at 3:00 AM)');
  }

  // Clean inactive sessions every hour
  scheduleSessionCleanup() {
    const job = cron.schedule('0 * * * *', async () => {
      try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        // Mark sessions as inactive if no activity in last hour
        const result = await UserSession.updateMany(
          {
            isActive: true,
            // No recent events for this session
            $nor: [{
              sessionId: {
                $in: await AnalyticsEvent.distinct('sessionId', {
                  timestamp: { $gte: oneHourAgo }
                })
              }
            }]
          },
          {
            $set: {
              isActive: false,
              endTime: new Date()
            }
          }
        );

        if (result.modifiedCount > 0) {
          console.log(`Marked ${result.modifiedCount} sessions as inactive`);
        }
      } catch (error) {
        console.error('Error in session cleanup job:', error);
      }
    }, {
      scheduled: true,
      timezone: "America/New_York"
    });

    this.jobs.set('sessionCleanup', job);
    console.log('Session cleanup job scheduled (every hour)');
  }

  // Manual job execution methods for testing/debugging
  async runDailyMetricsNow(date) {
    try {
      console.log('Manually running daily metrics calculation...');
      const result = await calculateDailyMetrics(date || new Date());
      console.log('Manual daily metrics calculation completed');
      return result;
    } catch (error) {
      console.error('Error in manual daily metrics calculation:', error);
      throw error;
    }
  }

  async runRealtimeMetricsNow() {
    try {
      console.log('Manually running real-time metrics update...');
      const result = await updateRealtimeMetrics();
      console.log('Manual real-time metrics update completed');
      return result;
    } catch (error) {
      console.error('Error in manual real-time metrics update:', error);
      throw error;
    }
  }

  async runUserBehaviorUpdateNow(userId) {
    try {
      console.log(`Manually running user behavior update for user ${userId}...`);
      const result = await updateUserBehaviorInsights(userId);
      console.log('Manual user behavior update completed');
      return result;
    } catch (error) {
      console.error('Error in manual user behavior update:', error);
      throw error;
    }
  }

  async runDataCleanupNow() {
    try {
      console.log('Manually running data cleanup...');
      await cleanOldAnalyticsData();
      console.log('Manual data cleanup completed');
    } catch (error) {
      console.error('Error in manual data cleanup:', error);
      throw error;
    }
  }

  // Get job status
  getJobStatus() {
    const status = {};
    this.jobs.forEach((job, name) => {
      status[name] = {
        running: job.running,
        scheduled: job.scheduled,
        lastExecution: job.lastDate || null,
        nextExecution: job.nextDate || null
      };
    });
    return status;
  }
}

// Create singleton instance
const analyticsJobScheduler = new AnalyticsJobScheduler();

// Export for use in app initialization
module.exports = {
  AnalyticsJobScheduler,
  analyticsJobScheduler
};