// utils/jwt.js
//
// Two small helper functions wrapping the jsonwebtoken library:
//  - signToken(): called when a user logs in successfully
//  - verifyToken(): called by the auth middleware on every protected request
//
// .NET equivalent: this is what AddJwtBearer(...) configures for you
// automatically in Program.cs. Here we write it explicitly so every
// step is visible.

const jwt = require("jsonwebtoken");

// In a real production app this secret would ONLY live in an
// environment variable / secret manager - never committed to git.
// We fall back to a default here purely so the demo runs out of the box.
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-change-me";
const JWT_EXPIRES_IN = "2h";

function signToken(payload) {
  // payload becomes the token's "claims" - the pieces of user info
  // embedded (and cryptographically signed) inside the token itself.
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  // Throws an error if the token is invalid, tampered with, or expired.
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken };
