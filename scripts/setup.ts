// Setup Turso Database
import { createClient } from "@libsql/client";
import fs from "fs";
import path from "path";

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL || "libsql://honeystore-belloumi.aws-us-east-1.turso.io",
  authToken: process.env.TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM4MjQ2NDMsImlkIjoiMDE5ZDAwMmYtNzIwMS03YzQxLTk0YTktOWU0MjFhYjMxNzZmIiwicmlkIjoiMjQ2MmQ0NGMtMzI2NC00NTRkLThiZjctNjgxZWI1MDQ5MDRkIn0.wackmXjGHxftSKRuPbHa9lY0cBUPlMLXX-vvQj35e4t_zFauu0HONvUE2z-2K0eiKnKRgQ_Ff_89pyt6T7VpBQ",
});

async function setup() {
  console.log("Setting up Turso database...");
  
  const schemaPath = path.join(process.cwd(), "scripts", "setup-turso.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  
  // Split by semicolons and execute each statement
  const statements = schema.split(";").filter(s => s.trim());
  
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await turso.execute(statement);
        console.log("✓ Executed:", statement.substring(0, 50) + "...");
      } catch (error: any) {
        console.error("✗ Error:", error.message);
      }
    }
  }
  
  console.log("\n✅ Database setup complete!");
}

setup().catch(console.error);
