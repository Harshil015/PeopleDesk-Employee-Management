// js/dashboard.js
//
// Drives the employees.html page: an auth guard, loading +
// rendering the list (Task 2), the add/edit modal (Tasks 3 & 5,
// sharing one form), and the soft-delete confirmation flow (Task 6).

// ---------- Auth guard ----------
// If there's no token, there's no point rendering this page at
// all - bounce straight to login. (The REAL enforcement already
// happened server-side via requireAuth; this is just UX.)
if (!getToken()) {
  window.location.href = "index.html";
}

const currentUser = getCurrentUser();
document.getElementById("whoami").textContent = currentUser ? `Signed in as ${currentUser.username}` : "";

document.getElementById("logoutBtn").addEventListener("click", () => {
  clearSession();
  window.location.href = "index.html";
});

// ---------- State ----------
let allEmployees = []; // the full list fetched from the API, used for client-side search

// ---------- Elements ----------
const tableBody = document.getElementById("employeeTableBody");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");

const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const employeeForm = document.getElementById("employeeForm");
const formError = document.getElementById("formError");

const deleteOverlay = document.getElementById("deleteOverlay");
const deleteMessage = document.getElementById("deleteMessage");
let pendingDeleteId = null;

// ---------- Load + render (Task 2: Employee List View) ----------
async function loadEmployees() {
  try {
    allEmployees = await api.getEmployees();
    renderTable(allEmployees);
  } catch (err) {
    showToast(err.message);
  }
}

function renderTable(employees) {
  tableBody.innerHTML = "";

  if (employees.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  for (const emp of employees) {
    const tr = document.createElement("tr");

    const values = [
      emp.Id,
      emp.EmployeeName,
      emp.Email,
      emp.MobileNumber,
      emp.Department,
      emp.Designation,
      formatDate(emp.JoiningDate)
    ];

    // Create employee data cells safely.
    for (const value of values) {
      const td = document.createElement("td");
      td.textContent = value ?? "";
      tr.appendChild(td);
    }

    // Status cell.
    const statusCell = document.createElement("td");
    const statusBadge = document.createElement("span");

    statusBadge.className = "badge";
    statusBadge.textContent = "Active";

    statusCell.appendChild(statusBadge);
    tr.appendChild(statusCell);

    // Action buttons.
    const actionsCell = document.createElement("td");
    actionsCell.className = "row-actions";

    actionsCell.appendChild(
      createActionButton("View", "view", emp)
    );

    actionsCell.appendChild(
      createActionButton("Edit", "edit", emp)
    );

    actionsCell.appendChild(
      createActionButton("Delete", "delete", emp)
    );

    tr.appendChild(actionsCell);
    tableBody.appendChild(tr);
  }
}


// Safely create action buttons without injecting employee
// values into HTML strings.
function createActionButton(label, action, employee) {
  const button = document.createElement("button");

  button.type = "button";
  button.textContent = label;
  button.dataset.action = action;
  button.dataset.id = String(employee.Id);

  if (action === "view") {
    button.className = "btn btn-secondary btn-small";
  }

  if (action === "edit") {
    button.className = "btn btn-secondary btn-small";
  }

  if (action === "delete") {
    button.className = "btn btn-danger btn-small";
    button.dataset.name = employee.EmployeeName ?? "";
  }

  return button;
}

// Simple client-side search over name/department (the PDF lists
// this as an optional feature). Real filtering/pagination at scale
// would move server-side; fine for a small in-memory list here.
searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) {
    renderTable(allEmployees);
    return;
  }
  const filtered = allEmployees.filter(
    (e) => e.EmployeeName.toLowerCase().includes(query) || e.Department.toLowerCase().includes(query)
  );
  renderTable(filtered);
});

// ---------- Add / Edit modal ----------
document.getElementById("addBtn").addEventListener("click", () => openModal("add"));
document.getElementById("cancelBtn").addEventListener("click", closeModal);

function openModal(mode, employee) {
  employeeForm.reset();
  formError.classList.remove("visible");
  document.getElementById("employeeId").value = "";

  if (mode === "edit" && employee) {
    modalTitle.textContent = `Edit employee #${employee.Id}`;
    document.getElementById("employeeId").value = employee.Id;
    document.getElementById("employeeName").value = employee.EmployeeName;
    document.getElementById("email").value = employee.Email;
    document.getElementById("mobileNumber").value = employee.MobileNumber;
    document.getElementById("department").value = employee.Department;
    document.getElementById("designation").value = employee.Designation;
    document.getElementById("joiningDate").value = employee.JoiningDate;
    document.getElementById("gender").value = employee.Gender || "";
    document.getElementById("address").value = employee.Address || "";
    document.getElementById("salary").value = employee.Salary ?? "";
  } else {
    modalTitle.textContent = "Add employee";
  }

  modalOverlay.classList.add("visible");
}

