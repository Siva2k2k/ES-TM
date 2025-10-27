#!/usr/bin/env node

/**
 * MongoDB Atlas Migration Quick Start
 * Interactive script to guide through Atlas migration
 *
 * Usage: node scripts/atlas-migration-wizard.js
 */

const readline = require("readline");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

console.log("\n╔═══════════════════════════════════════════════════════════╗");
console.log("║   MongoDB Atlas Migration Wizard                          ║");
console.log("║   Timesheet Management System                             ║");
console.log("╚═══════════════════════════════════════════════════════════╝\n");

async function main() {
  try {
    console.log("📋 Pre-Migration Checklist:\n");
    console.log("  [ ] MongoDB Atlas account created");
    console.log("  [ ] Cluster created and running");
    console.log("  [ ] Network access configured (IP whitelist)");
    console.log("  [ ] Database user created with proper permissions");
    console.log("  [ ] Connection string obtained\n");

    const ready = await question(
      "Have you completed all the above steps? (yes/no): "
    );

    if (ready.toLowerCase() !== "yes") {
      console.log("\n📚 Please complete the setup steps first.");
      console.log("📖 Refer to: MONGODB_ATLAS_MIGRATION_GUIDE.md");
      rl.close();
      return;
    }

    console.log("\n🎯 Choose Migration Method:\n");
    console.log(
      "  1. mongodump/mongorestore (Recommended - Preserves indexes)"
    );
    console.log("  2. JSON Backup Scripts (Easy - Inspect data)");
    console.log("  3. Manual Export/Import via Compass (Visual)");
    console.log("  4. Test Connection Only\n");

    const method = await question("Enter your choice (1-4): ");

    switch (method) {
      case "1":
        await guideMongoDump();
        break;
      case "2":
        await guideBackupScripts();
        break;
      case "3":
        await guideCompass();
        break;
      case "4":
        await testConnection();
        break;
      default:
        console.log("❌ Invalid choice");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    rl.close();
  }
}

async function guideMongoDump() {
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║  Method 1: mongodump/mongorestore                      ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  console.log("📦 Step 1: Install MongoDB Database Tools");
  console.log(
    "   Download: https://www.mongodb.com/try/download/database-tools\n"
  );

  const hasTools = await question(
    "Do you have mongodump/mongorestore installed? (yes/no): "
  );

  if (hasTools.toLowerCase() !== "yes") {
    console.log("\n⚠️  Please install MongoDB Database Tools first.");
    console.log("   For Windows: choco install mongodb-database-tools");
    console.log("   Or download from the link above.\n");
    return;
  }

  console.log("\n📥 Step 2: Backup Local Database");
  console.log("\nCommand to run:");
  console.log("─────────────────────────────────────────────────────────");
  console.log(
    'mongodump --uri="mongodb://Admin:1234@localhost:27017/timesheet-management?authSource=admin" --out=./mongo-backup'
  );
  console.log("─────────────────────────────────────────────────────────\n");

  const runBackup = await question("Run backup now? (yes/no): ");

  if (runBackup.toLowerCase() === "yes") {
    console.log("\n🔄 Running backup...\n");
    // Note: This won't work in all environments, showing command instead
    console.log("Please run this command in your terminal:");
    console.log(
      'mongodump --uri="mongodb://Admin:1234@localhost:27017/timesheet-management?authSource=admin" --out=./mongo-backup\n'
    );
  }

  console.log("\n📤 Step 3: Restore to Atlas");
  const atlasUri = await question("Enter your Atlas connection string: ");

  if (atlasUri) {
    console.log("\n🔄 Restore Command:");
    console.log("─────────────────────────────────────────────────────────");
    console.log(
      `mongorestore --uri="${atlasUri}" ./mongo-backup/timesheet-management`
    );
    console.log("─────────────────────────────────────────────────────────\n");

    const runRestore = await question("Run restore now? (yes/no): ");
    if (runRestore.toLowerCase() === "yes") {
      console.log("\nPlease run the above command in your terminal.\n");
    }
  }

  console.log("\n✅ After restore completes:");
  console.log("   1. Update .env with MONGODB_ATLAS_URI");
  console.log("   2. Run: node scripts/verify-atlas-connection.js");
  console.log("   3. Test your application\n");
}

async function guideBackupScripts() {
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║  Method 2: JSON Backup Scripts                         ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  console.log("📥 Step 1: Create Backup from Local MongoDB");
  console.log("\nCommand:");
  console.log("─────────────────────────────────────────────────────────");
  console.log("node scripts/backup-database.js");
  console.log("─────────────────────────────────────────────────────────\n");

  const runBackup = await question("Run backup now? (yes/no): ");

  if (runBackup.toLowerCase() === "yes") {
    console.log("\n🔄 Creating backup...\n");

    try {
      const backup = spawn("node", ["scripts/backup-database.js"], {
        cwd: path.join(__dirname, ".."),
        stdio: "inherit",
      });

      backup.on("close", async (code) => {
        if (code === 0) {
          console.log("\n✅ Backup created successfully!\n");

          // Find the latest backup file
          const backupDir = path.join(__dirname, "..", "backups");
          if (fs.existsSync(backupDir)) {
            const files = fs
              .readdirSync(backupDir)
              .filter((f) => f.startsWith("backup-") && f.endsWith(".json"))
              .sort()
              .reverse();

            if (files.length > 0) {
              const latestBackup = files[0];
              console.log(`📄 Latest backup: ${latestBackup}\n`);

              console.log("📤 Step 2: Setup Atlas Connection");
              const atlasUri = await question(
                "Enter your Atlas connection string: "
              );

              if (atlasUri) {
                // Update .env file
                const envPath = path.join(__dirname, "..", ".env");
                let envContent = "";

                if (fs.existsSync(envPath)) {
                  envContent = fs.readFileSync(envPath, "utf8");
                }

                if (!envContent.includes("MONGODB_ATLAS_URI")) {
                  envContent += `\n# MongoDB Atlas\nMONGODB_ATLAS_URI=${atlasUri}\n`;
                  fs.writeFileSync(envPath, envContent);
                  console.log("\n✅ Added MONGODB_ATLAS_URI to .env\n");
                }

                console.log("📤 Step 3: Restore to Atlas");
                console.log("\nCommand:");
                console.log(
                  "─────────────────────────────────────────────────────────"
                );
                console.log(
                  `node scripts/restore-to-atlas.js ./backups/${latestBackup}`
                );
                console.log(
                  "─────────────────────────────────────────────────────────\n"
                );

                const runRestore = await question(
                  "Run restore now? (yes/no): "
                );

                if (runRestore.toLowerCase() === "yes") {
                  const restore = spawn(
                    "node",
                    [
                      "scripts/restore-to-atlas.js",
                      `./backups/${latestBackup}`,
                    ],
                    {
                      cwd: path.join(__dirname, ".."),
                      stdio: "inherit",
                    }
                  );

                  restore.on("close", (restoreCode) => {
                    if (restoreCode === 0) {
                      console.log("\n🎉 Migration completed successfully!");
                      console.log("\n📋 Next steps:");
                      console.log(
                        "   1. Run: node scripts/verify-atlas-connection.js"
                      );
                      console.log("   2. Update your application to use Atlas");
                      console.log("   3. Test all functionality\n");
                    }
                  });
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error("❌ Error:", error.message);
    }
  } else {
    console.log("\nYou can run the backup manually later with:");
    console.log("node scripts/backup-database.js\n");
  }
}

async function guideCompass() {
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║  Method 3: MongoDB Compass Manual Export/Import        ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  console.log("📝 Manual Steps:\n");
  console.log("1. Export from Local MongoDB:");
  console.log("   • Open MongoDB Compass");
  console.log("   • Connect to: mongodb://Admin:1234@localhost:27017");
  console.log("   • For EACH of the 21 collections:");
  console.log("     - Click collection → Export");
  console.log("     - Choose JSON format");
  console.log("     - Save file\n");

  console.log("2. Import to Atlas:");
  console.log("   • In Compass, connect to your Atlas cluster");
  console.log("   • For EACH collection:");
  console.log("     - Create collection if needed");
  console.log("     - Click Add Data → Import JSON");
  console.log("     - Select exported file");
  console.log("     - Click Import\n");

  console.log("3. Recreate Indexes:");
  console.log("   • Refer to: MONGODB_SCHEMA_REFERENCE.md");
  console.log("   • Manually create indexes for each collection\n");

  console.log("⚠️  Note: This method is time-consuming for 21 collections.");
  console.log("    Consider using Method 1 or 2 instead.\n");
}

async function testConnection() {
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║  Test MongoDB Atlas Connection                         ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  const hasUri = await question(
    "Have you added MONGODB_ATLAS_URI to .env? (yes/no): "
  );

  if (hasUri.toLowerCase() !== "yes") {
    const atlasUri = await question("\nEnter your Atlas connection string: ");

    if (atlasUri) {
      const envPath = path.join(__dirname, "..", ".env");
      let envContent = "";

      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, "utf8");
      }

      if (!envContent.includes("MONGODB_ATLAS_URI")) {
        envContent += `\n# MongoDB Atlas\nMONGODB_ATLAS_URI=${atlasUri}\n`;
        fs.writeFileSync(envPath, envContent);
        console.log("\n✅ Added MONGODB_ATLAS_URI to .env\n");
      }
    }
  }

  console.log("🔍 Testing connection...\n");
  console.log("Command:");
  console.log("─────────────────────────────────────────────────────────");
  console.log("node scripts/verify-atlas-connection.js");
  console.log("─────────────────────────────────────────────────────────\n");

  const runTest = await question("Run test now? (yes/no): ");

  if (runTest.toLowerCase() === "yes") {
    try {
      const test = spawn("node", ["scripts/verify-atlas-connection.js"], {
        cwd: path.join(__dirname, ".."),
        stdio: "inherit",
      });

      test.on("close", (code) => {
        if (code === 0) {
          console.log(
            "\n✅ Connection successful! You can now proceed with migration.\n"
          );
        } else {
          console.log(
            "\n❌ Connection failed. Please check your configuration.\n"
          );
        }
      });
    } catch (error) {
      console.error("❌ Error:", error.message);
    }
  }
}

// Run the wizard
main();
