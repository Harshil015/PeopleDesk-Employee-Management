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

router.use(requireAuth);

// Validate every route parameter named "id".
router.param("id", (req, res, next, id) => {
  if (!/^[1-9]\d*$/.test(id)) {
    return res.status(400).json({
      message: "Employee ID must be a positive integer."
    });
  }

  next();
});

router.get("/", getAllEmployees);
router.get("/:id", getEmployeeById);
router.post("/", addEmployee);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

module.exports = router;
