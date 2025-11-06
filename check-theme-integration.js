#!/usr/bin/env node

/**
 * Theme Integration Checker
 * Scans the codebase to identify components that need dark mode updates
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMPONENTS_DIR = "./frontend/src/components";
const PAGES_DIR = "./frontend/src/pages";

// Patterns that indicate missing dark mode support
const PATTERNS_TO_CHECK = [
  /className="[^"]*bg-white(?![^"]*dark:)/g,
  /className="[^"]*text-gray-900(?![^"]*dark:)/g,
  /className="[^"]*border-gray-200(?![^"]*dark:)/g,
  /className="[^"]*shadow(?![^"]*dark:)/g,
];

// Known theme-aware patterns
const THEME_PATTERNS = [/themeClasses\./g, /useTheme\(\)/g, /dark:/g];

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const issues = [];
    const hasThemeSupport = THEME_PATTERNS.some((pattern) =>
      pattern.test(content)
    );

    PATTERNS_TO_CHECK.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        issues.push({
          type: ["bg-white", "text-gray-900", "border-gray-200", "shadow"][
            index
          ],
          count: matches.length,
        });
      }
    });

    return {
      filePath: filePath.replace("./frontend/src/", ""),
      hasThemeSupport,
      issues,
      needsUpdate: issues.length > 0 && !hasThemeSupport,
    };
  } catch (error) {
    return null;
  }
}

function scanDirectory(dir, results = []) {
  try {
    const items = fs.readdirSync(dir);

    items.forEach((item) => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDirectory(fullPath, results);
      } else if (item.endsWith(".tsx") || item.endsWith(".ts")) {
        const result = scanFile(fullPath);
        if (result) {
          results.push(result);
        }
      }
    });
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error.message);
  }

  return results;
}

function generateReport() {
  console.log("🔍 Scanning for dark mode integration issues...\n");

  const results = [];

  // Scan components and pages
  scanDirectory(COMPONENTS_DIR, results);
  scanDirectory(PAGES_DIR, results);

  // Filter and categorize results
  const needsUpdate = results.filter((r) => r.needsUpdate);
  const hasThemeSupport = results.filter((r) => r.hasThemeSupport);
  const noIssues = results.filter((r) => r.issues.length === 0);

  console.log("📊 DARK MODE INTEGRATION REPORT");
  console.log("=".repeat(50));
  console.log(`Total files scanned: ${results.length}`);
  console.log(`✅ Files with theme support: ${hasThemeSupport.length}`);
  console.log(`✅ Files with no issues: ${noIssues.length}`);
  console.log(`⚠️  Files needing updates: ${needsUpdate.length}\n`);

  if (needsUpdate.length > 0) {
    console.log("🚨 FILES NEEDING DARK MODE UPDATES:");
    console.log("-".repeat(50));

    needsUpdate.forEach((file) => {
      console.log(`📁 ${file.filePath}`);
      file.issues.forEach((issue) => {
        console.log(`   • ${issue.count} instances of ${issue.type}`);
      });
      console.log("");
    });
  }

  if (hasThemeSupport.length > 0) {
    console.log("✨ FILES WITH THEME SUPPORT:");
    console.log("-".repeat(50));

    hasThemeSupport.forEach((file) => {
      console.log(`✅ ${file.filePath}`);
    });
    console.log("");
  }

  console.log("🛠️  RECOMMENDED ACTIONS:");
  console.log("-".repeat(50));
  console.log('1. Update files in the "needing updates" list');
  console.log("2. Replace hardcoded classes with themeClasses");
  console.log("3. Add useTheme hook where dynamic styling is needed");
  console.log("4. Test all components in both light and dark modes");
  console.log("5. Add theme toggle to main navigation\n");

  console.log(
    "📚 For detailed migration guide, see: DARK_MODE_INTEGRATION_GUIDE.md"
  );
}

// Check if running as script
if (import.meta.url === `file://${process.argv[1]}`) {
  generateReport();
}

export { scanFile, scanDirectory, generateReport };
