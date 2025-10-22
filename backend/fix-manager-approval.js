/**
 * Fix script to update management_status for already-frozen timesheets
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from backend directory
dotenv.config({ path: path.join(__dirname, ".env") });

const ApprovalSchema = new mongoose.Schema(
  {},
  { strict: false, collection: "timesheet_project_approvals" }
);
const TimesheetProjectApproval = mongoose.model(
  "TimesheetProjectApproval",
  ApprovalSchema
);

const TimesheetSchema = new mongoose.Schema(
  {},
  { strict: false, collection: "timesheets" }
);
const Timesheet = mongoose.model("Timesheet", TimesheetSchema);

async function fixManagerApproval() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected successfully!\n");

    // Find all frozen timesheets
    const frozenTimesheets = await Timesheet.find({
      status: "frozen",
      deleted_at: null,
    }).select("_id status");

    console.log(`Found ${frozenTimesheets.length} frozen timesheets\n`);

    if (frozenTimesheets.length === 0) {
      console.log("No frozen timesheets found");
      await mongoose.connection.close();
      return;
    }

    const timesheetIds = frozenTimesheets.map((t) => t._id);

    // Find approval records where management_status is not 'approved'
    const approvalsToFix = await TimesheetProjectApproval.find({
      timesheet_id: { $in: timesheetIds },
      management_status: { $ne: "approved" },
    });

    console.log(`Found ${approvalsToFix.length} approval records to fix:\n`);

    if (approvalsToFix.length === 0) {
      console.log("All approval records are already correct!");
      await mongoose.connection.close();
      return;
    }

    for (const approval of approvalsToFix) {
      console.log(`📝 Approval ID: ${approval._id}`);
      console.log(`   Timesheet: ${approval.timesheet_id}`);
      console.log(`   Project: ${approval.project_id}`);
      console.log(`   management_status BEFORE: ${approval.management_status}`);
    }

    // Update them
    const result = await TimesheetProjectApproval.updateMany(
      {
        timesheet_id: { $in: timesheetIds },
        management_status: { $ne: "approved" },
      },
      {
        $set: {
          management_status: "approved",
          management_approved_at: new Date(),
        },
        $unset: {
          management_rejection_reason: "",
        },
      }
    );

    console.log(`\n✅ Updated ${result.modifiedCount} approval record(s)`);
    console.log("   All management_status fields set to: approved");

    await mongoose.connection.close();
    console.log("\nDone!");
  } catch (error) {
    console.error("Error:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

fixManagerApproval();
