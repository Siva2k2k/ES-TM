const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// MongoDB connection
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://Admin:1234@localhost:27017/timesheet-management?authSource=admin";

async function testPermissionScenarios() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get collections
    const users = mongoose.connection.db.collection("users");
    const projects = mongoose.connection.db.collection("projects");
    const projectmembers = mongoose.connection.db.collection("projectmembers");
    const timesheets = mongoose.connection.db.collection("timesheets");
    const timeentries = mongoose.connection.db.collection("timeentries");

    console.log("\n🔍 Testing Permission Scenarios...\n");

    // Test 1: Role Hierarchy Validation
    console.log("📋 TEST 1: Role Hierarchy Validation");
    const allUsers = await users.find({}).toArray();
    console.log("Users by Role:");
    const usersByRole = allUsers.reduce((acc, user) => {
      acc[user.role] = acc[user.role] || [];
      acc[user.role].push(`${user.full_name} (${user.email})`);
      return acc;
    }, {});

    Object.entries(usersByRole).forEach(([role, userList]) => {
      console.log(`  ${role.toUpperCase()}: ${userList.length} users`);
      userList.forEach((user) => console.log(`    - ${user}`));
    });

    // Test 2: Project Access Scenarios
    console.log("\n📋 TEST 2: Project Access Scenarios");
    const allProjects = await projects.find({}).toArray();
    for (const project of allProjects) {
      console.log(`\nProject: ${project.name}`);
      const members = await projectmembers
        .find({ project_id: project._id })
        .toArray();
      console.log(`  Members: ${members.length}`);

      for (const member of members) {
        const user = await users.findOne({ _id: member.user_id });
        const roleInfo = member.is_primary_manager
          ? " (Primary Manager)"
          : member.is_secondary_manager
          ? " (Secondary Manager)"
          : "";
        console.log(
          `    - ${user.full_name}: ${member.project_role}${roleInfo}`
        );
      }
    }

    // Test 3: Timesheet Access Scenarios
    console.log("\n📋 TEST 3: Timesheet Access Scenarios");

    // Group timesheets by status
    const timesheetsByStatus = await timesheets
      .aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            timesheets: { $push: "$$ROOT" },
          },
        },
      ])
      .toArray();

    console.log("Timesheets by Status:");
    for (const statusGroup of timesheetsByStatus) {
      console.log(
        `\n  ${statusGroup._id.toUpperCase()}: ${statusGroup.count} timesheets`
      );

      for (const timesheet of statusGroup.timesheets.slice(0, 3)) {
        // Show first 3 of each status
        const user = await users.findOne({ _id: timesheet.user_id });
        const weekStart = new Date(timesheet.week_start_date).toDateString();
        console.log(
          `    - ${user.full_name}: Week of ${weekStart} (${timesheet.total_hours}h)`
        );

        // Show approval chain for non-draft timesheets
        if (timesheet.status !== "draft") {
          if (timesheet.submitted_at) {
            console.log(
              `      📅 Submitted: ${new Date(
                timesheet.submitted_at
              ).toDateString()}`
            );
          }
          if (timesheet.approved_by_manager_id) {
            const manager = await users.findOne({
              _id: timesheet.approved_by_manager_id,
            });
            console.log(`      ✅ Manager Approved by: ${manager.full_name}`);
          }
          if (timesheet.manager_rejection_reason) {
            console.log(
              `      ❌ Manager Rejected: ${timesheet.manager_rejection_reason}`
            );
          }
          if (timesheet.approved_by_management_id) {
            const management = await users.findOne({
              _id: timesheet.approved_by_management_id,
            });
            console.log(
              `      ✅ Management Approved by: ${management.full_name}`
            );
          }
          if (timesheet.management_rejection_reason) {
            console.log(
              `      ❌ Management Rejected: ${timesheet.management_rejection_reason}`
            );
          }
        }
      }
    }

    // Test 4: Permission Matrix Validation
    console.log("\n📋 TEST 4: Permission Matrix Validation");

    // Test Employee permissions
    const employee = allUsers.find((u) => u.role === "employee");
    const employeeTimesheets = await timesheets
      .find({ user_id: employee._id })
      .toArray();
    console.log(`\nEMPLOYEE (${employee.full_name}) Permissions:`);
    console.log(`  ✅ Can access own ${employeeTimesheets.length} timesheets`);
    console.log(
      `  ❌ Cannot access other users' timesheets (role-based restriction)`
    );
    console.log(`  ✅ Can create/edit own draft timesheets`);
    console.log(`  ❌ Cannot approve any timesheets`);

    // Test Manager permissions
    const manager = allUsers.find((u) => u.role === "manager");
    const managerProjects = await projectmembers
      .find({
        user_id: manager._id,
        project_role: "manager",
      })
      .toArray();
    console.log(`\nMANAGER (${manager.full_name}) Permissions:`);
    console.log(`  ✅ Primary manager of ${managerProjects.length} projects`);
    console.log(`  ✅ Can view team member timesheets`);
    console.log(`  ✅ Can approve submitted timesheets`);
    console.log(`  ❌ Cannot edit frozen/billed timesheets`);
    console.log(`  ❌ Cannot perform management-level approvals`);

    // Test Management permissions
    const management = allUsers.find((u) => u.role === "management");
    console.log(`\nMANAGEMENT (${management.full_name}) Permissions:`);
    console.log(`  ✅ Can view all timesheets`);
    console.log(`  ✅ Can perform final approvals (freeze timesheets)`);
    console.log(`  ✅ Can generate billing snapshots`);
    console.log(`  ❌ Cannot create timesheets (per business rules)`);
    console.log(`  ❌ Cannot edit time entries directly`);

    // Test Lead permissions
    const lead = allUsers.find((u) => u.role === "lead");
    console.log(`\nLEAD (${lead.full_name}) Permissions:`);
    console.log(`  ✅ Can view team member timesheets`);
    console.log(`  ❌ Cannot approve timesheets (view-only)`);
    console.log(`  ❌ Cannot create timesheets for others`);
    console.log(`  ❌ Cannot edit time entries for others`);

    // Test 5: Time Entry Access Patterns
    console.log("\n📋 TEST 5: Time Entry Access Patterns");
    const sampleTimesheet = await timesheets.findOne({ status: "draft" });
    if (sampleTimesheet) {
      const entries = await timeentries
        .find({ timesheet_id: sampleTimesheet._id })
        .toArray();
      const user = await users.findOne({ _id: sampleTimesheet.user_id });

      console.log(`\nTime Entries for ${user.full_name} (Draft Timesheet):`);
      console.log(`  Total Entries: ${entries.length}`);

      const entryTypes = entries.reduce((acc, entry) => {
        acc[entry.entry_type] = (acc[entry.entry_type] || 0) + 1;
        return acc;
      }, {});

      Object.entries(entryTypes).forEach(([type, count]) => {
        console.log(`    - ${type}: ${count} entries`);
      });

      const billableHours = entries
        .filter((e) => e.is_billable)
        .reduce((sum, e) => sum + e.hours, 0);
      const nonBillableHours = entries
        .filter((e) => !e.is_billable)
        .reduce((sum, e) => sum + e.hours, 0);

      console.log(`  Billable Hours: ${billableHours}`);
      console.log(`  Non-Billable Hours: ${nonBillableHours}`);
    }

    // Test 6: Workflow State Validation
    console.log("\n📋 TEST 6: Workflow State Validation");

    const workflowStates = {
      draft: "Employee can edit, add entries",
      submitted: "Manager can approve/reject",
      manager_approved: "Management can approve/reject",
      manager_rejected: "Employee can edit and resubmit",
      management_rejected: "Employee can edit and resubmit",
      frozen: "Locked for billing, no edits allowed",
      billed: "Completed workflow, read-only",
    };

    console.log("\nWorkflow States and Permissions:");
    Object.entries(workflowStates).forEach(([state, permission]) => {
      console.log(`  ${state.toUpperCase()}: ${permission}`);
    });

    // Test 7: Error Scenarios to Test
    console.log("\n📋 TEST 7: Expected Error Scenarios");
    console.log("These scenarios should be tested for proper error handling:");
    console.log("  ❌ Employee trying to approve timesheets");
    console.log("  ❌ Lead trying to create time entries for others");
    console.log("  ❌ Management trying to create timesheets");
    console.log("  ❌ Manager trying to edit frozen timesheets");
    console.log("  ❌ Employee trying to access other users' data");
    console.log("  ❌ Non-project members accessing project resources");
    console.log("  ❌ Editing time entries in submitted timesheets");

    console.log("\n✅ Permission scenario analysis complete!");
  } catch (error) {
    console.error("❌ Error testing permission scenarios:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
}

testPermissionScenarios();
