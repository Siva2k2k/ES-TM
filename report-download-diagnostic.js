// Report Download Diagnostic Tool
// Run this in browser console to diagnose file download issues

console.log("🔍 Report Download Diagnostic Tool");

const testReportDownload = async () => {
  console.log("🚀 Starting comprehensive report download test...");

  // Check authentication
  const token = localStorage.getItem("accessToken");
  if (!token) {
    console.log("❌ No access token found. Please login first.");
    return;
  }

  console.log("✅ Authentication token found");

  try {
    // Get templates first
    console.log("📋 Fetching report templates...");
    const templatesResponse = await fetch(
      "http://localhost:3001/api/v1/reports/templates",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!templatesResponse.ok) {
      console.log("❌ Failed to fetch templates:", templatesResponse.status);
      return;
    }

    const templatesData = await templatesResponse.json();
    console.log("✅ Templates loaded:", templatesData.count);

    if (templatesData.templates.length === 0) {
      console.log("❌ No templates available");
      return;
    }

    // Test each format
    const template = templatesData.templates[0];
    const formats = ["csv", "excel", "pdf"];

    for (const format of formats) {
      console.log(`\n📊 Testing ${format.toUpperCase()} format...`);

      const reportRequest = {
        template_id: template.template_id,
        date_range: {
          start: "2025-09-01",
          end: "2025-10-31",
        },
        format: format,
        filters: {},
      };

      try {
        const response = await fetch(
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
          `📡 ${format} Response:`,
          response.status,
          response.statusText
        );
        console.log(
          `📋 ${format} Headers:`,
          Object.fromEntries(response.headers.entries())
        );

        if (response.ok) {
          const blob = await response.blob();
          console.log(`✅ ${format} Blob:`, {
            size: blob.size,
            type: blob.type,
            isValid: blob.size > 0,
          });

          // Test the first few bytes to see if it's valid content
          const firstBytes = await blob.slice(0, 50).arrayBuffer();
          const decoder = new TextDecoder();
          const preview = decoder.decode(firstBytes);

          console.log(
            `🔍 ${format} Content preview:`,
            preview.replace(/\n/g, "\\n").substring(0, 100)
          );

          // Check if content looks like the expected format
          let isValidContent = false;
          switch (format) {
            case "csv":
              isValidContent =
                preview.includes(",") ||
                preview.includes("Date") ||
                preview.includes("Total");
              break;
            case "excel":
              // Excel files start with specific bytes
              isValidContent =
                blob.type.includes("spreadsheet") ||
                blob.type.includes("excel") ||
                firstBytes.byteLength > 0;
              break;
            case "pdf":
              // PDF files start with %PDF
              isValidContent = preview.startsWith("%PDF");
              break;
          }

          console.log(
            `🎯 ${format} Content validation:`,
            isValidContent ? "✅ Valid" : "❌ Invalid"
          );

          // Try to download the file
          const filename = `diagnostic-${format}-${Date.now()}.${format}`;
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);

          console.log(`💾 ${format} Download initiated:`, filename);
        } else {
          const errorText = await response.text();
          console.log(`❌ ${format} Error:`, errorText);
        }
      } catch (error) {
        console.log(`❌ ${format} Exception:`, error.message);
      }
    }

    console.log(
      "\n🎉 Diagnostic complete! Check your downloads folder for test files."
    );
    console.log(
      "💡 If files are empty or corrupt, there may be a backend issue."
    );
    console.log(
      "💡 If files download but won't open, check file associations or try different apps."
    );
  } catch (error) {
    console.log("❌ Diagnostic failed:", error.message);
  }
};

// Also provide a simple file checker
const checkDownloadedFile = (file) => {
  console.log("📁 File Analysis:", {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified),
  });

  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    console.log(
      "📄 File content preview:",
      typeof content === "string"
        ? content.substring(0, 200)
        : "Binary data, length: " + content.byteLength
    );
  };

  // Read first part as text to check content
  reader.readAsText(file.slice(0, 500));
};

console.log("🎯 Run testReportDownload() to diagnose download issues");
console.log(
  "🎯 Run checkDownloadedFile(file) with a downloaded file to analyze it"
);

// Make functions globally available
window.testReportDownload = testReportDownload;
window.checkDownloadedFile = checkDownloadedFile;
