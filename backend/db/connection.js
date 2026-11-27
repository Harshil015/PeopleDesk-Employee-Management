const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const DB_PATH = path.join(__dirname, "ems.sqlite");
const SCHEMA_PATH = path.join(__dirname, "schema.sql");

// Open the database file. better-sqlite3 creates the file if it
// doesn't exist yet.
const db = new Database(DB_PATH);

// Enable foreign-key enforcement for any foreign keys
// added to the schema in the future.
db.pragma("foreign_keys = ON");

// Enable Write-Ahead Logging for better read/write concurrency.
db.pragma("journal_mode = WAL");

// Wait up to five seconds when the database is busy.
db.pragma("busy_timeout = 5000");

// Run the schema file. Every statement uses "CREATE TABLE IF NOT EXISTS",
// so this is safe to run every time the server starts - it only
// creates the tables the first time.
const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
db.exec(schema);

module.exports = db;
