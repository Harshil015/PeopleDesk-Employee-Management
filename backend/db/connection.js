// db/connection.js
//
// Opens (or creates) the SQLite database file and makes sure the
// tables from schema.sql exist. Every other file in the backend
// imports `db` from here to run queries.
//
// .NET equivalent: this plays the role of your DbContext +
// `dotnet ef database update` (running migrations) combined.

const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const DB_PATH = path.join(__dirname, "ems.sqlite");
const SCHEMA_PATH = path.join(__dirname, "schema.sql");

// Open the database file. better-sqlite3 creates the file if it
// doesn't exist yet.
const db = new Database(DB_PATH);

// Make SQLite enforce foreign keys and wait properly on writes.
db.pragma("journal_mode = WAL");

// Run the schema file. Every statement uses "CREATE TABLE IF NOT EXISTS",
// so this is safe to run every time the server starts - it only
// creates the tables the first time.
const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
db.exec(schema);

module.exports = db;
