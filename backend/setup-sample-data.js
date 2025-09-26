const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// MongoDB connection
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://Admin:1234@localhost:27017/timesheet-management?authSource=admin";

// User schema - matching the backend User model
const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["super_admin", "management", "manager", "lead", "employee"],
      default: "employee",
    },
    hourly_rate: {
      type: Number,
      default: 0,
      min: 0,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_approved_by_super_admin: {
      type: Boolean,
      default: false,
    },
    manager_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    password_hash: {
      type: String,
      required: false,
    },
    deleted_at: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Client schema
const ClientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    contact_person: {
      type: String,
      trim: true,
      required: false,
    },
    contact_email: {
      type: String,
      lowercase: true,
      trim: true,
      required: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    deleted_at: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Project schema
const ProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    primary_manager_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "archived"],
      default: "active",
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      required: false,
    },
    budget: {
      type: Number,
      min: 0,
      required: false,
    },
    description: {
      type: String,
      trim: true,
      required: false,
    },
    is_billable: {
      type: Boolean,
      default: true,
    },
    deleted_at: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Project Member schema
const ProjectMemberSchema = new mongoose.Schema(
  {
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project_role: {
      type: String,
      enum: ["super_admin", "management", "manager", "lead", "employee"],
      required: true,
    },
    is_primary_manager: {
      type: Boolean,
      default: false,
    },
    is_secondary_manager: {
      type: Boolean,
      default: false,
    },
    assigned_at: {
      type: Date,
      default: Date.now,
    },
    removed_at: {
      type: Date,
      required: false,
    },
    deleted_at: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Task schema
const TaskSchema = new mongoose.Schema(
  {
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      required: false,
    },
    assigned_to_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    status: {
      type: String,
      default: "open",
      trim: true,
    },
    estimated_hours: {
      type: Number,
      min: 0,
      required: false,
    },
    is_billable: {
      type: Boolean,
      default: true,
    },
    created_by_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deleted_at: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Timesheet schema
const TimesheetSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    week_start_date: {
      type: Date,
      required: true,
    },
    week_end_date: {
      type: Date,
      required: true,
    },
    total_hours: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "draft",
        "submitted",
        "manager_approved",
        "manager_rejected",
        "management_pending",
        "management_rejected",
        "frozen",
        "billed",
      ],
      default: "draft",
    },
    // Manager approval fields
    approved_by_manager_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    approved_by_manager_at: {
      type: Date,
      required: false,
    },
    manager_rejection_reason: {
      type: String,
      trim: true,
      required: false,
    },
    manager_rejected_at: {
      type: Date,
      required: false,
    },
    // Management approval fields
    approved_by_management_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    approved_by_management_at: {
      type: Date,
      required: false,
    },
    management_rejection_reason: {
      type: String,
      trim: true,
      required: false,
    },
    management_rejected_at: {
      type: Date,
      required: false,
    },
    // Verification fields
    verified_by_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    verified_at: {
      type: Date,
      required: false,
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
    is_frozen: {
      type: Boolean,
      default: false,
    },
    // Billing integration
    billing_snapshot_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    // Submission tracking
    submitted_at: {
      type: Date,
      required: false,
    },
    deleted_at: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Time Entry schema
const TimeEntrySchema = new mongoose.Schema(
  {
    timesheet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Timesheet",
      required: true,
    },
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: false,
    },
    task_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: false,
    },
    date: {
      type: Date,
      required: true,
    },
    hours: {
      type: Number,
      required: true,
      min: 0,
      max: 24,
    },
    description: {
      type: String,
      trim: true,
      required: false,
    },
    is_billable: {
      type: Boolean,
      default: true,
    },
    custom_task_description: {
      type: String,
      trim: true,
      required: false,
    },
    entry_type: {
      type: String,
      enum: ["project_task", "custom_task"],
      default: "project_task",
    },
    hourly_rate: {
      type: Number,
      min: 0,
      required: false,
    },
    deleted_at: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Add unique constraint for timesheet
TimesheetSchema.index({ user_id: 1, week_start_date: 1 }, { unique: true });

// Models
const User = mongoose.model("User", UserSchema);
const Client = mongoose.model("Client", ClientSchema);
const Project = mongoose.model("Project", ProjectSchema);
const ProjectMember = mongoose.model("ProjectMember", ProjectMemberSchema);
const Task = mongoose.model("Task", TaskSchema);
const Timesheet = mongoose.model("Timesheet", TimesheetSchema);
const TimeEntry = mongoose.model("TimeEntry", TimeEntrySchema);

// Helper functions
function getWeekStartDate(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // First day is Sunday (0)
  return new Date(d.setDate(diff));
}

function getWeekEndDate(weekStart) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return weekEnd;
}

