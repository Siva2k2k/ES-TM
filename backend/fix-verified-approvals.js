/**
 * Fix the 4 specific TimesheetProjectApproval records from the verified project-week
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

async function fixVerifiedApprovals() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected successfully!\n");

    // The 4 specific TimesheetProjectApproval IDs from your JSON
    const approvalIds = [
      "68f86d71ce18eafdc37a512b", // Manager
      "68f83611594a0f37b4ca3604", // Employee 1
      "68f83638594a0f37b4ca36d0", // Employee 3
      "68f8441c6e9fc323255ba463", // Lead
    ];

    console.log("Checking the 4 approval records...\n");

    for (const id of approvalIds) {
      const approval = await TimesheetProjectApproval.findById(id);

      if (!approval) {
        console.log(`❌ Record ${id} not found!`);
        continue;
      }

      console.log(`📝 Found: ${id}`);
      console.log(`   Timesheet: ${approval.timesheet_id}`);
      console.log(`   management_status BEFORE: ${approval.management_status}`);
    }

    console.log(
      '\n🔧 Updating all 4 records to management_status = "approved"...\n'
    );

    // Update all 4 records
    const result = await TimesheetProjectApproval.updateMany(
      {
        _id: {
          $in: approvalIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
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

    console.log(`✅ Successfully updated ${result.modifiedCount} record(s)`);
    console.log(`   Matched: ${result.matchedCount}`);
    console.log(`   Modified: ${result.modifiedCount}`);

    // Verify the updates
    console.log("\n📊 Verifying updates...\n");

    for (const id of approvalIds) {
      const approval = await TimesheetProjectApproval.findById(id);

      if (approval) {
        console.log(`✅ ${id}`);
        console.log(
          `   management_status AFTER: ${approval.management_status}`
        );
      }
    }

    await mongoose.connection.close();
    console.log("\n🎉 Done! All approval records updated.");
    console.log("\nNow refresh your API call:");
    console.log(
      "GET http://localhost:3001/api/v1/timesheets/project-weeks?status=pending"
    );
    console.log("The TimesheetChecker project-week should NO LONGER appear!\n");
  } catch (error) {
    console.error("Error:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

fixVerifiedApprovals();
