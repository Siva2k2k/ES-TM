/**
 * Direct check of the specific manager approval record
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

async function checkSpecificApproval() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected successfully!\n");

    // The TimesheetProjectApproval ID from your JSON
    const approvalId = "68f86d71ce18eafdc37a512b";
    const timesheetId = "68f86d6bce18eafdc37a50fc";

    console.log(`Looking for approval record ID: ${approvalId}`);
    console.log(`Timesheet ID: ${timesheetId}\n`);

    // Try by ID first
    let approval = await TimesheetProjectApproval.findById(approvalId);

    if (!approval) {
      console.log("Not found by approval ID, searching by timesheet ID...\n");
      // Search by timesheet ID
      const approvals = await TimesheetProjectApproval.find({
        timesheet_id: new mongoose.Types.ObjectId(timesheetId),
      });

      console.log(
        `Found ${approvals.length} approval record(s) for timesheet ${timesheetId}:\n`
      );

      if (approvals.length === 0) {
        console.log("❌ No approval records found!");
        await mongoose.connection.close();
        return;
      }

      // Show all found records
      for (const appr of approvals) {
        console.log("📝 Approval Record:");
        console.log(
          JSON.stringify(
            {
              _id: appr._id,
              timesheet_id: appr.timesheet_id,
              project_id: appr.project_id,
              lead_status: appr.lead_status,
              manager_status: appr.manager_status,
              management_status: appr.management_status,
              billable_hours: appr.billable_hours,
              billable_adjustment: appr.billable_adjustment,
            },
            null,
            2
          )
        );
        console.log("");
      }

      await mongoose.connection.close();
      console.log("Done!");
      return;
    }

    if (!approval) {
      console.log("❌ Approval record not found!");
      await mongoose.connection.close();
      return;
    }

    console.log("✅ Found approval record:\n");
    console.log(
      JSON.stringify(
        {
          _id: approval._id,
          timesheet_id: approval.timesheet_id,
          project_id: approval.project_id,
          lead_status: approval.lead_status,
          manager_status: approval.manager_status,
          management_status: approval.management_status,
          billable_hours: approval.billable_hours,
          billable_adjustment: approval.billable_adjustment,
        },
        null,
        2
      )
    );

    await mongoose.connection.close();
    console.log("\nDone!");
  } catch (error) {
    console.error("Error:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

checkSpecificApproval();
