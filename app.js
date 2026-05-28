const storageKey = "garage-maintenance-manager-v1";
const sessionKey = "garage-maintenance-session-v1";

const rolePermissions = {
  admin: ["manageJobs", "manageCustomers", "manageTechnicians", "manageInventory", "manageInvoices", "manageUsers", "resetData"],
  advisor: ["manageJobs", "manageCustomers", "manageInventory", "manageInvoices"],
  technician: ["manageTechnicians"]
};

const roleLabels = {
  admin: "Admin",
  advisor: "Service advisor",
  technician: "Technician"
};

const sampleData = {
  jobs: [
    {
      id: crypto.randomUUID(),
      customer: "Aisha Khan",
      vehicle: "Toyota Camry",
      plate: "D 12345",
      service: "Brake pads and rotor check",
      status: "In progress",
      due: new Date().toISOString().slice(0, 10),
      labor: 350,
      parts: 420
    },
    {
      id: crypto.randomUUID(),
      customer: "Omar Nasser",
      vehicle: "Nissan Patrol",
      plate: "A 67890",
      service: "AC diagnosis",
      status: "Waiting parts",
      due: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      labor: 180,
      parts: 0
    },
    {
      id: crypto.randomUUID(),
      customer: "Maya Santos",
      vehicle: "Honda Civic",
      plate: "B 45112",
      service: "Oil service and inspection",
      status: "Ready",
      due: new Date().toISOString().slice(0, 10),
      labor: 120,
      parts: 95
    }
  ],
  customers: [
    { id: crypto.randomUUID(), name: "Aisha Khan", phone: "+971 50 123 4567", vehicle: "Toyota Camry", plate: "D 12345" },
    { id: crypto.randomUUID(), name: "Omar Nasser", phone: "+971 55 789 3021", vehicle: "Nissan Patrol", plate: "A 67890" },
    { id: crypto.randomUUID(), name: "Maya Santos", phone: "+971 52 443 9920", vehicle: "Honda Civic", plate: "B 45112" }
  ],
  parts: [
    { id: crypto.randomUUID(), name: "Brake pads", sku: "BRK-110", qty: 4, reorder: 3, cost: 210 },
    { id: crypto.randomUUID(), name: "Engine oil 5W-30", sku: "OIL-530", qty: 18, reorder: 8, cost: 42 },
    { id: crypto.randomUUID(), name: "Cabin filter", sku: "FIL-208", qty: 2, reorder: 4, cost: 55 }
  ],
  invoices: [
    { id: crypto.randomUUID(), customer: "Maya Santos", reference: "INV-1005", amount: 215, status: "Paid" },
    { id: crypto.randomUUID(), customer: "Aisha Khan", reference: "INV-1006", amount: 770, status: "Unpaid" }
  ],
  technicians: [
    { id: crypto.randomUUID(), name: "Ravi Menon", specialty: "Diagnostics" },
    { id: crypto.randomUUID(), name: "Salim Farooq", specialty: "Mechanical" },
    { id: crypto.randomUUID(), name: "Joel D'Souza", specialty: "Electrical" }
  ],
  shifts: [
    {
      id: crypto.randomUUID(),
      technicianId: "sample-tech-closed",
      technicianName: "Ravi Menon",
      clockIn: new Date(Date.now() - 28800000).toISOString(),
      clockOut: new Date(Date.now() - 10800000).toISOString()
    }
  ],
  users: [
    { id: crypto.randomUUID(), name: "Garage Admin", username: "admin", password: "admin123", role: "admin" },
    { id: crypto.randomUUID(), name: "Service Advisor", username: "advisor", password: "advisor123", role: "advisor" },
    { id: crypto.randomUUID(), name: "Technician User", username: "tech", password: "tech123", role: "technician" }
  ]
};

let state = loadState();
let currentUser = loadSession();
let activeView = "dashboard";
let query = "";

