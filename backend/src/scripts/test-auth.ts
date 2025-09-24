import mongoose from 'mongoose';
import { connectDB } from '../config/database';
import logger from '../config/logger';

/**
 * Simple MongoDB authentication test
 * Run with: npm run test:auth
 */

const testAuthentication = async (): Promise<void> => {
  try {
    logger.info('🔐 Testing MongoDB authentication...');
    
    // Test connection
    await connectDB();
    
    logger.info('✅ Basic connection successful');
    
    // Test creating a simple collection without admin operations
    const TestCollection = mongoose.connection.db.collection('auth_test');
    
    // Insert a test document
    const testDoc = {
      test: true,
      timestamp: new Date(),
      message: 'Authentication test successful'
    };
    
    const result = await TestCollection.insertOne(testDoc);
    logger.info('✅ Document inserted successfully', { insertedId: result.insertedId });
    
    // Try to find the document we just inserted
    const found = await TestCollection.findOne({ test: true });
    logger.info('✅ Document retrieved successfully', { found: !!found });
    
    // Clean up test document
    await TestCollection.deleteOne({ test: true });
    logger.info('✅ Test document cleaned up successfully');
    
    // Try listing collections (this should work with proper auth)
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      logger.info('✅ Collections listed successfully', { 
        count: collections.length,
        names: collections.map(c => c.name) 
      });
    } catch (error) {
      logger.warn('⚠️ Could not list collections (might need admin privileges)', { error: error.message });
    }
    
    logger.info('🎉 Authentication test completed successfully!');
    
  } catch (error) {
    logger.error('❌ Authentication test failed:', error);
    
    // Additional error analysis
    if (error.message.includes('authentication')) {
      logger.error('💡 Suggestion: Check MongoDB user credentials and permissions');
    } else if (error.message.includes('ECONNREFUSED')) {
      logger.error('💡 Suggestion: Make sure MongoDB is running on localhost:27017');
    }
    
    throw error;
  } finally {
    // Close connection
    await mongoose.connection.close();
    logger.info('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the test
testAuthentication().catch((error) => {
  logger.error('💥 Authentication test failed:', error);
  process.exit(1);
});