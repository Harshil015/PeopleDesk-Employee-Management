// controllers/authController.js
//
// Implements Task 1 from the assignment: Login Form (Authentication).
//
// Flow (matches the PDF's "Expected Functionality" list exactly):
//  1. Validate mandatory fields.
//  2. Check credentials against the database.
//  3. Compare the submitted password against the stored HASH (never
//     the plain text) using bcrypt.
//  4. If valid -> issue a JWT and send it back.
//  5. If invalid -> return an appropriate error message (401), and
//     deliberately use the SAME error message whether the username
//     doesn't exist or the password is wrong, so an attacker can't
//     tell which one was incorrect ("user enumeration" protection).

const bcrypt = require("bcryptjs");
const db = require("../db/connection");
const { signToken } = require("../utils/jwt");

function login(req, res) {
  const { username, password } = req.body;

  // --- 1. Validate mandatory fields ---
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  // --- 2. Look up the user (by username OR email, either is fine) ---
  const user = db
    .prepare("SELECT * FROM Users WHERE (Username = ? OR Email = ?) AND IsActive = 1")
    .get(username, username);

  const genericError = { message: "Invalid username or password." };

  if (!user) {
    return res.status(401).json(genericError);
  }

  // --- 3. Compare submitted password against the stored hash ---
  const passwordMatches = bcrypt.compareSync(password, user.PasswordHash);
  if (!passwordMatches) {
    return res.status(401).json(genericError);
  }

  // --- 4. Credentials are valid: issue a JWT ---
  // We only embed non-sensitive identifying info in the token.
  const token = signToken({ userId: user.Id, username: user.Username });

  return res.status(200).json({
    message: "Login successful.",
    token,
    user: { id: user.Id, username: user.Username, email: user.Email },
  });
}

module.exports = { login };