const money = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
  maximumFractionDigits: 0
});

function loadState() {
  const saved = localStorage.getItem(storageKey);
  const loaded = saved ? JSON.parse(saved) : structuredClone(sampleData);
  loaded.technicians = loaded.technicians || structuredClone(sampleData.technicians);
  loaded.shifts = loaded.shifts || [];
  loaded.users = loaded.users || structuredClone(sampleData.users);
  return loaded;
}

function loadSession() {
  const saved = localStorage.getItem(sessionKey);
  if (!saved) return null;
  const session = JSON.parse(saved);
  return session.userId ? session : null;
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function saveSession(user) {
  currentUser = { userId: user.id };
  localStorage.setItem(sessionKey, JSON.stringify(currentUser));
}

function clearSession() {
  currentUser = null;
  localStorage.removeItem(sessionKey);
}

function getCurrentUser() {
  if (!currentUser) return null;
  return state.users.find((user) => user.id === currentUser.userId) || null;
}

function can(permission) {
  const user = getCurrentUser();
  if (!user) return false;
  return rolePermissions[user.role]?.includes(permission);
}

function requirePermission(permission) {
  return can(permission);
}

function matchesSearch(...values) {
  if (!query) return true;
  return values.join(" ").toLowerCase().includes(query.toLowerCase());
}

function statusClass(status) {
  if (status === "Waiting parts" || status === "Unpaid") return "amber";
  if (status === "Overdue") return "red";
  if (status === "Booked") return "blue";
  return "";
}

function setView(view) {
  if (view === "users" && !can("manageUsers")) view = "dashboard";
  activeView = view;
  document.querySelectorAll(".view").forEach((node) => node.classList.remove("active"));
  document.querySelector(`#${view}View`).classList.add("active");
  document.querySelectorAll(".nav-tabs button").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  document.querySelector("#viewTitle").textContent = view[0].toUpperCase() + view.slice(1);
  render();
}

function render() {
  renderAuth();
  renderMetrics();
  renderTodayJobs();
  renderLowStock();
  renderJobs();
  renderCustomers();
  renderTechnicians();
  renderParts();
  renderInvoices();
  renderUsers();
}

function renderAuth() {
  const user = getCurrentUser();
  document.body.classList.toggle("locked", !user);
  document.querySelectorAll("[data-permission]").forEach((node) => {
    node.hidden = !can(node.dataset.permission);
  });
  document.querySelector("#userChip").innerHTML = user
    ? `<strong>${user.name}</strong><span>${roleLabels[user.role]}</span>`
    : "";
  document.querySelector("#resetData").hidden = !can("resetData");
}

function renderMetrics() {
  const openJobs = state.jobs.filter((job) => job.status !== "Ready").length;
  const readyJobs = state.jobs.filter((job) => job.status === "Ready").length;
  const activeTechnicians = state.shifts.filter((shift) => !shift.clockOut).length;
  const unpaid = state.invoices
    .filter((invoice) => invoice.status !== "Paid")
    .reduce((sum, invoice) => sum + Number(invoice.amount), 0);

  document.querySelector("#metrics").innerHTML = [
    ["Open jobs", openJobs],
    ["Ready vehicles", readyJobs],
    ["Clocked in", activeTechnicians],
    ["Unpaid invoices", money.format(unpaid)]
  ]
    .map(([label, value]) => `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`)
    .join("");
}

function renderTodayJobs() {
  const today = new Date().toISOString().slice(0, 10);
  const jobs = state.jobs.filter((job) => job.due === today && matchesSearch(job.customer, job.vehicle, job.plate, job.service));
  document.querySelector("#todayJobs").innerHTML = jobs.length
    ? jobs
        .map(
          (job) => `
          <article class="timeline-item">
            <div>
              <strong>${job.service}</strong>
              <p class="meta">${job.vehicle} / ${job.plate} / ${job.customer}</p>
            </div>
            <span class="pill ${statusClass(job.status)}">${job.status}</span>
          </article>`
        )
        .join("")
    : `<div class="empty">No jobs due today.</div>`;
}

function renderLowStock() {
  const parts = state.parts.filter((part) => Number(part.qty) <= Number(part.reorder));
  document.querySelector("#lowStock").innerHTML = parts.length
    ? parts
        .map(
          (part) => `
          <article class="compact-item">
            <div>
              <strong>${part.name}</strong>
              <p class="meta">${part.sku} / reorder at ${part.reorder}</p>
            </div>
            <span class="pill red">${part.qty} left</span>
          </article>`
        )
        .join("")
    : `<div class="empty">Stock levels look good.</div>`;
}

function renderJobs() {
  const jobs = state.jobs.filter((job) => matchesSearch(job.customer, job.vehicle, job.plate, job.service, job.status));
  document.querySelector("#jobsTable").innerHTML = jobs.length
    ? jobs
        .map(
          (job) => `
        <tr>
          <td><strong>${job.service}</strong><br /><small>${job.id.slice(0, 8)}</small></td>
          <td>${job.vehicle}<br /><small>${job.plate}</small></td>
          <td>${job.customer}</td>
          <td><span class="pill ${statusClass(job.status)}">${job.status}</span></td>
          <td>${job.due}</td>
          <td>${money.format(Number(job.labor) + Number(job.parts))}</td>
          <td>
            <div class="row-actions">
              <button title="Advance status" aria-label="Advance status" data-next-job="${job.id}" ${can("manageJobs") ? "" : "disabled"}>&gt;</button>
              <button title="Delete job" aria-label="Delete job" data-delete-job="${job.id}" ${can("manageJobs") ? "" : "disabled"}>x</button>
            </div>
          </td>
        </tr>`
        )
        .join("")
    : `<tr><td colspan="7"><div class="empty">No matching jobs.</div></td></tr>`;
}

function renderCustomers() {
  const customers = state.customers.filter((customer) => matchesSearch(customer.name, customer.phone, customer.vehicle, customer.plate));
  document.querySelector("#customersGrid").innerHTML = customers.length
    ? customers
        .map(
          (customer) => `
        <article class="customer-card">
          <h3>${customer.name}</h3>
          <p class="meta">${customer.phone}</p>
          <div class="card-footer">
            <span>${customer.vehicle}</span>
            <span class="pill blue">${customer.plate}</span>
          </div>
        </article>`
        )
        .join("")
    : `<div class="empty">No matching customers.</div>`;
}

function renderTechnicians() {
  const technicians = state.technicians.filter((technician) => matchesSearch(technician.name, technician.specialty));
  document.querySelector("#techniciansGrid").innerHTML = technicians.length
    ? technicians
        .map((technician) => {
          const activeShift = getActiveShift(technician.id);
          const workedToday = getTechnicianHoursToday(technician.id);
          return `
        <article class="technician-card ${activeShift ? "clocked-in" : ""}">
          <div class="technician-status">
            <div>
              <h3>${technician.name}</h3>
              <p class="meta">${technician.specialty}</p>
            </div>
            <span class="pill ${activeShift ? "" : "blue"}">${activeShift ? "Clocked in" : "Off duty"}</span>
          </div>
          <div class="time-stack">
            <span class="meta">${activeShift ? "Current shift" : "Hours today"}</span>
            <strong>${activeShift ? formatDuration(Date.now() - new Date(activeShift.clockIn).getTime()) : formatHours(workedToday)}</strong>
            <span class="meta">${activeShift ? `Since ${formatDateTime(activeShift.clockIn)}` : "No active shift"}</span>
          </div>
          <button class="${activeShift ? "secondary" : "primary"}" data-${activeShift ? "clock-out" : "clock-in"}="${technician.id}">
            ${activeShift ? "Clock out" : "Clock in"}
          </button>
        </article>`;
        })
        .join("")
    : `<div class="empty">No matching technicians.</div>`;

  renderShifts();
}

function renderShifts() {
  const shifts = state.shifts
    .filter((shift) => matchesSearch(shift.technicianName, shift.clockOut ? "completed" : "active"))
    .slice()
    .sort((a, b) => new Date(b.clockIn) - new Date(a.clockIn));
  const totalHours = shifts.reduce((sum, shift) => sum + getShiftHours(shift), 0);
  document.querySelector("#shiftSummary").textContent = `${formatHours(totalHours)} shown`;
  document.querySelector("#shiftsTable").innerHTML = shifts.length
    ? shifts
        .map(
          (shift) => `
        <tr>
          <td><strong>${shift.technicianName}</strong></td>
          <td>${formatDateTime(shift.clockIn)}</td>
          <td>${shift.clockOut ? formatDateTime(shift.clockOut) : "Still working"}</td>
          <td>${formatHours(getShiftHours(shift))}</td>
          <td><span class="pill ${shift.clockOut ? "blue" : ""}">${shift.clockOut ? "Completed" : "Active"}</span></td>
        </tr>`
        )
        .join("")
    : `<tr><td colspan="5"><div class="empty">No matching shifts.</div></td></tr>`;
}

function renderParts() {
  const parts = state.parts.filter((part) => matchesSearch(part.name, part.sku));
  document.querySelector("#partsTable").innerHTML = parts.length
    ? parts
        .map(
          (part) => `
        <tr>
          <td><strong>${part.name}</strong></td>
          <td>${part.sku}</td>
          <td><span class="pill ${Number(part.qty) <= Number(part.reorder) ? "red" : ""}">${part.qty}</span></td>
          <td>${part.reorder}</td>
          <td>${money.format(part.cost)}</td>
          <td>
            <div class="row-actions">
              <button title="Add one" aria-label="Add one" data-add-part="${part.id}" ${can("manageInventory") ? "" : "disabled"}>+</button>
              <button title="Use one" aria-label="Use one" data-use-part="${part.id}" ${can("manageInventory") ? "" : "disabled"}>-</button>
            </div>
          </td>
        </tr>`
        )
        .join("")
    : `<tr><td colspan="6"><div class="empty">No matching parts.</div></td></tr>`;
}

function renderInvoices() {
  const invoices = state.invoices.filter((invoice) => matchesSearch(invoice.customer, invoice.reference, invoice.status));
  document.querySelector("#invoicesGrid").innerHTML = invoices.length
    ? invoices
        .map(
          (invoice) => `
        <article class="invoice-card">
          <h3>${invoice.reference}</h3>
          <p class="meta">${invoice.customer}</p>
          <div class="card-footer">
            <strong>${money.format(invoice.amount)}</strong>
            <span class="pill ${statusClass(invoice.status)}">${invoice.status}</span>
          </div>
        </article>`
        )
        .join("")
    : `<div class="empty">No matching invoices.</div>`;
}

function renderUsers() {
  const users = state.users.filter((user) => matchesSearch(user.name, user.username, roleLabels[user.role]));
  document.querySelector("#usersGrid").innerHTML = users.length
    ? users
        .map(
          (user) => `
        <article class="user-card">
          <h3>${user.name}</h3>
          <p class="meta">${user.username} / ${roleLabels[user.role]}</p>
          <div class="privilege-list">
            ${(rolePermissions[user.role] || []).map((permission) => `<span class="pill blue">${formatPermission(permission)}</span>`).join("")}
          </div>
          <div class="card-footer">
            <span class="meta">Password: ${user.password}</span>
            <button class="secondary" data-delete-user="${user.id}" ${getCurrentUser()?.id === user.id ? "disabled" : ""}>Delete</button>
          </div>
        </article>`
        )
        .join("")
    : `<div class="empty">No matching users.</div>`;
}

document.querySelector("#navTabs").addEventListener("click", (event) => {
  const button = event.target.closest("[data-view]");
  if (button) setView(button.dataset.view);
});

document.body.addEventListener("click", (event) => {
  const openButton = event.target.closest("[data-open]");
  const jumpButton = event.target.closest("[data-view-jump]");
  const nextJob = event.target.closest("[data-next-job]");
  const deleteJob = event.target.closest("[data-delete-job]");
  const addPart = event.target.closest("[data-add-part]");
  const usePart = event.target.closest("[data-use-part]");
  const clockIn = event.target.closest("[data-clock-in]");
  const clockOut = event.target.closest("[data-clock-out]");
  const deleteUser = event.target.closest("[data-delete-user]");

  if (openButton && canOpenDialog(openButton.dataset.open)) document.querySelector(`#${openButton.dataset.open}`).showModal();
  if (jumpButton) setView(jumpButton.dataset.viewJump);
  if (nextJob && requirePermission("manageJobs")) advanceJob(nextJob.dataset.nextJob);
  if (deleteJob && requirePermission("manageJobs")) deleteJobById(deleteJob.dataset.deleteJob);
  if (addPart && requirePermission("manageInventory")) adjustPart(addPart.dataset.addPart, 1);
  if (usePart && requirePermission("manageInventory")) adjustPart(usePart.dataset.usePart, -1);
  if (clockIn && requirePermission("manageTechnicians")) clockInTechnician(clockIn.dataset.clockIn);
  if (clockOut && requirePermission("manageTechnicians")) clockOutTechnician(clockOut.dataset.clockOut);
  if (deleteUser && requirePermission("manageUsers")) deleteUserById(deleteUser.dataset.deleteUser);
});

document.querySelector("#loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const user = state.users.find(
    (item) => item.username.toLowerCase() === data.username.toLowerCase() && item.password === data.password
  );
  if (!user) {
    document.querySelector("#loginError").textContent = "Invalid username or password.";
    return;
  }
  document.querySelector("#loginError").textContent = "";
  saveSession(user);
  event.currentTarget.reset();
  setView("dashboard");
});

