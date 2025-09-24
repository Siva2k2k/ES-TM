import mongoose from 'mongoose';
import logger from '../config/logger';

/**
 * Test MongoDB connection without authentication
 * This will help us understand the MongoDB setup
 */

const testNoAuth = async (): Promise<void> => {
  try {
    logger.info('🔓 Testing MongoDB connection without authentication...');
    
    // Connect without credentials
    const mongoURI = 'mongodb://localhost:27017/timesheet-management';
    logger.info(`📡 Connecting to: ${mongoURI}`);
    
    await mongoose.connect(mongoURI);
    
    logger.info('✅ Connection successful without authentication!');
    logger.info('💡 This means your MongoDB instance might not have authentication enabled');
    
    // Test basic operations
    const TestCollection = mongoose.connection.db.collection('connection_test');
    const testDoc = {
      test: true,
      timestamp: new Date(),
      message: 'No-auth test successful'
    };
    
    const result = await TestCollection.insertOne(testDoc);
    logger.info('✅ Document inserted successfully', { insertedId: result.insertedId });
    
    // Clean up
    await TestCollection.deleteOne({ test: true });
    logger.info('✅ Test document cleaned up');
    
    logger.info('🎉 MongoDB is working without authentication!');
    logger.info('💡 Recommendation: You can either:');
    logger.info('   1. Continue without authentication (for development)');
    logger.info('   2. Enable authentication and create proper users');
    
  } catch (error) {
    logger.error('❌ Connection failed even without authentication:', error);
    
    if (error.message.includes('ECONNREFUSED')) {
      logger.error('💡 MongoDB server is not running. Please start MongoDB');
    }
  } finally {
    await mongoose.connection.close();
    logger.info('🔌 Connection closed');
    process.exit(0);
  }
};

testNoAuth().catch((error) => {
  logger.error('💥 Test failed:', error);
  process.exit(1);
});