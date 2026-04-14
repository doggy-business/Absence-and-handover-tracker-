const STORAGE_KEYS = {
  absences: "zclops_absences",
  tasks: "zclops_tasks"
};

document.addEventListener("DOMContentLoaded", () => {
  bindNavigation();
  bindActions();
  renderAll();
});

function bindNavigation() {
  const navButtons = document.querySelectorAll(".nav-btn");

  navButtons.forEach(button => {
    button.addEventListener("click", () => {
      navButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");

      const target = button.dataset.target;
      showSection(target);
      document.getElementById("pageTitle").innerText = button.innerText.trim();
    });
  });
}

function bindActions() {
  document.getElementById("submitLeaveBtn").addEventListener("click", submitLeave);
  document.getElementById("addTaskBtn").addEventListener("click", addTask);
  document.getElementById("generateSummaryBtn").addEventListener("click", generateSummary);
  document.getElementById("refreshDashboardBtn").addEventListener("click", refreshDashboard);
  document.getElementById("seedDataBtn").addEventListener("click", seedDemoData);
  document.getElementById("clearDataBtn").addEventListener("click", clearAllData);
}

function showSection(sectionId) {
  document.querySelectorAll(".content-section").forEach(section => {
    section.classList.add("hidden");
  });

  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.remove("hidden");
  }
}

