function showSection(section) {
  document.getElementById("leave").classList.add("hidden");
  document.getElementById("handover").classList.add("hidden");
  document.getElementById("dashboard").classList.add("hidden");

  document.getElementById(section).classList.remove("hidden");
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
    resultBox.innerText = "Please fill in all fields.";
    resultBox.className = "result-card danger";
    return;
  }

  if (end < start) {
    resultBox.innerText = "End date cannot be before start date.";
    resultBox.className = "result-card danger";
    return;
  }

  let absences = getData("absences");

  absences.push({ name, start, end });
  setData("absences", absences);

  const overlappingAbsences = absences.filter(a => datesOverlap(start, end, a.start, a.end)).length;

  let message = "";
  let resultClass = "result-card";

  if (overlappingAbsences >= 5) {
    message = "⚠️ Low likelihood — too many people already off for this period.";
    resultClass += " danger";
  } else if (overlappingAbsences >= 3) {
    message = "⚠️ Medium likelihood — limited capacity, may depend on coverage.";
    resultClass += " warning";
  } else {
    message = "✅ High likelihood — good coverage across the selected period.";
    resultClass += " success";
  }

  resultBox.innerText = message;
  resultBox.className = resultClass;

  document.getElementById("name").value = "";
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
}

function datesOverlap(start1, end1, start2, end2) {
  return start1 <= end2 && start2 <= end1;
}

function addTask() {
  const text = document.getElementById("task").value.trim();
  const owner = document.getElementById("owner").value.trim();
  const priority = document.getElementById("priority").value;

  if (!text || !owner) {
    alert("Please fill in task and owner.");
    return;
  }

  let tasks = getData("tasks");

  tasks.push({
    text,
    owner,
    priority,
    done: false,
    createdAt: new Date().toISOString()
  });

  setData("tasks", tasks);
  renderTasks();

  document.getElementById("task").value = "";
  document.getElementById("owner").value = "";
  document.getElementById("priority").value = "Low";
}

function toggleTask(index) {
  let tasks = getData("tasks");
  tasks[index].done = !tasks[index].done;
  setData("tasks", tasks);
  renderTasks();
}

function renderTasks() {
  const list = document.getElementById("taskList");
  if (!list) return;

  list.innerHTML = "";

  let tasks = getData("tasks");

  if (tasks.length === 0) {
    list.innerHTML = `
      <li>
        <strong>No handover tasks yet</strong>
        <div class="task-meta">Add a task to start building the handover view.</div>
      </li>
    `;
    return;
  }

  tasks.forEach((task, i) => {
    const li = document.createElement("li");

    const priorityClass = task.priority.toLowerCase();
    const statusClass = task.done ? "done" : "outstanding";
    const statusText = task.done ? "Done" : "Outstanding";

    li.innerHTML = `
      <strong>${escapeHtml(task.text)}</strong>
      <div class="task-meta">Owner: ${escapeHtml(task.owner)}</div>
      <div class="task-status-row">
        <span class="badge ${priorityClass}">${task.priority} Priority</span>
        <span class="badge ${statusClass}">${statusText}</span>
      </div>
      <button onclick="toggleTask(${i})">Toggle Status</button>
    `;

    list.appendChild(li);
  });
}

function generateSummary() {
  let absences = getData("absences");
  let tasks = getData("tasks");

  let summary = "=== DAILY SUMMARY ===\n\n";

  summary += "Absences:\n";
  if (absences.length === 0) {
    summary += "- None\n";
  } else {
    absences.forEach(a => {
      summary += `• ${a.name} (${a.start} → ${a.end})\n`;
    });
  }

  const completed = tasks.filter(t => t.done);
  const outstanding = tasks.filter(t => !t.done);
  const highOutstanding = outstanding.filter(t => t.priority === "High");

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
  let risks = [];

  if (outstanding.length >= 3) {
    risks.push("Multiple outstanding tasks need follow-up.");
  }

  if (absences.length >= 5) {
    risks.push("High absence level may impact team coverage.");
  }

  if (highOutstanding.length > 0) {
    risks.push(`${highOutstanding.length} high-priority task(s) still outstanding.`);
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

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

renderTasks();
