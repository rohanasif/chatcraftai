#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * Cleanup script to remove test database directories ending with .db
 */

async function cleanupTestDatabases() {
  try {
    await manualCleanup();
  } catch (error) {
    process.exit(1);
  }
}

async function manualCleanup() {
  const currentDir = process.cwd();
  let cleanedCount = 0;
  let errorCount = 0;

  try {
    // Get all files and directories in current directory
    const items = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const item of items) {
      const itemPath = path.join(currentDir, item.name);

      // Only match directories whose names end with .db
      if (item.isDirectory() && item.name.endsWith(".db")) {
        try {
          fs.rmSync(itemPath, { recursive: true, force: true });
          cleanedCount++;
        } catch (error) {
          errorCount++;
        }
      }
    }
  } catch (error) {
    process.exit(1);
  }

  if (cleanedCount > 0) {
    console.log(`Cleanup complete! Removed ${cleanedCount} items.`);
  } else {
    console.log("No test database files found to clean up.");
  }

  if (errorCount > 0) {
    process.exit(1);
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupTestDatabases().catch(() => {
    process.exit(1);
  });
}

module.exports = { cleanupTestDatabases };
