const mongoose = require("mongoose");
require("dotenv").config();

// MongoDB connection
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://Admin:1234@localhost:27017/timesheet-management?authSource=admin";

// Simple schemas for the data we need
const UserSchema = new mongoose.Schema({
  email: String,
  full_name: String,
  role: String,
}, { collection: 'users' });

const TaskSchema = new mongoose.Schema({
  name: String,
  project_id: mongoose.Schema.Types.ObjectId,
  assigned_to_user_id: mongoose.Schema.Types.ObjectId,
  status: String,
}, { collection: 'tasks' });

const ProjectSchema = new mongoose.Schema({
  name: String,
}, { collection: 'projects' });

async function checkAndAssignTasks() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.model('User', UserSchema);
    const Task = mongoose.model('Task', TaskSchema);
    const Project = mongoose.model('Project', ProjectSchema);

    // Check current tasks
    console.log('\n=== Current Tasks in Database ===');
    const tasks = await Task.find({}).populate('project_id');
    
    if (tasks.length === 0) {
      console.log('❌ No tasks found in database');
      return;
    }

    tasks.forEach(task => {
      console.log(`Task: ${task.name}`);
      console.log(`  ID: ${task._id}`);
      console.log(`  Project: ${task.project_id?.name || 'Unknown'}`);
      console.log(`  Assigned To: ${task.assigned_to_user_id || 'NOT ASSIGNED'}`);
      console.log(`  Status: ${task.status}`);
      console.log('---');
    });
    
    // Get available users
    console.log('\n=== Available Users ===');
    const users = await User.find({}, { email: 1, full_name: 1, role: 1 });
    users.forEach(user => {
      console.log(`${user.full_name} (${user.role}): ${user.email} - ID: ${user._id}`);
    });

    // Find employee1 to assign tasks to
    const employee1 = await User.findOne({ email: 'employee1@company.com' });
    if (!employee1) {
      console.log('\n❌ employee1@company.com not found');
      return;
    }

    console.log(`\n🎯 Found employee1: ${employee1.full_name} (ID: ${employee1._id})`);

    // Assign first few tasks to employee1
    const unassignedTasks = await Task.find({ 
      $or: [
        { assigned_to_user_id: null },
        { assigned_to_user_id: { $exists: false } }
      ]
    });

    if (unassignedTasks.length === 0) {
      console.log('\n✅ All tasks are already assigned');
    } else {
      console.log(`\n🔧 Assigning ${Math.min(2, unassignedTasks.length)} task(s) to employee1...`);
      
      for (let i = 0; i < Math.min(2, unassignedTasks.length); i++) {
        const task = unassignedTasks[i];
        await Task.updateOne(
          { _id: task._id },
          { assigned_to_user_id: employee1._id }
        );
        console.log(`✅ Assigned "${task.name}" to ${employee1.full_name}`);
      }
    }

    // Check final state
    console.log('\n=== Final Task Assignments ===');
    const finalTasks = await Task.find({ assigned_to_user_id: employee1._id });
    console.log(`employee1@company.com has ${finalTasks.length} assigned task(s):`);
    finalTasks.forEach(task => {
      console.log(`  - ${task.name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkAndAssignTasks();