/**
 * Restore Database to MongoDB Atlas
 * Restores a JSON backup to MongoDB Atlas cluster
 *
 * Usage: node scripts/restore-to-atlas.js <backup-file-path>
 * Example: node scripts/restore-to-atlas.js ./backups/backup-2025-10-27.json
 */

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Get backup file from command line argument
const backupFilePath = process.argv[2];

if (!backupFilePath) {
  console.error("❌ Please provide backup file path");
  console.log("Usage: node scripts/restore-to-atlas.js <backup-file-path>");
  process.exit(1);
}

// Use MONGODB_ATLAS_URI from .env, fallback to MONGODB_URI
const ATLAS_URI = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI;

if (!ATLAS_URI) {
  console.error("❌ Please set MONGODB_ATLAS_URI in your .env file");
  console.error(
    "Example: MONGODB_ATLAS_URI=mongodb+srv://username:password@cluster.mongodb.net/timesheet-management"
  );
  process.exit(1);
}

async function restoreToAtlas() {
  try {
    // Read backup file
    console.log("📖 Reading backup file...");
    if (!fs.existsSync(backupFilePath)) {
      throw new Error(`Backup file not found: ${backupFilePath}`);
    }

    const backupData = JSON.parse(fs.readFileSync(backupFilePath, "utf8"));
    console.log(`✅ Backup file loaded: ${backupData.database}`);
    console.log(`📅 Backup timestamp: ${backupData.timestamp}`);
    console.log(
      `📊 Collections to restore: ${
        Object.keys(backupData.collections).length
      }\n`
    );

    // Connect to Atlas
    console.log("🔄 Connecting to MongoDB Atlas...");
    console.log(`📡 URI: ${ATLAS_URI.replace(/\/\/.*@/, "//***:***@")}`); // Hide credentials

    await mongoose.connect(ATLAS_URI);
    console.log("✅ Connected to MongoDB Atlas\n");

    const db = mongoose.connection.db;

    // Restore each collection
    let totalRestored = 0;
    for (const [collectionName, collectionData] of Object.entries(
      backupData.collections
    )) {
      try {
        const collection = db.collection(collectionName);
        const documents = collectionData.documents;

        if (documents.length === 0) {
          console.log(`  ⊘ ${collectionName}: No documents to restore`);
          continue;
        }

        // Drop existing collection (optional - comment out to merge)
        try {
          await collection.drop();
          console.log(`  🗑️  Dropped existing collection: ${collectionName}`);
        } catch (error) {
          // Collection doesn't exist, which is fine
        }

        // Insert documents
        await collection.insertMany(documents, { ordered: false });
        totalRestored += documents.length;
        console.log(
          `  ✓ ${collectionName}: ${documents.length} documents restored`
        );
      } catch (error) {
        console.error(`  ❌ Error restoring ${collectionName}:`, error.message);
      }
    }

    console.log(`\n✅ Restore completed successfully!`);
    console.log(`📊 Total documents restored: ${totalRestored}`);
    console.log(`🏢 Database: ${db.databaseName}`);

    // Verify restoration
    console.log("\n🔍 Verifying restoration...");
    const collections = await db.listCollections().toArray();
    console.log(`📁 Collections in Atlas: ${collections.length}`);

    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`  - ${col.name}: ${count} documents`);
    }

    await mongoose.connection.close();
    console.log("\n🔌 Disconnected from MongoDB Atlas");
    console.log("\n🎉 Migration to Atlas completed successfully!");
  } catch (error) {
    console.error("❌ Restore failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run restore
restoreToAtlas();
