// Add sample timesheet data for meaningful reports
// @ts-nocheck - Temporarily disable type checking for Mongoose compatibility issues
import 'module-alias/register';
import dotenv from 'dotenv';
import { connectToDatabase } from '../config/database';
import { Timesheet, TimeEntry } from '../models';
import { User } from '../models/User';
import { Project } from '../models/Project';
import logger from '../config/logger';

dotenv.config();

const seedTimesheetData = async (): Promise<void> => {
  try {
    // Connect to database
    await connectToDatabase();
    
    logger.info('🌱 Starting timesheet data seeding...');

    // Get users and projects
    const users = await User.find({});
    const projects = await Project.find({});
    
    if (users.length === 0 || projects.length === 0) {
      throw new Error('No users or projects found. Please run main seed script first.');
    }

    logger.info(`Found ${users.length} users and ${projects.length} projects`);

    // Create sample timesheets for the last 2 months
    const timesheetData = [];
    const timeEntryData = [];

    for (const user of users) {
      // Create 8 weeks of timesheets (2 months)
      for (let week = 0; week < 8; week++) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (week * 7) - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        // Create timesheet with correct status values
        const status = week < 2 ? 'manager_approved' : week < 4 ? 'submitted' : 'draft';
        const timesheet = {
          user_id: user._id,
          week_start_date: weekStart,
          week_end_date: weekEnd,
          status: status,
          total_hours: 0,
          submitted_at: week < 4 ? new Date(weekEnd.getTime() - 86400000) : null, // 1 day before week end
          approved_by_manager_at: week < 2 ? new Date(weekEnd.getTime() - 43200000) : null, // 12 hours before week end
          approved_by_manager_id: week < 2 ? users[0]._id : null, // First user (admin) approves
          is_verified: week < 2,
          is_frozen: week < 1, // Only first week is frozen for billing
        };

        timesheetData.push(timesheet);

        // Create time entries for each day of the week
        for (let day = 0; day < 5; day++) { // Monday to Friday
          const entryDate = new Date(weekStart);
          entryDate.setDate(entryDate.getDate() + day);
          
          // Random project assignment
          const project = projects[Math.floor(Math.random() * projects.length)];
          
          // Random hours (6-9 hours per day)
          const hours = 6 + Math.random() * 3;
          
          const timeEntry = {
            timesheet_id: null, // Will be set after timesheet creation
            project_id: project._id,
            date: entryDate,
            hours: Math.round(hours * 100) / 100, // Round to 2 decimals
            description: `Work on ${project.name} - Development and testing`,
            entry_type: 'project_task',
            is_billable: Math.random() > 0.2, // 80% billable
          };

          timeEntryData.push(timeEntry);
          timesheet.total_hours += timeEntry.hours;
        }

        // Round total hours
        timesheet.total_hours = Math.round(timesheet.total_hours * 100) / 100;
      }
    }

    // Insert timesheets
    logger.info('📝 Creating timesheets...');
    const createdTimesheets = await Timesheet.insertMany(timesheetData);
    logger.info(`✅ Created ${createdTimesheets.length} timesheets`);

    // Update time entries with timesheet IDs
    let entryIndex = 0;
    for (let i = 0; i < createdTimesheets.length; i++) {
      for (let j = 0; j < 5; j++) { // 5 days per week
        if (entryIndex < timeEntryData.length) {
          timeEntryData[entryIndex].timesheet_id = createdTimesheets[i]._id;
          entryIndex++;
        }
      }
    }

    // Insert time entries
    logger.info('⏰ Creating time entries...');
    const createdTimeEntries = await TimeEntry.insertMany(timeEntryData);
    logger.info(`✅ Created ${createdTimeEntries.length} time entries`);

    // Summary
    const totalHours = timeEntryData.reduce((sum, entry) => sum + entry.hours, 0);
    const billableHours = timeEntryData.filter(entry => entry.is_billable).reduce((sum, entry) => sum + entry.hours, 0);

    logger.info(`
📊 Timesheet Data Summary:
   Users: ${users.length}
   Timesheets: ${createdTimesheets.length}
   Time Entries: ${createdTimeEntries.length}
   Total Hours: ${Math.round(totalHours)}
   Billable Hours: ${Math.round(billableHours)}
   Period: ${Math.round(totalHours / users.length / createdTimesheets.length * users.length)} hours per week per user
`);

    logger.info('✅ Timesheet data seeding completed successfully!');
    process.exit(0);
    
  } catch (error) {
    logger.error('❌ Timesheet seeding failed:', error);
    process.exit(1);
  }
};

seedTimesheetData();