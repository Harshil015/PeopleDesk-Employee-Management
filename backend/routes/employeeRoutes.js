// routes/employeeRoutes.js
//
// Every single route below is protected by `requireAuth`. That
// means: no valid JWT in the Authorization header -> 401, the
// controller function never even runs. This is what the PDF's
// "Implement secure authentication using session or JWT" and the
// overall flow (must log in before reaching the Employee List)
// actually enforces at the API level - not just hidden in the UI.

const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const {
  getAllEmployees,
  getEmployeeById,
  addEmployee,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employeeController");

const router = express.Router();

router.use(requireAuth); // <-- applies to every route defined below

router.get("/", getAllEmployees);           // Task 2: GetAllEmployees
router.get("/:id", getEmployeeById);        // Task 4: GetEmployeeById
router.post("/", addEmployee);              // Task 3: AddEmployee
router.put("/:id", updateEmployee);         // Task 5: UpdateEmployee
router.delete("/:id", deleteEmployee);      // Task 6: DeleteEmployee (soft)

module.exports = router;