document.querySelector("#logoutButton").addEventListener("click", () => {
  clearSession();
  render();
});

document.querySelector("#searchInput").addEventListener("input", (event) => {
  query = event.target.value.trim();
  render();
});

document.querySelector("#resetData").addEventListener("click", () => {
  if (!can("resetData")) return;
  state = structuredClone(sampleData);
  saveState();
  clearSession();
  render();
});

document.querySelector("#jobForm").addEventListener("submit", (event) => {
  if (!can("manageJobs")) return;
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  state.jobs.unshift({ id: crypto.randomUUID(), ...data, labor: Number(data.labor), parts: Number(data.parts) });
  upsertCustomer(data.customer, "", data.vehicle, data.plate);
  saveState();
  form.reset();
  render();
});

document.querySelector("#customerForm").addEventListener("submit", (event) => {
  if (!can("manageCustomers")) return;
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  upsertCustomer(data.name, data.phone, data.vehicle, data.plate);
  saveState();
  form.reset();
  render();
});

document.querySelector("#partForm").addEventListener("submit", (event) => {
  if (!can("manageInventory")) return;
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  state.parts.unshift({
    id: crypto.randomUUID(),
    name: data.name,
    sku: data.sku,
    qty: Number(data.qty),
    reorder: Number(data.reorder),
    cost: Number(data.cost)
  });
  saveState();
  form.reset();
  render();
});