function closeModal() {
  modalOverlay.classList.remove("visible");
}

// ---------- Task 4: read-only View modal ----------
const viewOverlay = document.getElementById("viewOverlay");
const viewBody = document.getElementById("viewBody");

function openViewModal(employee) {
  const rows = [
    ["Employee ID", employee.Id],
    ["Employee name", employee.EmployeeName],
    ["Email", employee.Email],
    ["Mobile number", employee.MobileNumber],
    ["Department", employee.Department],
    ["Designation", employee.Designation],
    ["Joining date", formatDate(employee.JoiningDate)],
    ["Gender", employee.Gender || "—"],
    ["Address", employee.Address || "—"],
    ["Salary", employee.Salary != null ? employee.Salary : "—"],
    ["Status", "Active"],
  ];

  viewBody.innerHTML = rows
    .map(([label, value]) => `
      <div class="view-row">
        <div class="view-label">${escapeHtml(label)}</div>
        <div class="view-value">${escapeHtml(String(value))}</div>
      </div>
    `)
    .join("");

  viewOverlay.classList.add("visible");
}

document.getElementById("closeViewBtn").addEventListener("click", () => {
  viewOverlay.classList.remove("visible");
});

// Edit button: Task 4 (GetById) feeding Task 5 (Update) -
// we re-fetch the single record by id before opening the form,
// exactly as the PDF's flow describes ("Fetch employee details
// using GetById" -> "Bind existing employee details to the form").
tableBody.addEventListener("click", async (event) => {
  const btn = event.target.closest("button[data-action]");
  if (!btn) return;
  const id = btn.dataset.id;

  // Task 4: View button - GetById, then show a READ-ONLY screen.
  // This is deliberately separate from Edit: the PDF's Employee List
  // "Action" column lists Edit / View / Delete as three distinct
  // actions, so View must not be an editable form.
  if (btn.dataset.action === "view") {
    try {
      const employee = await api.getEmployeeById(id);
      openViewModal(employee);
    } catch (err) {
      showToast(err.message);
    }
  }

  if (btn.dataset.action === "edit") {
    try {
      const employee = await api.getEmployeeById(id);
      openModal("edit", employee);
    } catch (err) {
      showToast(err.message);
    }
  }

  if (btn.dataset.action === "delete") {
    pendingDeleteId = id;
    deleteMessage.textContent = `Are you sure you want to delete "${btn.dataset.name}"?`;
    deleteOverlay.classList.add("visible");
  }
});

// ---------- Create / Update submit (Tasks 3 & 5 share one form) ----------
employeeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  formError.classList.remove("visible");

  const id = document.getElementById("employeeId").value;

  const payload = {
    employeeName: document.getElementById("employeeName").value.trim(),
    email: document.getElementById("email").value.trim(),
    mobileNumber: document.getElementById("mobileNumber").value.trim(),
    department: document.getElementById("department").value.trim(),
    designation: document.getElementById("designation").value.trim(),
    joiningDate: document.getElementById("joiningDate").value,
    gender: document.getElementById("gender").value,
    address: document.getElementById("address").value.trim(),
    salary: document.getElementById("salary").value,
  };

  try {
    if (id) {
      await api.updateEmployee(id, payload);    // Task 5: Update Employee
      showToast("Employee updated successfully.");
    } else {
      await api.addEmployee(payload);           // Task 3: Add Employee
      showToast("Employee added successfully.");
    }
    closeModal();
    await loadEmployees();                       // refresh the list, as the PDF specifies
  } catch (err) {
    formError.textContent = err.message;
    formError.classList.add("visible");
  }
});

// ---------- Soft delete confirmation (Task 6) ----------
document.getElementById("cancelDeleteBtn").addEventListener("click", () => {
  pendingDeleteId = null;
  deleteOverlay.classList.remove("visible");
});

document.getElementById("confirmDeleteBtn").addEventListener("click", async () => {
  if (!pendingDeleteId) return;
  try {
    await api.deleteEmployee(pendingDeleteId); // soft delete (IsDeleted = 1), enforced server-side
    showToast("Employee deleted.");
    deleteOverlay.classList.remove("visible");
    pendingDeleteId = null;
    await loadEmployees();
  } catch (err) {
    showToast(err.message);
  }
});

// ---------- Small helpers ----------
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function formatDate(isoDate) {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  return isNaN(d) ? isoDate : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

let toastTimer;
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2800);
}

// ---------- Init ----------
loadEmployees();
