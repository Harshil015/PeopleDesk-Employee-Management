// controllers/employeeController.js
//
// Implements Tasks 2-6 from the assignment:
//   Task 2: Employee List View       (Read - all)
//   Task 3: Add Employee             (Create)
//   Task 4: Get Employee By ID       (Read - one)
//   Task 5: Update Employee          (Update)
//   Task 6: Delete Employee          (Soft Delete)
//
// Every single query below filters on "IsDeleted = 0" (except the
// soft-delete statement itself). That one condition is what
// implements "Prevent deleted records from being updated or viewed
// through normal APIs" from the PDF.

const db = require("../db/connection");

// ---------- Task 2: GET /api/employees ----------
// Fetches every ACTIVE employee. "Active" = IsDeleted = 0.
function getAllEmployees(req, res) {
  const employees = db
    .prepare("SELECT * FROM Employees WHERE IsDeleted = 0 ORDER BY Id DESC")
    .all();
  return res.status(200).json(employees);
}

// ---------- Task 4: GET /api/employees/:id ----------
// Fetches ONE employee by primary key, same "do not return
// soft-deleted records" rule from the PDF.
function getEmployeeById(req, res) {
  const { id } = req.params;

  const employee = db
    .prepare("SELECT * FROM Employees WHERE Id = ? AND IsDeleted = 0")
    .get(id);

  if (!employee) {
    return res.status(404).json({ message: `Employee with Id ${id} was not found.` });
  }
  return res.status(200).json(employee);
}

// ---------- Task 3: POST /api/employees ----------
// Validates required fields, then inserts a brand-new row.
function addEmployee(req, res) {
  const {
    employeeName, email, mobileNumber, department,
    designation, joiningDate, address, gender, salary,
  } = req.body;

  // --- Required-field validation (mirrors the PDF's validation table) ---
  const missing = [];
  if (!employeeName) missing.push("employeeName");
  if (!email) missing.push("email");
  if (!mobileNumber) missing.push("mobileNumber");
  if (!department) missing.push("department");
  if (!designation) missing.push("designation");
  if (!joiningDate) missing.push("joiningDate");

  if (missing.length > 0) {
    return res.status(400).json({ message: `Missing required field(s): ${missing.join(", ")}` });
  }

  if (salary !== undefined && salary !== null && salary !== "" && Number(salary) < 0) {
    return res.status(400).json({ message: "Salary must be a positive value." });
  }

  const insert = db.prepare(`
    INSERT INTO Employees
      (EmployeeName, Email, MobileNumber, Department, Designation, JoiningDate, Address, Gender, Salary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insert.run(
    employeeName, email, mobileNumber, department,
    designation, joiningDate, address || null, gender || null,
    salary !== undefined && salary !== "" ? Number(salary) : null
  );

  const newEmployee = db.prepare("SELECT * FROM Employees WHERE Id = ?").get(result.lastInsertRowid);
  return res.status(201).json({ message: "Employee added successfully.", employee: newEmployee });
}

// ---------- Task 5: PUT /api/employees/:id ----------
// Updates an EXISTING row in place. Crucially, this never INSERTs -
// the PDF explicitly warns "Do not insert a new record."
function updateEmployee(req, res) {
  const { id } = req.params;
  const {
    employeeName, email, mobileNumber, department,
    designation, joiningDate, address, gender, salary,
  } = req.body;

  // Make sure the employee exists (and isn't soft-deleted) first.
  const existing = db.prepare("SELECT * FROM Employees WHERE Id = ? AND IsDeleted = 0").get(id);
  if (!existing) {
    return res.status(404).json({ message: `Employee with Id ${id} was not found.` });
  }

  const missing = [];
  if (!employeeName) missing.push("employeeName");
  if (!email) missing.push("email");
  if (!mobileNumber) missing.push("mobileNumber");
  if (!department) missing.push("department");
  if (!designation) missing.push("designation");
  if (!joiningDate) missing.push("joiningDate");
  if (missing.length > 0) {
    return res.status(400).json({ message: `Missing required field(s): ${missing.join(", ")}` });
  }

  db.prepare(`
    UPDATE Employees
    SET EmployeeName = ?, Email = ?, MobileNumber = ?, Department = ?,
        Designation = ?, JoiningDate = ?, Address = ?, Gender = ?, Salary = ?,
        ModifiedDate = datetime('now')
    WHERE Id = ? AND IsDeleted = 0
  `).run(
    employeeName, email, mobileNumber, department, designation,
    joiningDate, address || null, gender || null,
    salary !== undefined && salary !== "" ? Number(salary) : null,
    id
  );

  const updated = db.prepare("SELECT * FROM Employees WHERE Id = ?").get(id);
  return res.status(200).json({ message: "Employee updated successfully.", employee: updated });
}

// ---------- Task 6: DELETE /api/employees/:id (SOFT DELETE) ----------
// This is the line that matters most for this task: we UPDATE the
// IsDeleted flag, we never run a real SQL DELETE statement.
function deleteEmployee(req, res) {
  const { id } = req.params;

  const existing = db.prepare("SELECT * FROM Employees WHERE Id = ? AND IsDeleted = 0").get(id);
  if (!existing) {
    return res.status(404).json({ message: `Employee with Id ${id} was not found (or already deleted).` });
  }

  // This mirrors the exact SQL from the PDF:
  //   UPDATE Employees SET IsDeleted = 1, ModifiedDate = GETDATE()
  //   WHERE Id = @Id AND IsDeleted = 0;
  db.prepare(`
    UPDATE Employees
    SET IsDeleted = 1, ModifiedDate = datetime('now')
    WHERE Id = ? AND IsDeleted = 0
  `).run(id);

  return res.status(200).json({ message: `Employee with Id ${id} was soft-deleted successfully.` });
}

module.exports = {
  getAllEmployees,
  getEmployeeById,
  addEmployee,
  updateEmployee,
  deleteEmployee,
};
