import { createClient } from "@libsql/client";

const turso = createClient({
  url: "libsql://honeystore-belloumi.aws-us-east-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM4MjQ2NDMsImlkIjoiMDE5ZDAwMmYtNzIwMS03YzQxLTk0YTktOWU0MjFhYjMxNzZmIiwicmlkIjoiMjQ2MmQ0NGMtMzI2NC00NTRkLThiZjctNjgxZWI1MDQ5MDRkIn0.wackmXjGHxftSKRuPbHa9lY0cBUPlMLXX-vvQj35e4t_zFauu0HONvUE2z-2K0eiKnKRgQ_Ff_89pyt6T7VpBQ",
});

async function migrate() {
  console.log("Adding password_hash column...");
  
  try {
    await turso.execute("ALTER TABLE customers ADD COLUMN password_hash TEXT");
    console.log("✅ Column password_hash added successfully!");
  } catch (error: any) {
    if (error.message?.includes("duplicate column name")) {
      console.log("Column already exists");
    } else {
      console.error("Error:", error.message);
    }
  }
  
  // Verify the table structure
  const result = await turso.execute("PRAGMA table_info(customers)");
  console.log("\nCurrent customers table structure:");
  console.log(result.rows.map((r: any) => r.name).join(", "));
}

migrate();
