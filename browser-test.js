// BROWSER REPORT TEST - Copy/paste this into browser console (F12)

console.log("🔧 FIXED REPORT TEST");

async function testReportDownload() {
  console.log("🧪 Testing Report Download...");

  // Step 1: Check authentication
  const token = localStorage.getItem("accessToken");
  if (!token) {
    console.log("❌ Please login first: manager@company.com / admin123");
    return;
  }
  console.log("✅ Authentication token found");

  try {
    // Step 2: Get templates
    console.log("📋 Fetching templates...");
    const templatesResponse = await fetch(
      "http://localhost:3001/api/v1/reports/templates",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!templatesResponse.ok) {
      console.log("❌ Templates request failed:", templatesResponse.status);
      return;
    }

    const templates = await templatesResponse.json();
    console.log("✅ Templates loaded:", templates.count, "available");

    if (templates.templates.length === 0) {
      console.log("❌ No templates found");
      return;
    }

    // Step 3: Test CSV download (simplest format)
    const template = templates.templates[0];
    console.log("📊 Using template:", template.name);

    const reportRequest = {
      template_id: template.template_id,
      date_range: {
        start: "2025-09-01T00:00:00.000Z",
        end: "2025-09-30T23:59:59.999Z",
      },
      format: "csv",
      filters: {},
    };

    console.log("🚀 Generating CSV report...");
    const reportResponse = await fetch(
      "http://localhost:3001/api/v1/reports/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reportRequest),
      }
    );

    console.log(
      "📡 Report response:",
      reportResponse.status,
      reportResponse.statusText
    );

    if (reportResponse.ok) {
      const blob = await reportResponse.blob();
      console.log("📄 File info:", {
        size: blob.size + " bytes",
        type: blob.type,
        isEmpty: blob.size === 0,
      });

      if (blob.size === 0) {
        console.log("❌ PROBLEM: Empty file received");
        return;
      }

      // Preview content
      const preview = await blob.slice(0, 100).text();
      console.log("📝 Content preview:", preview);

      // Download the file
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `test-report-${Date.now()}.csv`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log("✅ DOWNLOAD COMPLETED!");
      console.log("📁 Check your Downloads folder for: test-report-*.csv");
      console.log(
        "💡 To open: Right-click file → Open With → Excel or Notepad"
      );
    } else {
      const errorText = await reportResponse.text();
      console.log("❌ Report generation failed:", errorText);
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}

// Run the test automatically
testReportDownload();

// Also provide manual testing function
window.testReportDownload = testReportDownload;

console.log(`
🎯 WHAT TO DO NOW:

1. 🔄 REFRESH your browser page (Ctrl+F5)
2. 🔐 LOGIN if needed (manager@company.com / admin123)  
3. 📊 Try the REPORT FORM with these settings:
   
   📅 Date Range:
   Start Date: 01-09-2025
   End Date: 30-09-2025
   
   🔍 Filters:
   Month: Leave as "Select month"
   Year: Leave as "Select year"
   
4. 🖱️ Click GENERATE REPORT
5. 📁 Check Downloads folder for the file
6. 📝 Try opening with Excel, Notepad, or text editor

💬 REPORT BACK:
- Did file download? (Yes/No)
- File size? (0 KB means problem)  
- Can you open it? (What happens?)
- Any error messages?
`);
