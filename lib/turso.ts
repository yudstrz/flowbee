import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.warn("Turso credentials missing. Using mock data.");
}

export const db = createClient({
  url: url || "file:local.db",
  authToken: authToken || "",
});
