const STORAGE_KEYS = {
  absences: "zclops_absences",
  handovers: "zclops_handovers"
};

document.addEventListener("DOMContentLoaded", () => {
  bindTabs();
  bindForms();
  bindButtons();
  renderAll();
});

function bindTabs() {
  const tabs = document.querySelectorAll(".nav-item");
  const pages = document.querySelectorAll(".page");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      pages.forEach(p => p.classList.remove("active"));

      tab.classList.add("active");
      document.getElementById(tab.dataset.page).classList.add("active");
      document.getElementById("pageTitle").textContent = tab.textContent.trim();
    });
  });
}

function bindForms() {
  document.getElementById("absenceForm").addEventListener("submit", event => {
    event.preventDefault();
    requestAbsence();
  });

  document.getElementById("handoverForm").addEventListener("submit", event => {
    event.preventDefault();
    submitHandover();
  });

  document.getElementById("assigneeFilter").addEventListener("input", renderAssignedTasks);
}

function bindButtons() {
  document.getElementById("checkAvailabilityBtn").addEventListener("click", checkAvailabilityOnly);
  document.getElementById("generateSummaryBtn").addEventListener("click", generateSummary);
  document.getElementById("refreshDashboardBtn").addEventListener("click", refreshDashboard);
  document.getElementById("clearAssigneeFilter").addEventListener("click", () => {
    document.getElementById("assigneeFilter").value = "";
    renderAssignedTasks();
  });
}