function getData(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

function setData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function submitLeave() {
  const name = document.getElementById("name").value.trim();
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;
  const resultBox = document.getElementById("leaveResult");

  if (!name || !start || !end) {
    setLeaveResult("Please fill in all fields.", "danger");
    return;
  }

  if (end < start) {
    setLeaveResult("End date cannot be before start date.", "danger");
    return;
  }

  const absences = getData(STORAGE_KEYS.absences);
  const overlappingCount = absences.filter(a => datesOverlap(start, end, a.start, a.end)).length;

  let impact = "High likelihood";
  let resultType = "success";
  let message = "✅ High likelihood — good coverage across the selected period.";

  if (overlappingCount >= 4) {
    impact = "Low likelihood";
    resultType = "danger";
    message = "⚠️ Low likelihood — too many people already off for this period.";
  } else if (overlappingCount >= 2) {
    impact = "Medium likelihood";
    resultType = "warning";
    message = "⚠️ Medium likelihood — limited capacity, may depend on coverage.";
  }

  absences.push({
    id: createId(),
    name,
    start,
    end,
    impact
  });

  setData(STORAGE_KEYS.absences, absences);
  setLeaveResult(message, resultType);

  document.getElementById("name").value = "";
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";

  renderAll();
}

function setLeaveResult(message, type) {
  const resultBox = document.getElementById("leaveResult");
  resultBox.innerText = message;
  resultBox.className = `result-card ${type}`;
}

function addTask() {
  const absentPerson = document.getElementById("handoverOwner").value.trim();
  const text = document.getElementById("task").value.trim();
  const owner = document.getElementById("owner").value.trim();
  const priority = document.getElementById("priority").value;

  if (!absentPerson || !text || !owner) {
    alert("Please fill in absent person, task, and assigned owner.");
    return;
  }

  const tasks = getData(STORAGE_KEYS.tasks);

  tasks.push({
    id: createId(),
    absentPerson,
    text,
    owner,
    priority,
    done: false,
    createdAt: new Date().toISOString()
  });

  setData(STORAGE_KEYS.tasks, tasks);

  document.getElementById("handoverOwner").value = "";
  document.getElementById("task").value = "";
  document.getElementById("owner").value = "";
  document.getElementById("priority").value = "Low";

  renderAll();
}

function toggleTask(id) {
  const tasks = getData(STORAGE_KEYS.tasks).map(task => {
    if (task.id === id) {
      return { ...task, done: !task.done };
    }
    return task;
  });

  setData(STORAGE_KEYS.tasks, tasks);
  renderAll();
}

function deleteTask(id) {
  const tasks = getData(STORAGE_KEYS.tasks).filter(task => task.id !== id);
  setData(STORAGE_KEYS.tasks, tasks);
  renderAll();
}

function deleteLeave(id) {
  const absences = getData(STORAGE_KEYS.absences).filter(item => item.id !== id);
  setData(STORAGE_KEYS.absences, absences);
  renderAll();
}

function renderAll() {
  renderLeaveTable();
  renderTasks();
  renderMiniTaskStats();
  refreshDashboard();
}

function renderLeaveTable() {
  const absences = getData(STORAGE_KEYS.absences);
  const tbody = document.getElementById("leaveTableBody");
  const table = document.getElementById("leaveTable");
  const empty = document.getElementById("leaveEmptyState");
  const tag = document.getElementById("leaveCountTag");

  tbody.innerHTML = "";
  tag.innerText = `${absences.length} request${absences.length === 1 ? "" : "s"}`;

  if (absences.length === 0) {
    table.classList.add("hidden");
    empty.classList.remove("hidden");
    return;
  }

  table.classList.remove("hidden");
  empty.classList.add("hidden");

  absences.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(item.name)}</td>
      <td>${formatDate(item.start)}</td>
      <td>${formatDate(item.end)}</td>
      <td>${escapeHtml(item.impact)}</td>
      <td>
        <button class="table-action-btn" onclick="deleteLeave('${item.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function renderTasks() {
  const tasks = getData(STORAGE_KEYS.tasks);
  const list = document.getElementById("taskList");
  const empty = document.getElementById("taskEmptyState");
  const tag = document.getElementById("taskCountTag");

  list.innerHTML = "";
  tag.innerText = `${tasks.length} task${tasks.length === 1 ? "" : "s"}`;

  if (tasks.length === 0) {
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");

  tasks.forEach(task => {
    const li = document.createElement("li");

    const priorityClass = task.priority.toLowerCase();
    const statusClass = task.done ? "done" : "outstanding";
    const statusText = task.done ? "Done" : "Outstanding";

    li.innerHTML = `
      <strong>${escapeHtml(task.text)}</strong>
      <div class="task-meta">Absent: ${escapeHtml(task.absentPerson)} · Assigned to: ${escapeHtml(task.owner)}</div>
      <div class="task-status-row">
        <span class="badge ${priorityClass}">${task.priority} Priority</span>
        <span class="badge ${statusClass}">${statusText}</span>
      </div>
      <div class="task-actions">
        <button class="task-btn toggle" onclick="toggleTask('${task.id}')">Toggle Status</button>
        <button class="task-btn delete" onclick="deleteTask('${task.id}')">Delete</button>
      </div>
    `;

    list.appendChild(li);
  });
}

function renderMiniTaskStats() {
  const tasks = getData(STORAGE_KEYS.tasks);
  const completed = tasks.filter(t => t.done).length;
  const outstanding = tasks.filter(t => !t.done).length;
  const highOutstanding = tasks.filter(t => !t.done && t.priority === "High").length;

  document.getElementById("miniCompleted").innerText = completed;
  document.getElementById("miniOutstanding").innerText = outstanding;
  document.getElementById("miniHighPriority").innerText = highOutstanding;
}

function refreshDashboard() {
  const absences = getData(STORAGE_KEYS.absences);
  const tasks = getData(STORAGE_KEYS.tasks);

  const completed = tasks.filter(t => t.done);
  const outstanding = tasks.filter(t => !t.done);
  const highOutstanding = outstanding.filter(t => t.priority === "High");

  document.getElementById("statAbsences").innerText = absences.length;
  document.getElementById("statOutstanding").innerText = outstanding.length;
  document.getElementById("statCompleted").innerText = completed.length;
  document.getElementById("statHighPriority").innerText = highOutstanding.length;

  const riskCards = document.getElementById("riskCards");
  riskCards.innerHTML = "";

  const risks = [];

  if (absences.length >= 5) {
    risks.push({
      type: "danger",
      title: "High absence level",
      text: "Absence volume is high and may affect team coverage."
    });
  } else if (absences.length >= 3) {
    risks.push({
      type: "warning",
      title: "Moderate absence pressure",
      text: "Current absence levels may need careful planning."
    });
  }

  if (outstanding.length >= 3) {
    risks.push({
      type: "warning",
      title: "Multiple outstanding handover tasks",
      text: "Several tasks still need follow-up."
    });
  }

  if (highOutstanding.length > 0) {
    risks.push({
      type: "danger",
      title: "High-priority work outstanding",
      text: `${highOutstanding.length} high-priority task(s) remain incomplete.`
    });
  }

  if (risks.length === 0) {
    risks.push({
      type: "success",
      title: "No major risks detected",
      text: "Current absence and handover position looks under control."
    });
  }

  risks.forEach(risk => {
    const card = document.createElement("div");
    card.className = `risk-card ${risk.type}`;
    card.innerHTML = `
      <div class="risk-title">${risk.title}</div>
      <div class="risk-text">${risk.text}</div>
    `;
    riskCards.appendChild(card);
  });
}

function generateSummary() {
  const absences = getData(STORAGE_KEYS.absences);
  const tasks = getData(STORAGE_KEYS.tasks);

  const completed = tasks.filter(t => t.done);
  const outstanding = tasks.filter(t => !t.done);
  const highOutstanding = outstanding.filter(t => t.priority === "High");

  let summary = "=== ZCLOPS DAILY SUMMARY ===\n\n";

  summary += "Absences:\n";
  if (absences.length === 0) {
    summary += "- None\n";
  } else {
    absences.forEach(a => {
      summary += `• ${a.name} (${a.start} → ${a.end})\n`;
    });
  }

  summary += "\nCompleted Tasks:\n";
  if (completed.length === 0) {
    summary += "- None\n";
  } else {
    completed.forEach(t => {
      summary += `✔ ${t.text} (${t.owner})\n`;
    });
  }

  summary += "\nOutstanding Tasks:\n";
  if (outstanding.length === 0) {
    summary += "- None\n";
  } else {
    outstanding.forEach(t => {
      summary += `❌ ${t.text} (${t.owner}) [${t.priority}]\n`;
    });
  }

  summary += "\nRisk Flags:\n";
  const risks = [];

  if (absences.length >= 5) {
    risks.push("High absence level may impact team coverage.");
  }
  if (outstanding.length >= 3) {
    risks.push("Multiple outstanding handover tasks need follow-up.");
  }
  if (highOutstanding.length > 0) {
    risks.push(`${highOutstanding.length} high-priority task(s) remain incomplete.`);
  }

  if (risks.length === 0) {
    summary += "- No major risks detected.\n";
  } else {
    risks.forEach(risk => {
      summary += `⚠️ ${risk}\n`;
    });
  }

  document.getElementById("summary").innerText = summary;
}

function seedDemoData() {
  const absences = [
    { id: createId(), name: "Amy", start: "2026-04-20", end: "2026-04-22", impact: "Medium likelihood" },
    { id: createId(), name: "Lexy", start: "2026-04-21", end: "2026-04-25", impact: "Medium likelihood" },
    { id: createId(), name: "Tasha", start: "2026-04-23", end: "2026-04-24", impact: "High likelihood" }
  ];

  const tasks = [
    { id: createId(), absentPerson: "Amy", text: "Follow up on complaint case", owner: "Jamie", priority: "High", done: false, createdAt: new Date().toISOString() },
    { id: createId(), absentPerson: "Lexy", text: "Check charger install update", owner: "Chris", priority: "Medium", done: true, createdAt: new Date().toISOString() },
    { id: createId(), absentPerson: "Tasha", text: "Send customer callback email", owner: "Emma", priority: "Low", done: false, createdAt: new Date().toISOString() }
  ];

  setData(STORAGE_KEYS.absences, absences);
  setData(STORAGE_KEYS.tasks, tasks);
  renderAll();
  generateSummary();
  setLeaveResult("Demo data loaded successfully.", "success");
}

function clearAllData() {
  const confirmed = confirm("Clear all leave requests and handover tasks?");
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEYS.absences);
  localStorage.removeItem(STORAGE_KEYS.tasks);

  document.getElementById("summary").innerText = "No summary generated yet.";
  setLeaveResult("No request checked yet.", "neutral");
  renderAll();
}

function datesOverlap(start1, end1, start2, end2) {
  return start1 <= end2 && start2 <= end1;
}

function formatDate(dateString) {
  return dateString;
}

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
