CREATE DATABASE EmployeeManagementDB;
GO

USE EmployeeManagementDB;
GO

-- ---------- Users table ----------
CREATE TABLE Users (
    Id            INT IDENTITY(1,1) PRIMARY KEY,
    Username      VARCHAR(100)  NOT NULL UNIQUE,
    Email         VARCHAR(150)  NOT NULL UNIQUE,
    PasswordHash  VARCHAR(MAX)  NOT NULL,
    IsActive      BIT           NOT NULL DEFAULT 1,
    CreatedDate   DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

-- ---------- Employees table ----------
CREATE TABLE Employees (
    Id             INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeName   VARCHAR(150)  NOT NULL,
    Email          VARCHAR(150)  NOT NULL,
    MobileNumber   VARCHAR(15)   NOT NULL,
    Department     VARCHAR(100)  NOT NULL,
    Designation    VARCHAR(100)  NOT NULL,
    JoiningDate    DATE          NOT NULL,
    Address        VARCHAR(255)  NULL,
    Gender         VARCHAR(10)   NULL,
    Salary         DECIMAL(12,2) NULL
                   CHECK (Salary IS NULL OR Salary >= 0),
    IsDeleted      BIT NOT NULL DEFAULT 0
                   CHECK (IsDeleted IN (0, 1)),
    CreatedDate    DATETIME      NOT NULL DEFAULT GETDATE(),
    ModifiedDate   DATETIME      NULL
);
GO

-- ---------- Sample seed data ----------

INSERT INTO Users (Username, Email, PasswordHash, IsActive)
VALUES ('admin', 'admin@example.com', '<bcrypt-hash-generated-by-seed-script>', 1);
GO

INSERT INTO Employees (EmployeeName, Email, MobileNumber, Department, Designation, JoiningDate, Gender, Salary)
VALUES
  ('Priya Sharma', 'priya@example.com', '9876500011', 'Human Resources', 'HR Executive', '2025-06-01', 'Female', 38000),
  ('Aman Verma',   'aman@example.com',  '9876500022', 'Finance',         'Accountant',   '2024-09-12', 'Male',   42000);
GO
