import { execSync } from "child_process";
import path from "path";
import "dotenv/config";

async function runMigration() {
  try {
    console.log("Running Supabase setup...");

    // Initialize Supabase if not already initialized
    try {
      execSync("npx supabase init", { stdio: "inherit" });
    } catch (error) {
      // Ignore error if already initialized
    }

    // Link to your project
    console.log("Linking to Supabase project...");
    execSync(
      `npx supabase link --project-ref ${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF}`,
      { stdio: "inherit" }
    );

    // Run the migration
    console.log("Running migrations...");
    execSync("npx supabase db push", { stdio: "inherit" });

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Setup failed:", error);
    process.exit(1);
  }
}

runMigration();