document.querySelector("#technicianForm").addEventListener("submit", (event) => {
  if (!can("manageTechnicians")) return;
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  state.technicians.unshift({ id: crypto.randomUUID(), name: data.name, specialty: data.specialty });
  saveState();
  form.reset();
  render();
});

document.querySelector("#invoiceForm").addEventListener("submit", (event) => {
  if (!can("manageInvoices")) return;
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  state.invoices.unshift({ id: crypto.randomUUID(), ...data, amount: Number(data.amount) });
  saveState();
  form.reset();
  render();
});

document.querySelector("#userForm").addEventListener("submit", (event) => {
  if (!can("manageUsers")) return;
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  const usernameExists = state.users.some((user) => user.username.toLowerCase() === data.username.toLowerCase());
  if (usernameExists) return;
  state.users.unshift({
    id: crypto.randomUUID(),
    name: data.name,
    username: data.username,
    password: data.password,
    role: data.role
  });
  saveState();
  form.reset();
  render();
});

function canOpenDialog(dialogId) {
  const permissions = {
    jobDialog: "manageJobs",
    customerDialog: "manageCustomers",
    technicianDialog: "manageTechnicians",
    partDialog: "manageInventory",
    invoiceDialog: "manageInvoices",
    userDialog: "manageUsers"
  };
  return can(permissions[dialogId]);
}

function upsertCustomer(name, phone, vehicle, plate) {
  const existing = state.customers.find((customer) => customer.name.toLowerCase() === name.toLowerCase() && customer.plate === plate);
  if (existing) {
    existing.phone = phone || existing.phone;
    existing.vehicle = vehicle;
    existing.plate = plate;
    return;
  }
  state.customers.unshift({ id: crypto.randomUUID(), name, phone: phone || "Not recorded", vehicle, plate });
}

function advanceJob(id) {
  const statuses = ["Booked", "In progress", "Waiting parts", "Ready"];
  const job = state.jobs.find((item) => item.id === id);
  if (!job) return;
  const current = statuses.indexOf(job.status);
  job.status = statuses[Math.min(current + 1, statuses.length - 1)];
  saveState();
  render();
}

function deleteJobById(id) {
  state.jobs = state.jobs.filter((job) => job.id !== id);
  saveState();
  render();
}

function adjustPart(id, amount) {
  const part = state.parts.find((item) => item.id === id);
  if (!part) return;
  part.qty = Math.max(0, Number(part.qty) + amount);
  saveState();
  render();
}

function deleteUserById(id) {
  if (getCurrentUser()?.id === id) return;
  state.users = state.users.filter((user) => user.id !== id);
  saveState();
  render();
}

