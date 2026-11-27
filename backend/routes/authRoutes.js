const express = require("express");
const { rateLimit } = require("express-rate-limit");

const { login } = require("../controllers/authController");

const router = express.Router();

// Limit repeated login attempts.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    message: "Too many login attempts. Please try again later."
  }
});

router.post("/login", loginLimiter, login);

module.exports = router;
