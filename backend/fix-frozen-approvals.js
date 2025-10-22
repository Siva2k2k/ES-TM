/**
 * One-time fix script to update TimesheetProjectApproval records
 * for frozen timesheets that are missing management_status = 'approved'
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from backend directory
dotenv.config({ path: path.join(__dirname, ".env") });

const TimesheetSchema = new mongoose.Schema(
  {},
  { strict: false, collection: "timesheets" }
);
const Timesheet = mongoose.model("Timesheet", TimesheetSchema);

const ApprovalSchema = new mongoose.Schema(
  {},
  { strict: false, collection: "timesheet_project_approvals" }
);
const TimesheetProjectApproval = mongoose.model(
  "TimesheetProjectApproval",
  ApprovalSchema
);

async function fixFrozenApprovals() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected successfully!");

    // Find all frozen timesheets
    const frozenTimesheets = await Timesheet.find({
      status: "frozen",
      deleted_at: null,
    }).select("_id status");

    console.log(`Found ${frozenTimesheets.length} frozen timesheets`);

    if (frozenTimesheets.length === 0) {
      console.log("No frozen timesheets to fix");
      await mongoose.connection.close();
      return;
    }

    const timesheetIds = frozenTimesheets.map((t) => t._id);

    // Find project approvals for these timesheets where management_status is not 'approved'
    const approvalsToFix = await TimesheetProjectApproval.find({
      timesheet_id: { $in: timesheetIds },
      management_status: { $ne: "approved" },
    });

    console.log(
      `Found ${approvalsToFix.length} project approval records to fix`
    );

    if (approvalsToFix.length === 0) {
      console.log("All approvals are already correct!");
      await mongoose.connection.close();
      return;
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

    console.log(`✅ Fixed ${result.modifiedCount} project approval records`);
    console.log("Details:", result);

    await mongoose.connection.close();
    console.log("Done!");
  } catch (error) {
    console.error("Error:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

fixFrozenApprovals();