function getActiveShift(technicianId) {
  return state.shifts.find((shift) => shift.technicianId === technicianId && !shift.clockOut);
}

function clockInTechnician(technicianId) {
  if (getActiveShift(technicianId)) return;
  const technician = state.technicians.find((item) => item.id === technicianId);
  if (!technician) return;
  state.shifts.unshift({
    id: crypto.randomUUID(),
    technicianId,
    technicianName: technician.name,
    clockIn: new Date().toISOString(),
    clockOut: null
  });
  saveState();
  render();
}

function clockOutTechnician(technicianId) {
  const activeShift = getActiveShift(technicianId);
  if (!activeShift) return;
  activeShift.clockOut = new Date().toISOString();
  saveState();
  render();
}

function getTechnicianHoursToday(technicianId) {
  const today = new Date().toISOString().slice(0, 10);
  return state.shifts
    .filter((shift) => shift.technicianId === technicianId && shift.clockIn.slice(0, 10) === today)
    .reduce((sum, shift) => sum + getShiftHours(shift), 0);
}

function getShiftHours(shift) {
  const endTime = shift.clockOut ? new Date(shift.clockOut).getTime() : Date.now();
  return Math.max(0, (endTime - new Date(shift.clockIn).getTime()) / 3600000);
}

function formatHours(hours) {
  return `${hours.toFixed(2)} hrs`;
}

function formatDuration(milliseconds) {
  const totalMinutes = Math.max(0, Math.floor(milliseconds / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-AE", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatPermission(permission) {
  return permission
    .replace("manage", "")
    .replace("resetData", "Reset data")
    .replace(/([A-Z])/g, " $1")
    .trim();
}

render();
