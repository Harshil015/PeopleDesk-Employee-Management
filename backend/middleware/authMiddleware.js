// middleware/authMiddleware.js
//
// This function sits IN FRONT OF every protected route (all the
// Employee CRUD routes). Express calls it before the real
// controller function runs.
//
// .NET equivalent: this is exactly what the [Authorize] attribute
// does on a controller - it runs as part of the middleware pipeline
// and short-circuits the request with a 401 if there's no valid token.

const { verifyToken } = require("../utils/jwt");

function requireAuth(req, res, next) {
  // The frontend sends the token as: Authorization: Bearer <token>
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No authentication token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    // Attach the decoded user info to the request so controllers
    // further down the chain know WHO is making the request.
    req.user = decoded;
    next(); // token is valid -> let the request continue to the controller
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token. Please log in again." });
  }
}

module.exports = { requireAuth };
