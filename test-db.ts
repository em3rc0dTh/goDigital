import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import "dotenv/config";

async function main() {
  const connectionString = process.env.DATABASE_URL || "postgresql://devuser:devpass@localhost:5432/shipfreedev";
  console.log("Testing connection to:", connectionString);
  
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    await client.connect();
    console.log("✅ Connected successfully");
    await client.end();
  } catch (error) {
    console.error("❌ Connection failed:", error);
  }
}

main();
