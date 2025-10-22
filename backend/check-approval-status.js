/**
 * Debug script to check the actual approval status for the TimesheetChecker project
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from backend directory
dotenv.config({ path: path.join(__dirname, ".env") });

const TimesheetSchema = new mongoose.Schema(
  {},
  { strict: false, strictPopulate: false, collection: "timesheets" }
);
const Timesheet = mongoose.model("Timesheet", TimesheetSchema);

const ApprovalSchema = new mongoose.Schema(
  {},
  {
    strict: false,
    strictPopulate: false,
    collection: "timesheet_project_approvals",
  }
);
const TimesheetProjectApproval = mongoose.model(
  "TimesheetProjectApproval",
  ApprovalSchema
);

const ProjectSchema = new mongoose.Schema(
  {},
  { strict: false, strictPopulate: false, collection: "projects" }
);
const Project = mongoose.model("Project", ProjectSchema);

async function checkApprovalStatus() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected successfully!\n");

    // Find TimesheetChecker project
    const project = await Project.findOne({ name: "TimesheetChecker" });

    if (!project) {
      console.log("TimesheetChecker project not found!");
      await mongoose.connection.close();
      return;
    }

    console.log(`Found project: ${project.name} (ID: ${project._id})\n`);

    // Find timesheets for week Oct 6-12, 2025
    const weekStart = new Date("2025-10-06T00:00:00.000Z");
    const weekEnd = new Date("2025-10-11T18:30:00.000Z");

    const timesheets = await Timesheet.find({
      week_start_date: { $gte: weekStart, $lte: weekEnd },
      deleted_at: null,
    }).populate("user_id", "full_name email role");

    console.log(`Found ${timesheets.length} timesheets for this week:\n`);

    for (const ts of timesheets) {
      console.log(`📋 Timesheet ID: ${ts._id}`);
      console.log(`   User: ${ts.user_id?.full_name} (${ts.user_id?.email})`);
      console.log(`   Role: ${ts.user_id?.role}`);
      console.log(`   Status: ${ts.status}`);
      console.log(`   Frozen: ${ts.is_frozen}`);

      // Get project approvals for this timesheet
      const approvalsForTimesheet = await TimesheetProjectApproval.find({
        timesheet_id: ts._id,
      });

      console.log(
        `   Found ${approvalsForTimesheet.length} total approval records for this timesheet`
      );

      if (approvalsForTimesheet.length > 0) {
        for (const approval of approvalsForTimesheet) {
          console.log(
            `   📊 Project Approval (Project: ${approval.project_id}):`
          );
          console.log(`      - lead_status: ${approval.lead_status}`);
          console.log(`      - manager_status: ${approval.manager_status}`);
          console.log(
            `      - management_status: ${approval.management_status}`
          );
          console.log(`      - worked_hours: ${approval.worked_hours}`);
          console.log(`      - billable_hours: ${approval.billable_hours}`);
          console.log(
            `      - billable_adjustment: ${approval.billable_adjustment}`
          );
        }
      } else {
        console.log(`   ⚠️  NO PROJECT APPROVAL RECORDS FOUND AT ALL!`);
      }
      console.log("");
    }

    await mongoose.connection.close();
    console.log("Done!");
  } catch (error) {
    console.error("Error:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

checkApprovalStatus();
