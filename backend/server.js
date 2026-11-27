// server.js
//
// The application's entry point. This is where the "middleware
// pipeline" is assembled - the ordered list of things that happen
// to every incoming request before it reaches a controller.
//
// .NET equivalent: this file is the rough equivalent of Program.cs.

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");

// Initializing db/connection.js here ensures the SQLite file and
// tables exist before the server starts accepting requests.
require("./db/connection");

const app = express();
const PORT = process.env.PORT || 5000;

// --- Global middleware (runs on EVERY request, in this order) ---
app.use(cors());           // allow the frontend (served from a different port) to call this API
app.use(express.json());   // parse incoming JSON request bodies into req.body

// --- Simple health check, useful for confirming the server is alive ---
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Employee Management API is running." });
});

// --- Feature routes ---
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);

// --- 404 handler: anything that doesn't match a route above ---
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// --- Centralized error handler: catches anything thrown/next(err) ---
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error." });
});

app.listen(PORT, () => {
  console.log(`Employee Management API listening on http://localhost:${PORT}`);
});
