// db/seed.js
//
// Creates one default login user so you have something to log in
// with immediately. Run with: npm run seed
//
// IMPORTANT (and this is a point worth making to an interviewer):
// we NEVER store the plain-text password "Admin@123" in the database.
// bcrypt.hashSync() turns it into a one-way hash before it touches
// the Users table. Even if someone stole the database file, they
// could not read the original password back out of it.

const bcrypt = require("bcryptjs");
const db = require("./connection");

const username = "admin";
const email = "admin@example.com";
const plainTextPassword = "Admin@123"; // only used once, to create the hash below

// bcrypt automatically generates and stores a random "salt" inside
// the hash itself, so two users with the same password still get
// different hashes in the database.
const passwordHash = bcrypt.hashSync(plainTextPassword, 10);

const existing = db.prepare("SELECT Id FROM Users WHERE Username = ?").get(username);

if (existing) {
  console.log(`User '${username}' already exists (Id=${existing.Id}). Nothing to do.`);
} else {
  const insert = db.prepare(`
    INSERT INTO Users (Username, Email, PasswordHash, IsActive)
    VALUES (?, ?, ?, 1)
  `);
  const result = insert.run(username, email, passwordHash);
  console.log(`Created user '${username}' with Id=${result.lastInsertRowid}`);
  console.log(`Login with -> username: ${username}  password: ${plainTextPassword}`);
}
