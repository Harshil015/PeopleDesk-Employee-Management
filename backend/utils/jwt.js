const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

if (
  typeof JWT_SECRET !== "string" ||
  Buffer.byteLength(JWT_SECRET, "utf8") < 32
) {
  throw new Error(
    "JWT_SECRET must be configured with at least 32 bytes."
  );
}

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
