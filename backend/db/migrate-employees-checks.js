const db = require("./connection");

// Check whether the migration has already been applied.
const tableInfo = db.prepare(`
  SELECT sql
  FROM sqlite_master
  WHERE type = 'table'
  AND name = 'Employees'
`).get();

if (!tableInfo) {
  console.error("Employees table does not exist.");
  db.close();
  process.exit(1);
}

const currentSchema = tableInfo.sql;

const salaryCheck = /CHECK\s*\(\s*Salary\s+IS\s+NULL\s+OR\s+Salary\s*>=\s*0\s*\)/i;

const deletedCheck = /CHECK\s*\(\s*IsDeleted\s+IN\s*\(\s*0\s*,\s*1\s*\)\s*\)/i;

if (
  salaryCheck.test(currentSchema) &&
  deletedCheck.test(currentSchema)
) {
  console.log("Required constraints already exist.");
  db.close();
  process.exit(0);
}

// Check existing data before migration.
const negativeSalaries = db.prepare(`
  SELECT Id
  FROM Employees
  WHERE Salary IS NOT NULL AND Salary < 0
`).all();

const invalidStatuses = db.prepare(`
  SELECT Id
  FROM Employees
  WHERE IsDeleted NOT IN (0, 1)
`).all();

if (negativeSalaries.length || invalidStatuses.length) {
  console.error("Migration stopped: invalid existing records found.");
  console.error("Negative salary IDs:", negativeSalaries);
  console.error("Invalid status IDs:", invalidStatuses);
  db.close();
  process.exit(1);
}

// Count existing employee records.
const beforeCount = db.prepare(`
  SELECT COUNT(*) AS count FROM Employees
`).get().count;

try {
  const migrate = db.transaction(() => {

    // Remove any leftover temporary table from an earlier attempt.
    db.exec(`
      DROP TABLE IF EXISTS Employees_new;
    `);

    // Create replacement table with constraints.
    db.exec(`
      CREATE TABLE Employees_new (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,

        EmployeeName TEXT NOT NULL,
        Email TEXT NOT NULL,
        MobileNumber TEXT NOT NULL,
        Department TEXT NOT NULL,
        Designation TEXT NOT NULL,
        JoiningDate TEXT NOT NULL,

        Address TEXT,
        Gender TEXT,

        Salary REAL
          CHECK (Salary IS NULL OR Salary >= 0),

        IsDeleted INTEGER NOT NULL DEFAULT 0
          CHECK (IsDeleted IN (0, 1)),

        CreatedDate TEXT NOT NULL DEFAULT (datetime('now')),
        ModifiedDate TEXT
      );
    `);

    // Copy all existing employee data, preserving IDs.
    db.exec(`
      INSERT INTO Employees_new (
        Id,
        EmployeeName,
        Email,
        MobileNumber,
        Department,
        Designation,
        JoiningDate,
        Address,
        Gender,
        Salary,
        IsDeleted,
        CreatedDate,
        ModifiedDate
      )
      SELECT
        Id,
        EmployeeName,
        Email,
        MobileNumber,
        Department,
        Designation,
        JoiningDate,
        Address,
        Gender,
        Salary,
        IsDeleted,
        CreatedDate,
        ModifiedDate
      FROM Employees;
    `);

    // Replace the old table.
    db.exec(`
      DROP TABLE Employees;

      ALTER TABLE Employees_new
      RENAME TO Employees;
    `);
  });

  // Execute all migration operations atomically.
  migrate();

  // Confirm that the employee count has not changed.
  const afterCount = db.prepare(`
    SELECT COUNT(*) AS count FROM Employees
  `).get().count;

  if (beforeCount !== afterCount) {
    throw new Error("Employee record count mismatch.");
  }

  console.log("Migration completed successfully.");
  console.log("Employees before migration:", beforeCount);
  console.log("Employees after migration:", afterCount);

} catch (error) {
  console.error("Migration failed:", error.message);
  console.error("The migration transaction was rolled back.");
  process.exitCode = 1;

} finally {
  db.close();
}
