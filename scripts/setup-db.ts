/**
 * Run once to initialize the database with schema and seed data.
 * Usage: bun run setup-db
 */
import { getDb } from "../lib/db";
import { seedDatabase } from "../lib/seed";

const db = getDb();
seedDatabase(db);
console.log("Setup complete. Database ready at data/educurric.db");
