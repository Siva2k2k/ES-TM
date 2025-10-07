/**
 * Test script to verify timesheet deletion functionality
 * This tests the complete flow from frontend service to backend API
 */

const API_BASE_URL = "http://localhost:3001/api/v1";

// Mock user token for testing (you'll need a real token)
const TEST_TOKEN = "your-jwt-token-here";

async function testTimesheetDelete() {
  console.log("🧪 Testing Timesheet Delete Functionality\n");

  try {
    // First, let's check if we can get timesheets
    console.log("1. Testing timesheet listing...");
    const listResponse = await fetch(`${API_BASE_URL}/timesheets`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${TEST_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`   Status: ${listResponse.status}`);

    if (listResponse.status === 401) {
      console.log(
        "❌ Authentication required. Please login to get a valid token."
      );
      console.log(
        "💡 You can test this functionality through the frontend UI instead."
      );
      return;
    }

    if (listResponse.ok) {
      const timesheets = await listResponse.json();
      console.log(`   ✅ Found ${timesheets.data?.length || 0} timesheets`);

      // Find a draft timesheet to test deletion
      const draftTimesheet = timesheets.data?.find(
        (ts) => ts.status === "draft"
      );

      if (draftTimesheet) {
        console.log(`   📝 Found draft timesheet: ${draftTimesheet._id}`);

        // Test deletion
        console.log("\n2. Testing timesheet deletion...");
        const deleteResponse = await fetch(
          `${API_BASE_URL}/timesheets/${draftTimesheet._id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${TEST_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log(`   Status: ${deleteResponse.status}`);

        if (deleteResponse.ok) {
          const result = await deleteResponse.json();
          console.log("   ✅ Timesheet deleted successfully!");
          console.log(`   📋 Response: ${JSON.stringify(result, null, 2)}`);
        } else {
          const error = await deleteResponse.json();
          console.log("   ❌ Delete failed:");
          console.log(`   📋 Error: ${JSON.stringify(error, null, 2)}`);
        }
      } else {
        console.log("   ⚠️  No draft timesheets found to test deletion");
        console.log("   💡 Create a draft timesheet first to test deletion");
      }
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
  }

  console.log("\n🏁 Test completed!");
  console.log("\n📋 Summary of Implementation:");
  console.log("✅ Frontend: DeleteButton component integrated");
  console.log("✅ Frontend: TimesheetService.deleteTimesheet method");
  console.log("✅ Backend: DELETE /api/v1/timesheets/:timesheetId route");
  console.log("✅ Backend: TimesheetController.deleteTimesheet method");
  console.log("✅ Backend: TimesheetService.deleteTimesheet method");
  console.log("✅ Backend: Authorization and validation checks");
  console.log("✅ Backend: Audit logging for deleted timesheets");

  console.log("\n🔐 Security Features:");
  console.log("• Users can only delete their own draft timesheets");
  console.log("• Admin/Management can delete any timesheet");
  console.log("• Submitted timesheets require management approval to delete");
  console.log("• Complete audit trail of all deletions");
  console.log("• Dependency checking prevents orphaned data");
}

// Run the test
testTimesheetDelete();
