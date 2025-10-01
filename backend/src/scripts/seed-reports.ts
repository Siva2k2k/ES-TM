// @ts-nocheck - Temporarily disable type checking for Mongoose compatibility issues
// Seed only report templates
import 'module-alias/register';
import dotenv from 'dotenv';
import { connectToDatabase } from '../config/database';
import { seedReportTemplates } from '../seeds/reportTemplateSeeds';
import { User } from '../models/User';
import logger from '../config/logger';

dotenv.config();

const seedReports = async (): Promise<void> => {
  try {
    // Connect to database
    await connectToDatabase();
    
    logger.info('🌱 Starting report templates seeding...');

    // Get admin user to use as creator
    const adminUser = await User.findOne({ role: 'super_admin' });
    if (!adminUser) {
      throw new Error('No admin user found. Please run the main seed script first.');
    }

    // Seed report templates
    await seedReportTemplates(adminUser._id.toString());
    
    logger.info('✅ Report templates seeding completed successfully!');
    process.exit(0);
    
  } catch (error) {
    logger.error('❌ Report seeding failed:', error);
    process.exit(1);
  }
};

seedReports();