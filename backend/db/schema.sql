-- ============================================================
-- Employee Management System - Database Schema (SQLite)
-- Mirrors the "Users" and "Employees" tables defined in the
-- assignment PDF. Column names/purposes are identical; only the
-- data-type *keywords* differ slightly because SQLite has a
-- simpler type system than SQL Server (see database/ems_sqlserver_schema.sql
-- for the exact SQL Server version of this same schema).
-- ============================================================

-- Users table: holds login credentials.
-- Equivalent to the PDF's "Users" table.
CREATE TABLE IF NOT EXISTS Users (
    Id            INTEGER PRIMARY KEY AUTOINCREMENT,  -- SQL Server: INT PRIMARY KEY IDENTITY
    Username      TEXT NOT NULL UNIQUE,               -- SQL Server: VARCHAR(100)
    Email         TEXT NOT NULL UNIQUE,                -- SQL Server: VARCHAR(150)
    PasswordHash  TEXT NOT NULL,                        -- SQL Server: VARCHAR(MAX)
    IsActive      INTEGER NOT NULL DEFAULT 1,           -- SQL Server: BIT (0/1)
    CreatedDate   TEXT NOT NULL DEFAULT (datetime('now')) -- SQL Server: DATETIME
);

-- Employees table: holds the actual employee records.
-- Equivalent to the PDF's "Employees" table.
CREATE TABLE IF NOT EXISTS Employees (
    Id             INTEGER PRIMARY KEY AUTOINCREMENT,
    EmployeeName   TEXT NOT NULL,
    Email          TEXT NOT NULL,
    MobileNumber   TEXT NOT NULL,
    Department     TEXT NOT NULL,
    Designation    TEXT NOT NULL,
    JoiningDate    TEXT NOT NULL,
    Address        TEXT,
    Gender         TEXT,
    Salary         REAL,
    IsDeleted      INTEGER NOT NULL DEFAULT 0,          -- 0 = Active, 1 = Deleted (Soft Delete flag)
    CreatedDate    TEXT NOT NULL DEFAULT (datetime('now')),
    ModifiedDate   TEXT
);