function getData(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

function setData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

function todayString() {
  return new Date().toISOString().split("T")[0];
}

function addDaysString(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function datesOverlap(start1, end1, start2, end2) {
  return start1 <= end2 && start2 <= end1;
}

function formatDate(value) {
  return value;
}

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getAbsenceFormValues() {
  return {
    name: document.getElementById("absenceName").value.trim(),
    start: document.getElementById("absenceStart").value,
    end: document.getElementById("absenceEnd").value
  };
}

function calculateAvailability(start, end) {
  const absences = getData(STORAGE_KEYS.absences);
  const overlappingApprovedOrPending = absences.filter(item => {
    return item.status !== "Declined" && datesOverlap(start, end, item.start, item.end);
  }).length;

  if (overlappingApprovedOrPending >= 3) {
    return {
      label: "Low chance",
      type: "danger",
      message: "⚠️ Very low chance — there are already too many people off in this period. Check other dates if possible."
    };
  }

  if (overlappingApprovedOrPending === 2) {
    return {
      label: "Medium chance",
      type: "warning",
      message: "⚠️ Medium risk — you can still request this, but it may be declined depending on coverage."
    };
  }

  return {
    label: "High chance",
    type: "success",
    message: "✅ Good chance — current absence levels suggest this request is likely to be manageable."
  };
}

function checkAvailabilityOnly() {
  const { name, start, end } = getAbsenceFormValues();

  if (!name || !start || !end) {
    setAbsenceOutcome("Please fill in all fields before checking availability.", "danger");
    return;
  }

  if (end < start) {
    setAbsenceOutcome("End date cannot be before start date.", "danger");
    return;
  }

  const result = calculateAvailability(start, end);
  setAbsenceOutcome(result.message, result.type);
}

function requestAbsence() {
  const { name, start, end } = getAbsenceFormValues();

  if (!name || !start || !end) {
    setAbsenceOutcome("Please fill in all fields before submitting the request.", "danger");
    return;
  }

  if (end < start) {
    setAbsenceOutcome("End date cannot be before start date.", "danger");
    return;
  }

  const absences = getData(STORAGE_KEYS.absences);
  const result = calculateAvailability(start, end);

  absences.push({
    id: createId(),
    name,
    start,
    end,
    availability: result.label,
    status: "Pending"
  });

  setData(STORAGE_KEYS.absences, absences);
  setAbsenceOutcome(`Request submitted. ${result.message}`, result.type);
  document.getElementById("absenceForm").reset();
  renderAll();
}

function setAbsenceOutcome(message, type) {
  const box = document.getElementById("absenceOutcome");
  box.className = `outcome ${type}`;
  box.textContent = message;
}

function setAbsenceStatus(id, status) {
  const absences = getData(STORAGE_KEYS.absences).map(item => {
    if (item.id === id) {
      return { ...item, status };
    }
    return item;
  });

  setData(STORAGE_KEYS.absences, absences);
  renderAll();
}

function deleteAbsence(id) {
  const absences = getData(STORAGE_KEYS.absences).filter(item => item.id !== id);
  setData(STORAGE_KEYS.absences, absences);
  renderAll();
}

function submitHandover() {
  const absentPerson = document.getElementById("absentPerson").value.trim();
  const task = document.getElementById("handoverTask").value.trim();
  const assignedTo = document.getElementById("assignedTo").value.trim();
  const priority = document.getElementById("handoverPriority").value;
  const dueDate = document.getElementById("handoverDue").value;

  if (!absentPerson || !task || !assignedTo || !dueDate) {
    alert("Please complete all handover fields.");
    return;
  }

  const handovers = getData(STORAGE_KEYS.handovers);
  handovers.push({
    id: createId(),
    absentPerson,
    task,
    assignedTo,
    priority,
    dueDate,
    done: false
  });

  setData(STORAGE_KEYS.handovers, handovers);
  document.getElementById("handoverForm").reset();
  renderAll();
}

function toggleHandover(id) {
  const handovers = getData(STORAGE_KEYS.handovers).map(item => {
    if (item.id === id) {
      return { ...item, done: !item.done };
    }
    return item;
  });

  setData(STORAGE_KEYS.handovers, handovers);
  renderAll();
}

function deleteHandover(id) {
  const handovers = getData(STORAGE_KEYS.handovers).filter(item => item.id !== id);
  setData(STORAGE_KEYS.handovers, handovers);
  renderAll();
}

function renderAll() {
  renderAbsences();
  renderLeaderQueue();
  renderHandovers();
  renderAssignedTasks();
  refreshDashboard();
}

function renderAbsences() {
  const absences = getData(STORAGE_KEYS.absences);
  const table = document.getElementById("absenceTable");
  const tbody = document.getElementById("absenceTableBody");
  const empty = document.getElementById("absenceEmpty");
  const count = document.getElementById("absenceCount");

  count.textContent = `${absences.length} request${absences.length === 1 ? "" : "s"}`;
  tbody.innerHTML = "";

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
      <td>${escapeHtml(item.availability)}</td>
      <td>${escapeHtml(item.status)}</td>
      <td><button class="table-action-btn" onclick="deleteAbsence('${item.id}')">Delete</button></td>
    `;
    tbody.appendChild(row);
  });
}

function renderLeaderQueue() {
  const absences = getData(STORAGE_KEYS.absences);
  const pending = absences.filter(item => item.status === "Pending");

  const table = document.getElementById("leaderTable");
  const tbody = document.getElementById("leaderTableBody");
  const empty = document.getElementById("leaderEmpty");
  const count = document.getElementById("leaderQueueCount");

  count.textContent = `${pending.length} pending`;
  tbody.innerHTML = "";

  if (pending.length === 0) {
    table.classList.add("hidden");
    empty.classList.remove("hidden");
    return;
  }

  table.classList.remove("hidden");
  empty.classList.add("hidden");

  pending.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(item.name)}</td>
      <td>${formatDate(item.start)} → ${formatDate(item.end)}</td>
      <td>${escapeHtml(item.availability)}</td>
      <td>
        <div class="decision-buttons">
          <button class="decision-btn approve" onclick="setAbsenceStatus('${item.id}', 'Approved')">Approve</button>
          <button class="decision-btn decline" onclick="setAbsenceStatus('${item.id}', 'Declined')">Decline</button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function renderHandovers() {
  const handovers = getData(STORAGE_KEYS.handovers);
  const list = document.getElementById("handoverList");
  const empty = document.getElementById("handoverEmpty");
  const count = document.getElementById("handoverCount");

  count.textContent = `${handovers.length} task${handovers.length === 1 ? "" : "s"}`;
  list.innerHTML = "";

  if (handovers.length === 0) {
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");

  handovers.forEach(item => {
    list.appendChild(createTaskCard(item, false));
  });
}

function renderAssignedTasks() {
  const handovers = getData(STORAGE_KEYS.handovers);
  const filter = document.getElementById("assigneeFilter").value.trim().toLowerCase();
  const assignedList = document.getElementById("assignedList");
  const assignedEmpty = document.getElementById("assignedEmpty");

  let filtered = [];
  if (filter) {
    filtered = handovers.filter(item => item.assignedTo.toLowerCase().includes(filter));
  }

  assignedList.innerHTML = "";

  document.getElementById("assignedOutstanding").textContent = filtered.filter(item => !item.done).length;
  document.getElementById("assignedCompleted").textContent = filtered.filter(item => item.done).length;

  if (filtered.length === 0) {
    assignedEmpty.classList.remove("hidden");
    return;
  }

  assignedEmpty.classList.add("hidden");
  filtered.forEach(item => {
    assignedList.appendChild(createTaskCard(item, true));
  });
}

function createTaskCard(item, assignedView) {
  const wrapper = document.createElement("div");
  wrapper.className = "task-card";

  const priorityClass = item.priority.toLowerCase();
  const statusClass = item.done ? "done" : "outstanding";
  const statusText = item.done ? "Done" : "Outstanding";

  wrapper.innerHTML = `
    <h4>${escapeHtml(item.task)}</h4>
    <div class="task-meta">
      Absent person: ${escapeHtml(item.absentPerson)}<br>
      Assigned to: ${escapeHtml(item.assignedTo)}<br>
      Due date: ${formatDate(item.dueDate)}
    </div>
    <div class="badges">
      <span class="badge ${priorityClass}">${item.priority} Priority</span>
      <span class="badge ${statusClass}">${statusText}</span>
    </div>
    <div class="task-actions">
      <button class="task-btn toggle" onclick="toggleHandover('${item.id}')">Toggle Done</button>
      ${assignedView ? "" : `<button class="task-btn delete" onclick="deleteHandover('${item.id}')">Delete</button>`}
    </div>
  `;

  return wrapper;
}

function refreshDashboard() {
  const { filteredAbsences, filteredHandovers } = getDashboardData();
  const completed = filteredHandovers.filter(item => item.done);
  const outstanding = filteredHandovers.filter(item => !item.done);
  const highOutstanding = outstanding.filter(item => item.priority === "High");

  document.getElementById("statAbsences").textContent = filteredAbsences.length;
  document.getElementById("statOutstanding").textContent = outstanding.length;
  document.getElementById("statCompleted").textContent = completed.length;
  document.getElementById("statHighPriority").textContent = highOutstanding.length;

  renderRiskList(filteredAbsences, outstanding, highOutstanding);
  renderBars(filteredAbsences.length, outstanding.length, completed.length, highOutstanding.length);
}

function renderBars(absences, outstanding, completed, highOutstanding) {
  const max = Math.max(absences, outstanding, completed, highOutstanding, 1);

  setBar("barAbsences", "barAbsencesValue", absences, max);
  setBar("barOutstanding", "barOutstandingValue", outstanding, max);
  setBar("barCompleted", "barCompletedValue", completed, max);
  setBar("barHighPriority", "barHighPriorityValue", highOutstanding, max);
}

function setBar(barId, valueId, value, max) {
  const width = (value / max) * 100;
  document.getElementById(barId).style.width = `${width}%`;
  document.getElementById(valueId).textContent = value;
}

function getDashboardData() {
  const absences = getData(STORAGE_KEYS.absences);
  const handovers = getData(STORAGE_KEYS.handovers);

  const timeframeType = document.getElementById("timeframeType").value;
  const customStart = document.getElementById("customStart").value;
  const customEnd = document.getElementById("customEnd").value;

  if (timeframeType === "all") {
    return { filteredAbsences: absences, filteredHandovers: handovers };
  }

  let start;
  let end;

  if (timeframeType === "today") {
    start = todayString();
    end = todayString();
  } else if (timeframeType === "7") {
    start = todayString();
    end = addDaysString(7);
  } else if (timeframeType === "21") {
    start = todayString();
    end = addDaysString(21);
  } else if (timeframeType === "custom") {
    start = customStart;
    end = customEnd;
    if (!start || !end) {
      return { filteredAbsences: [], filteredHandovers: [] };
    }
  }

  const filteredAbsences = absences.filter(item => datesOverlap(start, end, item.start, item.end));
  const filteredHandovers = handovers.filter(item => item.dueDate >= start && item.dueDate <= end);

  return { filteredAbsences, filteredHandovers };
}

function buildRisks(filteredAbsences, outstanding, highOutstanding) {
  const risks = [];

  if (filteredAbsences.length >= 4) {
    risks.push({
      type: "danger",
      title: "High absence pressure",
      text: "Absence levels are high and may affect coverage."
    });
  } else if (filteredAbsences.length >= 2) {
    risks.push({
      type: "warning",
      title: "Moderate absence pressure",
      text: "Coverage may need active planning."
    });
  }

  if (outstanding.length >= 3) {
    risks.push({
      type: "warning",
      title: "Multiple tasks outstanding",
      text: "Several handover tasks still need follow-up."
    });
  }

  if (highOutstanding.length > 0) {
    risks.push({
      type: "danger",
      title: "High priority work incomplete",
      text: `${highOutstanding.length} high-priority task(s) remain open.`
    });
  }

  const overdue = outstanding.filter(item => item.dueDate < todayString());
  if (overdue.length > 0) {
    risks.push({
      type: "danger",
      title: "Overdue handover tasks",
      text: `${overdue.length} task(s) are overdue and need chasing.`
    });
  }

  return risks;
}

function renderRiskList(filteredAbsences, outstanding, highOutstanding) {
  const riskList = document.getElementById("riskList");
  riskList.innerHTML = "";

  const risks = buildRisks(filteredAbsences, outstanding, highOutstanding);

  if (risks.length === 0) {
    riskList.innerHTML = `
      <div class="risk-card success">
        <strong>No major risks detected</strong>
        <p>Current absence and handover position looks manageable.</p>
      </div>
    `;
    return;
  }

  risks.forEach(risk => {
    const card = document.createElement("div");
    card.className = `risk-card ${risk.type}`;
    card.innerHTML = `<strong>${risk.title}</strong><p>${risk.text}</p>`;
    riskList.appendChild(card);
  });
}

function generateSummary() {
  const timeframeLabel = getTimeframeLabel();
  const { filteredAbsences, filteredHandovers } = getDashboardData();
  const completed = filteredHandovers.filter(item => item.done);
  const outstanding = filteredHandovers.filter(item => !item.done);
  const highOutstanding = outstanding.filter(item => item.priority === "High");

  let text = `=== ZCLOPS SUMMARY (${timeframeLabel}) ===\n\n`;

  text += "Absences:\n";
  if (filteredAbsences.length === 0) {
    text += "- None\n";
  } else {
    filteredAbsences.forEach(item => {
      text += `• ${item.name} (${item.start} → ${item.end}) [${item.status}]\n`;
    });
  }

  text += "\nCompleted Handover Tasks:\n";
  if (completed.length === 0) {
    text += "- None\n";
  } else {
    completed.forEach(item => {
      text += `✔ ${item.task} (${item.assignedTo})\n`;
    });
  }

  text += "\nOutstanding Handover Tasks:\n";
  if (outstanding.length === 0) {
    text += "- None\n";
  } else {
    outstanding.forEach(item => {
      text += `❌ ${item.task} (${item.assignedTo}) [${item.priority}] due ${item.dueDate}\n`;
    });
  }

  text += "\nRisk Flags:\n";
  const risks = buildRisks(filteredAbsences, outstanding, highOutstanding);
  if (risks.length === 0) {
    text += "- No major risks detected.\n";
  } else {
    risks.forEach(risk => {
      text += `⚠️ ${risk.title} — ${risk.text}\n`;
    });
  }

  document.getElementById("summaryOutput").textContent = text;
}

function getTimeframeLabel() {
  const timeframeType = document.getElementById("timeframeType").value;
  if (timeframeType === "today") return "Today";
  if (timeframeType === "7") return "Next 7 Days";
  if (timeframeType === "21") return "Next 3 Weeks";
  if (timeframeType === "all") return "All Data";
  if (timeframeType === "custom") return "Custom Range";
  return "Selected Range";
}