async function setupSampleData() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await Promise.all([
      TimeEntry.deleteMany({}),
      Timesheet.deleteMany({}),
      Task.deleteMany({}),
      ProjectMember.deleteMany({}),
      Project.deleteMany({}),
      Client.deleteMany({}),
      User.deleteMany({}),
    ]);
    console.log("🗑️ Cleared existing data");

    // 1. CREATE USERS with role hierarchy
    console.log("\n📝 Creating Users...");

    const superAdminPassword = await bcrypt.hash("Admin123!", 10);
    const superAdmin = await User.create({
      email: "admin@company.com",
      password_hash: superAdminPassword,
      full_name: "System Administrator",
      role: "super_admin",
      hourly_rate: 100,
      is_active: true,
      is_approved_by_super_admin: true,
    });
    console.log("✅ Created Super Admin:", superAdmin.email);

    const managementPassword = await bcrypt.hash("Management123!", 10);
    const managementUser = await User.create({
      email: "management@company.com",
      password_hash: managementPassword,
      full_name: "Management Director",
      role: "management",
      hourly_rate: 80,
      is_active: true,
      is_approved_by_super_admin: true,
    });
    console.log("✅ Created Management:", managementUser.email);

    const managerPassword = await bcrypt.hash("Manager123!", 10);
    const manager1 = await User.create({
      email: "manager1@company.com",
      password_hash: managerPassword,
      full_name: "Project Manager 1",
      role: "manager",
      hourly_rate: 60,
      is_active: true,
      is_approved_by_super_admin: true,
    });

    const manager2 = await User.create({
      email: "manager2@company.com",
      password_hash: managerPassword,
      full_name: "Project Manager 2",
      role: "manager",
      hourly_rate: 55,
      is_active: true,
      is_approved_by_super_admin: true,
    });
    console.log("✅ Created Managers:", manager1.email, manager2.email);

    const leadPassword = await bcrypt.hash("Lead123!", 10);
    const lead1 = await User.create({
      email: "lead1@company.com",
      password_hash: leadPassword,
      full_name: "Team Lead 1",
      role: "lead",
      hourly_rate: 40,
      is_active: true,
      is_approved_by_super_admin: true,
      manager_id: manager1._id,
    });

    const lead2 = await User.create({
      email: "lead2@company.com",
      password_hash: leadPassword,
      full_name: "Team Lead 2",
      role: "lead",
      hourly_rate: 42,
      is_active: true,
      is_approved_by_super_admin: true,
      manager_id: manager2._id,
    });
    console.log("✅ Created Team Leads:", lead1.email, lead2.email);

    const employeePassword = await bcrypt.hash("Employee123!", 10);
    const employees = [];
    for (let i = 1; i <= 6; i++) {
      const managerId = i <= 3 ? manager1._id : manager2._id;
      const employee = await User.create({
        email: `employee${i}@company.com`,
        password_hash: employeePassword,
        full_name: `Employee ${i}`,
        role: "employee",
        hourly_rate: 25 + i * 2, // Varying rates from 27 to 37
        is_active: true,
        is_approved_by_super_admin: true,
        manager_id: managerId,
      });
      employees.push(employee);
    }
    console.log(`✅ Created ${employees.length} Employees`);

    // 2. CREATE CLIENTS
    console.log("\n🏢 Creating Clients...");
    const clients = await Client.create([
      {
        name: "Acme Corporation",
        contact_person: "John Smith",
        contact_email: "john.smith@acme.com",
        is_active: true,
      },
      {
        name: "TechStart Inc.",
        contact_person: "Jane Doe",
        contact_email: "jane.doe@techstart.com",
        is_active: true,
      },
      {
        name: "Global Solutions Ltd.",
        contact_person: "Bob Johnson",
        contact_email: "bob.johnson@globalsolutions.com",
        is_active: true,
      },
    ]);
    console.log(`✅ Created ${clients.length} Clients`);

    // 3. CREATE PROJECTS
    console.log("\n📊 Creating Projects...");
    const projects = await Project.create([
      {
        name: "E-commerce Platform Development",
        client_id: clients[0]._id,
        primary_manager_id: manager1._id,
        status: "active",
        start_date: new Date("2024-01-01"),
        budget: 150000,
        description:
          "Building a modern e-commerce platform with React and Node.js",
        is_billable: true,
      },
      {
        name: "Mobile App Redesign",
        client_id: clients[1]._id,
        primary_manager_id: manager2._id,
        status: "active",
        start_date: new Date("2024-02-15"),
        budget: 85000,
        description: "Complete redesign of the mobile application interface",
        is_billable: true,
      },
      {
        name: "Data Analytics Dashboard",
        client_id: clients[2]._id,
        primary_manager_id: manager1._id,
        status: "active",
        start_date: new Date("2024-03-01"),
        budget: 120000,
        description: "Real-time analytics dashboard for business intelligence",
        is_billable: true,
      },
    ]);
    console.log(`✅ Created ${projects.length} Projects`);

    // 4. CREATE PROJECT MEMBERS
    console.log("\n👥 Creating Project Members...");
    const projectMembers = [];

    // Project 1 team (E-commerce Platform)
    const project1Members = await ProjectMember.create([
      {
        project_id: projects[0]._id,
        user_id: manager1._id,
        project_role: "manager",
        is_primary_manager: true,
      },
      {
        project_id: projects[0]._id,
        user_id: lead1._id,
        project_role: "lead",
      },
      {
        project_id: projects[0]._id,
        user_id: employees[0]._id,
        project_role: "employee",
      },
      {
        project_id: projects[0]._id,
        user_id: employees[1]._id,
        project_role: "employee",
      },
      {
        project_id: projects[0]._id,
        user_id: employees[2]._id,
        project_role: "employee",
      },
    ]);

    // Project 2 team (Mobile App)
    const project2Members = await ProjectMember.create([
      {
        project_id: projects[1]._id,
        user_id: manager2._id,
        project_role: "manager",
        is_primary_manager: true,
      },
      {
        project_id: projects[1]._id,
        user_id: lead2._id,
        project_role: "lead",
      },
      {
        project_id: projects[1]._id,
        user_id: employees[3]._id,
        project_role: "employee",
      },
      {
        project_id: projects[1]._id,
        user_id: employees[4]._id,
        project_role: "employee",
      },
    ]);

    // Project 3 team (Analytics Dashboard)
    const project3Members = await ProjectMember.create([
      {
        project_id: projects[2]._id,
        user_id: manager1._id,
        project_role: "manager",
        is_primary_manager: true,
      },
      {
        project_id: projects[2]._id,
        user_id: lead1._id,
        project_role: "lead",
      },
      {
        project_id: projects[2]._id,
        user_id: employees[2]._id, // Employee 3 on multiple projects
        project_role: "employee",
      },
      {
        project_id: projects[2]._id,
        user_id: employees[5]._id,
        project_role: "employee",
      },
    ]);

    projectMembers.push(
      ...project1Members,
      ...project2Members,
      ...project3Members
    );
    console.log(
      `✅ Created ${projectMembers.length} Project Member assignments`
    );

    // 5. CREATE TASKS
    console.log("\n📋 Creating Tasks...");
    const tasks = [];

    // Tasks for Project 1 (E-commerce)
    const project1Tasks = await Task.create([
      {
        project_id: projects[0]._id,
        name: "Frontend Development",
        description: "Develop React frontend components",
        assigned_to_user_id: employees[0]._id,
        status: "in_progress",
        estimated_hours: 80,
        is_billable: true,
        created_by_user_id: manager1._id,
      },
      {
        project_id: projects[0]._id,
        name: "Backend API Development",
        description: "Build REST API endpoints",
        assigned_to_user_id: employees[1]._id,
        status: "in_progress",
        estimated_hours: 60,
        is_billable: true,
        created_by_user_id: manager1._id,
      },
      {
        project_id: projects[0]._id,
        name: "Database Design",
        description: "Design and implement database schema",
        assigned_to_user_id: employees[2]._id,
        status: "completed",
        estimated_hours: 40,
        is_billable: true,
        created_by_user_id: lead1._id,
      },
    ]);

    // Tasks for Project 2 (Mobile App)
    const project2Tasks = await Task.create([
      {
        project_id: projects[1]._id,
        name: "UI/UX Design",
        description: "Create new mobile app designs",
        assigned_to_user_id: employees[3]._id,
        status: "completed",
        estimated_hours: 50,
        is_billable: true,
        created_by_user_id: manager2._id,
      },
      {
        project_id: projects[1]._id,
        name: "Mobile Development",
        description: "Implement new mobile interface",
        assigned_to_user_id: employees[4]._id,
        status: "in_progress",
        estimated_hours: 70,
        is_billable: true,
        created_by_user_id: lead2._id,
      },
    ]);

    tasks.push(...project1Tasks, ...project2Tasks);
    console.log(`✅ Created ${tasks.length} Tasks`);

    // 6. CREATE TIMESHEETS WITH VARIOUS STATUSES
    console.log("\n⏰ Creating Timesheets...");

    // Get current date and calculate weeks
    const currentDate = new Date();
    const currentWeekStart = getWeekStartDate(currentDate);

    // Previous weeks for testing different scenarios
    const week1Start = new Date(currentWeekStart);
    week1Start.setDate(week1Start.getDate() - 21); // 3 weeks ago

    const week2Start = new Date(currentWeekStart);
    week2Start.setDate(week2Start.getDate() - 14); // 2 weeks ago

    const week3Start = new Date(currentWeekStart);
    week3Start.setDate(week3Start.getDate() - 7); // 1 week ago

    const timesheets = [];

    // Create timesheets for different employees with various statuses
    const timesheetData = [
      // Week 1 - 3 weeks ago (some completed workflow)
      {
        user: employees[0],
        weekStart: week1Start,
        status: "frozen",
        totalHours: 40,
      },
      {
        user: employees[1],
        weekStart: week1Start,
        status: "billed",
        totalHours: 38,
      },
      {
        user: employees[2],
        weekStart: week1Start,
        status: "manager_approved",
        totalHours: 42,
      },

      // Week 2 - 2 weeks ago (mixed statuses)
      {
        user: employees[0],
        weekStart: week2Start,
        status: "submitted",
        totalHours: 35,
      },
      {
        user: employees[1],
        weekStart: week2Start,
        status: "manager_rejected",
        totalHours: 30,
      },
      {
        user: employees[2],
        weekStart: week2Start,
        status: "frozen",
        totalHours: 40,
      },
      {
        user: employees[3],
        weekStart: week2Start,
        status: "manager_approved",
        totalHours: 37,
      },

      // Week 3 - 1 week ago (recent activity)
      {
        user: employees[0],
        weekStart: week3Start,
        status: "draft",
        totalHours: 25,
      },
      {
        user: employees[1],
        weekStart: week3Start,
        status: "submitted",
        totalHours: 40,
      },
      {
        user: employees[2],
        weekStart: week3Start,
        status: "manager_approved",
        totalHours: 38,
      },
      {
        user: employees[3],
        weekStart: week3Start,
        status: "management_rejected",
        totalHours: 32,
      },
      {
        user: employees[4],
        weekStart: week3Start,
        status: "frozen",
        totalHours: 40,
      },

      // Current week (mostly drafts)
      {
        user: employees[0],
        weekStart: currentWeekStart,
        status: "draft",
        totalHours: 16,
      },
      {
        user: employees[1],
        weekStart: currentWeekStart,
        status: "draft",
        totalHours: 20,
      },
      {
        user: employees[2],
        weekStart: currentWeekStart,
        status: "draft",
        totalHours: 18,
      },
      {
        user: employees[3],
        weekStart: currentWeekStart,
        status: "submitted",
        totalHours: 40,
      },
    ];

    for (const data of timesheetData) {
      const weekEnd = getWeekEndDate(data.weekStart);
      let timesheetDoc = {
        user_id: data.user._id,
        week_start_date: data.weekStart,
        week_end_date: weekEnd,
        total_hours: data.totalHours,
        status: data.status,
      };

      // Add approval/rejection data based on status
      if (data.status === "submitted") {
        timesheetDoc.submitted_at = new Date(
          data.weekStart.getTime() + 5 * 24 * 60 * 60 * 1000
        ); // 5 days after week start
      } else if (data.status === "manager_approved") {
        timesheetDoc.submitted_at = new Date(
          data.weekStart.getTime() + 5 * 24 * 60 * 60 * 1000
        );
        timesheetDoc.approved_by_manager_id = manager1._id;
        timesheetDoc.approved_by_manager_at = new Date(
          data.weekStart.getTime() + 6 * 24 * 60 * 60 * 1000
        );
      } else if (data.status === "manager_rejected") {
        timesheetDoc.submitted_at = new Date(
          data.weekStart.getTime() + 5 * 24 * 60 * 60 * 1000
        );
        timesheetDoc.manager_rejection_reason =
          "Insufficient detail in time entries";
        timesheetDoc.manager_rejected_at = new Date(
          data.weekStart.getTime() + 6 * 24 * 60 * 60 * 1000
        );
      } else if (data.status === "frozen") {
        timesheetDoc.submitted_at = new Date(
          data.weekStart.getTime() + 5 * 24 * 60 * 60 * 1000
        );
        timesheetDoc.approved_by_manager_id = manager1._id;
        timesheetDoc.approved_by_manager_at = new Date(
          data.weekStart.getTime() + 6 * 24 * 60 * 60 * 1000
        );
        timesheetDoc.approved_by_management_id = managementUser._id;
        timesheetDoc.approved_by_management_at = new Date(
          data.weekStart.getTime() + 7 * 24 * 60 * 60 * 1000
        );
        timesheetDoc.verified_by_id = managementUser._id;
        timesheetDoc.verified_at = new Date(
          data.weekStart.getTime() + 7 * 24 * 60 * 60 * 1000
        );
        timesheetDoc.is_verified = true;
        timesheetDoc.is_frozen = true;
      } else if (data.status === "billed") {
        // Complete workflow
        timesheetDoc.submitted_at = new Date(
          data.weekStart.getTime() + 5 * 24 * 60 * 60 * 1000
        );
        timesheetDoc.approved_by_manager_id = manager1._id;
        timesheetDoc.approved_by_manager_at = new Date(
          data.weekStart.getTime() + 6 * 24 * 60 * 60 * 1000
        );
        timesheetDoc.approved_by_management_id = managementUser._id;
        timesheetDoc.approved_by_management_at = new Date(
          data.weekStart.getTime() + 7 * 24 * 60 * 60 * 1000
        );
        timesheetDoc.verified_by_id = managementUser._id;
        timesheetDoc.verified_at = new Date(
          data.weekStart.getTime() + 7 * 24 * 60 * 60 * 1000
        );
        timesheetDoc.is_verified = true;
        timesheetDoc.is_frozen = true;
      } else if (data.status === "management_rejected") {
        timesheetDoc.submitted_at = new Date(
          data.weekStart.getTime() + 5 * 24 * 60 * 60 * 1000
        );
        timesheetDoc.approved_by_manager_id = manager1._id;
        timesheetDoc.approved_by_manager_at = new Date(
          data.weekStart.getTime() + 6 * 24 * 60 * 60 * 1000
        );
        timesheetDoc.management_rejection_reason =
          "Hours exceed project budget allocation";
        timesheetDoc.management_rejected_at = new Date(
          data.weekStart.getTime() + 7 * 24 * 60 * 60 * 1000
        );
      }

      const timesheet = await Timesheet.create(timesheetDoc);
      timesheets.push(timesheet);
    }

    console.log(`✅ Created ${timesheets.length} Timesheets`);

    // 7. CREATE TIME ENTRIES
    console.log("\n⏱️ Creating Time Entries...");

    const timeEntries = [];

    for (const timesheet of timesheets) {
      const weekStart = timesheet.week_start_date;
      const user = employees.find(
        (emp) => emp._id.toString() === timesheet.user_id.toString()
      );

      if (!user) continue;

      // Generate entries for the work week (Monday to Friday)
      const dailyHours = timesheet.total_hours / 5; // Distribute hours across 5 days

      for (let dayOffset = 1; dayOffset <= 5; dayOffset++) {
        // Monday to Friday
        if (timesheet.total_hours <= 0) break; // Skip if no hours

        const entryDate = new Date(weekStart);
        entryDate.setDate(entryDate.getDate() + dayOffset);

        // Create both project and custom entries
        const hoursForDay = Math.min(dailyHours, timesheet.total_hours);

        if (hoursForDay > 0) {
          // Project task entry (70% of time)
          const projectHours = Math.round(hoursForDay * 0.7 * 100) / 100;
          if (projectHours > 0) {
            const projectEntry = await TimeEntry.create({
              timesheet_id: timesheet._id,
              project_id: projects[0]._id, // Default to first project
              task_id: tasks[0]._id, // Default to first task
              date: entryDate,
              hours: projectHours,
              description: `Working on ${
                tasks[0].name
              } - ${entryDate.toDateString()}`,
              is_billable: true,
              entry_type: "project_task",
              hourly_rate: user.hourly_rate,
            });
            timeEntries.push(projectEntry);
          }

          // Custom task entry (30% of time)
          const customHours =
            Math.round((hoursForDay - projectHours) * 100) / 100;
          if (customHours > 0) {
            const customEntry = await TimeEntry.create({
              timesheet_id: timesheet._id,
              date: entryDate,
              hours: customHours,
              description: "Administrative tasks and meetings",
              is_billable: false,
              custom_task_description:
                "Daily standup meetings and administrative work",
              entry_type: "custom_task",
              hourly_rate: user.hourly_rate,
            });
            timeEntries.push(customEntry);
          }
        }
      }
    }

    console.log(`✅ Created ${timeEntries.length} Time Entries`);

    // 8. SUMMARY
    console.log("\n🎉 Sample Data Setup Complete!");
    console.log("\n📊 Summary:");
    console.log(
      `👥 Users: ${
        1 + 1 + 2 + 2 + 6
      } (1 Super Admin, 1 Management, 2 Managers, 2 Leads, 6 Employees)`
    );
    console.log(`🏢 Clients: ${clients.length}`);
    console.log(`📊 Projects: ${projects.length}`);
    console.log(`👥 Project Members: ${projectMembers.length}`);
    console.log(`📋 Tasks: ${tasks.length}`);
    console.log(`⏰ Timesheets: ${timesheets.length}`);
    console.log(`⏱️ Time Entries: ${timeEntries.length}`);

    console.log("\n🔑 Login Credentials:");
    console.log("📧 Super Admin: admin@company.com / Admin123!");
    console.log("📧 Management: management@company.com / Management123!");
    console.log("📧 Manager 1: manager1@company.com / Manager123!");
    console.log("📧 Manager 2: manager2@company.com / Manager123!");
    console.log("📧 Lead 1: lead1@company.com / Lead123!");
    console.log("📧 Lead 2: lead2@company.com / Lead123!");
    console.log("📧 Employee 1-6: employee[1-6]@company.com / Employee123!");

    console.log("\n📈 Test Scenarios Created:");
    console.log(
      "- Various timesheet statuses (draft, submitted, approved, rejected, frozen, billed)"
    );
    console.log("- Role-based project assignments");
    console.log("- Manager-employee relationships");
    console.log("- Different approval workflows");
    console.log("- Mixed billable/non-billable time entries");
    console.log("- Multi-project employee assignments");
  } catch (error) {
    console.error("❌ Error setting up sample data:", error);
    if (error.code === 11000) {
      console.error("💡 Duplicate key error - data may already exist");
    }
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
}

setupSampleData();
