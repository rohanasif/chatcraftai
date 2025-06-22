#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * Cleanup script to remove test database files and directories
 * This script removes:
 * - test-db-*.db files and directories
 * - pglite-* directories
 * - Any other test database artifacts
 */

function cleanupTestDatabases() {
  const currentDir = process.cwd();
  console.log("🧹 Cleaning up test database files...");

  let cleanedCount = 0;
  let errorCount = 0;

  try {
    // Find and remove test database files and directories
    const patterns = ["test-db-*", "pglite-*", "*.db", "*.sqlite", "*.sqlite3"];

    // Get all files and directories in current directory
    const items = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const item of items) {
      const itemPath = path.join(currentDir, item.name);

      // Check if item matches any of our patterns
      const shouldRemove = patterns.some((pattern) => {
        const regex = pattern.replace(/\*/g, ".*").replace(/\./g, "\\.");
        return new RegExp(`^${regex}$`).test(item.name);
      });

      if (shouldRemove) {
        try {
          if (item.isDirectory()) {
            fs.rmSync(itemPath, { recursive: true, force: true });
            console.log(`  ✅ Removed directory: ${item.name}`);
          } else {
            fs.unlinkSync(itemPath);
            console.log(`  ✅ Removed file: ${item.name}`);
          }
          cleanedCount++;
        } catch (error) {
          console.error(`  ❌ Failed to remove ${item.name}:`, error.message);
          errorCount++;
        }
      }
    }

    // Also check for test database files in subdirectories
    const subdirs = ["src", "dist", "build", "coverage"];
    for (const subdir of subdirs) {
      const subdirPath = path.join(currentDir, subdir);
      if (fs.existsSync(subdirPath)) {
        try {
          const subdirItems = fs.readdirSync(subdirPath, {
            withFileTypes: true,
          });
          for (const item of subdirItems) {
            const itemPath = path.join(subdirPath, item.name);

            // Check if item matches test database patterns
            const shouldRemove = patterns.some((pattern) => {
              const regex = pattern.replace(/\*/g, ".*").replace(/\./g, "\\.");
              return new RegExp(`^${regex}$`).test(item.name);
            });

            if (shouldRemove) {
              try {
                if (item.isDirectory()) {
                  fs.rmSync(itemPath, { recursive: true, force: true });
                  console.log(`  ✅ Removed directory: ${subdir}/${item.name}`);
                } else {
                  fs.unlinkSync(itemPath);
                  console.log(`  ✅ Removed file: ${subdir}/${item.name}`);
                }
                cleanedCount++;
              } catch (error) {
                console.error(
                  `  ❌ Failed to remove ${subdir}/${item.name}:`,
                  error.message
                );
                errorCount++;
              }
            }
          }
        } catch (error) {
          console.error(
            `  ⚠️  Could not read subdirectory ${subdir}:`,
            error.message
          );
        }
      }
    }
  } catch (error) {
    console.error("❌ Error during cleanup:", error.message);
    process.exit(1);
  }

  if (cleanedCount > 0) {
    console.log(`\n🎉 Cleanup complete! Removed ${cleanedCount} items.`);
  } else {
    console.log("\n✨ No test database files found to clean up.");
  }

  if (errorCount > 0) {
    console.log(`⚠️  ${errorCount} items could not be removed.`);
    process.exit(1);
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupTestDatabases();
}

module.exports = { cleanupTestDatabases };
