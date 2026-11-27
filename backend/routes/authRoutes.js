// routes/authRoutes.js
//
// Maps URLs to controller functions. This file has no logic of its
// own on purpose - routes should just be a map, nothing more.

const express = require("express");
const { login } = require("../controllers/authController");

const router = express.Router();

// POST /api/auth/login
router.post("/login", login);

module.exports = router;
