import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("ERROR: Database credentials missing from .env.local");
  process.exit(1);
}

const client = createClient({ url, authToken });

async function run() {
  console.log("Connecting to remote database at:", url);
  try {
    console.log("Dropping unused table 'kudos'...");
    await client.execute("DROP TABLE IF EXISTS kudos");
    console.log("SUCCESS: Table 'kudos' has been dropped successfully!");
  } catch (error) {
    console.error("ERROR dropping table:", error);
  } finally {
    client.close();
  }
}

run();
