// Debug script - paste this in browser console on timesheet page
console.log("🔍 Debugging Holiday Issue...");

// 1. Check authentication
const authToken = localStorage.getItem("auth_context");
console.log("Auth token exists:", !!authToken);

// 2. Test holiday API call manually
async function debugHolidayAPI() {
  try {
    const response = await fetch(
      "/api/v1/holidays?startDate=2025-12-22&endDate=2025-12-28"
    );
    const data = await response.json();
    console.log("🎄 Holiday API Response:", data);

    if (data.success && data.holidays?.length > 0) {
      console.log(
        "✅ Holidays found:",
        data.holidays.map((h) => ({ name: h.name, date: h.date }))
      );
    } else {
      console.log("❌ No holidays found or API error");
    }
  } catch (err) {
    console.error("❌ API Error:", err);
  }
}

debugHolidayAPI();
