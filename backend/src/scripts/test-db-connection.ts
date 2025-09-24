import mongoose from 'mongoose';
import { connectDB } from '../config/database';
import logger from '../config/logger';

/**
 * Test script to verify MongoDB connection
 * Run with: npm run test:db or ts-node src/scripts/test-db-connection.ts
 */

const testDatabaseConnection = async (): Promise<void> => {
  try {
    logger.info('🧪 Starting database connection test...');
    
    // Test connection
    await connectDB();
    
    // Test basic operations
    logger.info('📊 Testing basic database operations...');
    
    // Get database stats
    const stats = await mongoose.connection.db.stats();
    logger.info('📈 Database stats:', {
      collections: stats.collections,
      dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
      storageSize: `${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`,
    });
    
    // List existing collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    logger.info('📋 Existing collections:', collections.map(c => c.name));
    
    // Test creating a simple document (will create collection if not exists)
    const TestCollection = mongoose.connection.db.collection('connection_test');
    const testDoc = {
      test: true,
      timestamp: new Date(),
      message: 'Database connection test successful'
    };
    
    await TestCollection.insertOne(testDoc);
    logger.info('✅ Test document inserted successfully');
    
    // Clean up test document
    await TestCollection.deleteOne({ test: true });
    logger.info('🧹 Test document cleaned up');
    
    logger.info('🎉 Database connection test completed successfully!');
    
  } catch (error) {
    logger.error('❌ Database connection test failed:', error);
    throw error;
  } finally {
    // Close connection
    await mongoose.connection.close();
    logger.info('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the test
testDatabaseConnection().catch((error) => {
  logger.error('💥 Test script failed:', error);
  process.exit(1);
});