// Seed report templates
const { connectToDatabase } = require("./src/config/database");
const { seedReportTemplates } = require("./src/seeds/reportTemplateSeeds");

async function runSeeding() {
  try {
    console.log("🌱 Starting report template seeding...");

    // Connect to database
    await connectToDatabase();
    console.log("✅ Connected to database");

    // Seed report templates
    await seedReportTemplates("system"); // Use 'system' as the creator

    console.log("🎉 Report template seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

runSeeding();
