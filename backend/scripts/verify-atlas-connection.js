/**
 * Verify MongoDB Atlas Connection
 * Tests connection to Atlas and displays cluster information
 *
 * Usage: node scripts/verify-atlas-connection.js
 */

const mongoose = require("mongoose");
require("dotenv").config();

// Use MONGODB_ATLAS_URI if set, otherwise MONGODB_URI
const ATLAS_URI = process.env.MONGODB_ATLAS_URI;

async function verifyConnection() {
  try {
    console.log("🔄 Testing MongoDB Atlas connection...\n");
    console.log(`📡 URI: ${ATLAS_URI.replace(/\/\/.*@/, "//***:***@")}`);

    // Connect with timeout
    const conn = await mongoose.connect(ATLAS_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("\n✅ CONNECTION SUCCESSFUL!\n");
    console.log("📊 Cluster Information:");
    console.log(`  🏢 Host: ${conn.connection.host}`);
    console.log(`  📁 Database: ${conn.connection.name}`);
    console.log(
      `  ⚡ Ready State: ${
        conn.connection.readyState === 1 ? "Connected" : "Not Connected"
      }`
    );
    console.log(`  🔗 Connection ID: ${conn.connection.id}`);

    // Get collections
    const db = conn.connection.db;
    const collections = await db.listCollections().toArray();

    console.log(`\n📚 Collections (${collections.length} total):`);

    // Get document counts
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      const indexes = await db.collection(col.name).indexes();
      console.log(
        `  - ${col.name}: ${count} documents, ${indexes.length} indexes`
      );
    }

    // Test a simple query
    console.log("\n🧪 Testing Query Operations:");
    const usersCount = await db.collection("users").countDocuments();
    console.log(`  ✓ Users collection: ${usersCount} users`);

    const projectsCount = await db.collection("projects").countDocuments();
    console.log(`  ✓ Projects collection: ${projectsCount} projects`);

    const timesheetsCount = await db.collection("timesheets").countDocuments();
    console.log(`  ✓ Timesheets collection: ${timesheetsCount} timesheets`);

    // Check indexes on critical collections
    console.log("\n🔍 Critical Indexes:");
    const userIndexes = await db.collection("users").indexes();
    console.log(`  - Users: ${userIndexes.map((i) => i.name).join(", ")}`);

    const timesheetIndexes = await db.collection("timesheets").indexes();
    console.log(
      `  - Timesheets: ${timesheetIndexes.map((i) => i.name).join(", ")}`
    );

    await mongoose.connection.close();
    console.log("\n🔌 Disconnected from MongoDB Atlas");
    console.log("\n🎉 All verification checks passed!");
    console.log("\n💡 Your application is ready to use MongoDB Atlas");
  } catch (error) {
    console.error("\n❌ CONNECTION FAILED!\n");

    if (error.name === "MongoServerSelectionError") {
      console.error("🔴 Server Selection Error:");
      console.error(
        "   - Check if your IP is whitelisted in Atlas Network Access"
      );
      console.error("   - Verify the connection string is correct");
      console.error("   - Check if the cluster is running");
    } else if (error.name === "MongoAuthenticationError") {
      console.error("🔴 Authentication Error:");
      console.error("   - Verify username and password");
      console.error("   - Check if user has proper permissions");
      console.error(
        "   - Ensure special characters in password are URL-encoded"
      );
    } else {
      console.error("🔴 Error:", error.message);
    }

    console.error("\n📋 Troubleshooting Steps:");
    console.error("   1. Check MONGODB_ATLAS_URI in .env file");
    console.error("   2. Verify IP whitelist in Atlas");
    console.error("   3. Confirm database user credentials");
    console.error("   4. Test connection in MongoDB Compass");

    process.exit(1);
  }
}

// Run verification
if (!ATLAS_URI) {
  console.error("❌ No MongoDB URI found!");
  console.error(
    "Please set MONGODB_ATLAS_URI or MONGODB_URI in your .env file"
  );
  console.error("\nExample:");
  console.error(
    "MONGODB_ATLAS_URI=mongodb+srv://username:password@cluster.mongodb.net/timesheet-management"
  );
  process.exit(1);
}

verifyConnection();
