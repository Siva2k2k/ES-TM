import dotenv from 'dotenv';
import logger from '../config/logger';

/**
 * Debug environment variables
 */

const debugEnv = (): void => {
  // Load environment variables
  dotenv.config();
  
  logger.info('🔍 Debugging environment variables...');
  logger.info('📂 Current working directory:', process.cwd());
  logger.info('📄 NODE_ENV:', process.env.NODE_ENV);
  logger.info('🔗 MONGODB_URI:', process.env.MONGODB_URI ? '✅ Found' : '❌ Not found');
  
  if (process.env.MONGODB_URI) {
    // Mask credentials for logging
    const maskedUri = process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@');
    logger.info('📡 Masked URI:', maskedUri);
    
    // Show original URI (without logging) for debugging
    console.log('🔐 Full URI (console only):', process.env.MONGODB_URI);
  }
  
  logger.info('🔑 JWT_SECRET:', process.env.JWT_SECRET ? '✅ Found' : '❌ Not found');
  logger.info('🌐 PORT:', process.env.PORT || 'Not set (will use default)');
  
  // Check if .env file exists
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(process.cwd(), '.env');
  
  if (fs.existsSync(envPath)) {
    logger.info('📋 .env file found at:', envPath);
    
    // Read and show .env content (be careful in production!)
    const envContent = fs.readFileSync(envPath, 'utf8');
    logger.info('📝 .env file content preview:');
    console.log('--- .env content ---');
    console.log(envContent);
    console.log('--- end .env content ---');
  } else {
    logger.error('❌ .env file not found at:', envPath);
  }
};

debugEnv();