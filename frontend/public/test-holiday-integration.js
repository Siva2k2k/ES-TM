// Test script to verify holiday API and timesheet integration
// Run this in browser console on the timesheet page

async function testHolidayIntegration() {
  console.log("🧪 Testing Holiday Integration...");

  try {
    // Test 1: Check if admin user can access admin settings
    console.log("📋 Test 1: Checking admin permissions...");
    const authContext = window.localStorage.getItem("auth_context");
    const user = authContext ? JSON.parse(authContext) : null;
    console.log("Current user:", user);

    // Test 2: Test holiday API directly
    console.log("📋 Test 2: Testing holiday API...");
    const holidayResponse = await fetch(
      "/api/v1/holidays?startDate=2025-12-22&endDate=2025-12-28",
      {
        headers: {
          Authorization: `Bearer ${user?.tokens?.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const holidayData = await holidayResponse.json();
    console.log("Holiday API Response:", holidayData);

    // Test 3: Test CompanyHolidayService
    if (window.CompanyHolidayService) {
      console.log("📋 Test 3: Testing CompanyHolidayService...");
      const serviceResult =
        await window.CompanyHolidayService.getHolidaysInRange(
          "2025-12-22",
          "2025-12-28"
        );
      console.log("Service Result:", serviceResult);
    } else {
      console.log("⚠️ CompanyHolidayService not available in window");
    }

    // Test 4: Check if holiday appears in timesheet form
    console.log("📋 Test 4: Checking timesheet form...");
    const holidayEntries = document.querySelectorAll(
      '[data-entry-type="holiday"]'
    );
    console.log("Holiday entries found:", holidayEntries.length);

    // Summary
    console.log("✅ Holiday integration test completed!");
    console.log("Results:");
    console.log("- User logged in:", !!user);
    console.log("- Holiday API working:", holidayData.success);
    console.log("- Holidays found:", holidayData.holidays?.length || 0);
    console.log("- Holiday entries in form:", holidayEntries.length);
  } catch (error) {
    console.error("❌ Error during holiday integration test:", error);
  }
}

// Auto-run the test
testHolidayIntegration();
