const db = require("../db/connection");

// Shared employee validation for both Add and Update.

function validateEmployee(data) {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    return "Request body must be a JSON object.";
  }

  const requiredFields = [
    "employeeName",
    "email",
    "mobileNumber",
    "department",
    "designation",
    "joiningDate"
  ];

  const maxLengths = {
    employeeName: 150,
    email: 150,
    mobileNumber: 15,
    department: 100,
    designation: 100,
    address: 255,
    gender: 10
  };

  // Required field validation.
  for (const field of requiredFields) {
    if (
      typeof data[field] !== "string" ||
      !data[field].trim()
    ) {
      return `${field} is required.`;
    }

    if (data[field].trim().length > maxLengths[field]) {
      return `${field} exceeds the maximum allowed length.`;
    }
  }

  // Email validation.
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(data.email.trim())) {
    return "Enter a valid email address.";
  }

  // Mobile number validation.
  const mobilePattern = /^[0-9]{7,15}$/;

  if (!mobilePattern.test(data.mobileNumber.trim())) {
    return "Enter a valid mobile number.";
  }

  // Joining date validation.
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePattern.test(data.joiningDate)) {
    return "Joining date must use YYYY-MM-DD format.";
  }

  const parsedDate = new Date(
    `${data.joiningDate}T00:00:00.000Z`
  );

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== data.joiningDate
  ) {
    return "Enter a valid joining date.";
  }

  // Optional string fields.
  for (const field of ["address", "gender"]) {
    if (
      data[field] !== undefined &&
      data[field] !== null &&
      typeof data[field] !== "string"
    ) {
      return `${field} must be text.`;
    }

    if (
      typeof data[field] === "string" &&
      data[field].trim().length > maxLengths[field]
    ) {
      return `${field} exceeds the maximum allowed length.`;
    }
  }

  // Salary validation.
  const salary =
    typeof data.salary === "string"
      ? data.salary.trim()
      : data.salary;

  if (
    salary !== undefined &&
    salary !== null &&
    salary !== ""
  ) {
    const numericSalary = Number(salary);

    if (
      !Number.isFinite(numericSalary) ||
      numericSalary < 0 ||
      numericSalary > 9999999999.99
    ) {
      return "Salary must be a valid non-negative number.";
    }

    // Allow no more than two decimal places.
    if (
      Math.abs(
        numericSalary * 100 -
        Math.round(numericSalary * 100)
      ) > 0.0000001
    ) {
      return "Salary cannot have more than two decimal places.";
    }
  }

  return null;
}


// Convert an optional salary to a number or NULL.
function getSalaryValue(salary) {
  if (
    salary === undefined ||
    salary === null ||
    (typeof salary === "string" && salary.trim() === "")
  ) {
    return null;
  }

  return Number(salary);
}


function getAllEmployees(req, res) {
  const employees = db
    .prepare("SELECT * FROM Employees WHERE IsDeleted = 0 ORDER BY Id DESC")
    .all();
  return res.status(200).json(employees);
}


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


function addEmployee(req, res) {
  const validationError = validateEmployee(req.body);

  if (validationError) {
    return res.status(400).json({
      message: validationError
    });
  }

  const {
    employeeName,
    email,
    mobileNumber,
    department,
    designation,
    joiningDate,
    address,
    gender,
    salary
  } = req.body;

  const insert = db.prepare(`
    INSERT INTO Employees
      (
        EmployeeName,
        Email,
        MobileNumber,
        Department,
        Designation,
        JoiningDate,
        Address,
        Gender,
        Salary
      )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insert.run(
    employeeName.trim(),
    email.trim(),
    mobileNumber.trim(),
    department.trim(),
    designation.trim(),
    joiningDate,
    address?.trim() || null,
    gender?.trim() || null,
    getSalaryValue(salary)
  );

  const newEmployee = db
    .prepare("SELECT * FROM Employees WHERE Id = ?")
    .get(result.lastInsertRowid);

  return res.status(201).json({
    message: "Employee added successfully.",
    employee: newEmployee
  });
}


function updateEmployee(req, res) {
  const { id } = req.params;

  // Check whether the employee exists and is active.
  const existing = db
    .prepare(
      "SELECT * FROM Employees WHERE Id = ? AND IsDeleted = 0"
    )
    .get(id);

  if (!existing) {
    return res.status(404).json({
      message: `Employee with Id ${id} was not found.`
    });
  }

  // Apply exactly the same validation used by Add Employee.
  const validationError = validateEmployee(req.body);

  if (validationError) {
    return res.status(400).json({
      message: validationError
    });
  }

  const {
    employeeName,
    email,
    mobileNumber,
    department,
    designation,
    joiningDate,
    address,
    gender,
    salary
  } = req.body;

  db.prepare(`
    UPDATE Employees
    SET
      EmployeeName = ?,
      Email = ?,
      MobileNumber = ?,
      Department = ?,
      Designation = ?,
      JoiningDate = ?,
      Address = ?,
      Gender = ?,
      Salary = ?,
      ModifiedDate = datetime('now')
    WHERE Id = ? AND IsDeleted = 0
  `).run(
    employeeName.trim(),
    email.trim(),
    mobileNumber.trim(),
    department.trim(),
    designation.trim(),
    joiningDate,
    address?.trim() || null,
    gender?.trim() || null,
    getSalaryValue(salary),
    id
  );

  const updated = db
    .prepare(
      "SELECT * FROM Employees WHERE Id = ? AND IsDeleted = 0"
    )
    .get(id);

  return res.status(200).json({
    message: "Employee updated successfully.",
    employee: updated
  });
}

function deleteEmployee(req, res) {
  const { id } = req.params;

  const existing = db.prepare("SELECT * FROM Employees WHERE Id = ? AND IsDeleted = 0").get(id);
  if (!existing) {
    return res.status(404).json({ message: `Employee with Id ${id} was not found (or already deleted).` });
  }

  
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
