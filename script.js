// ---------- SECTION SWITCH ----------
function showSection(section) {
    document.getElementById("leave").classList.add("hidden");
    document.getElementById("handover").classList.add("hidden");
    document.getElementById("dashboard").classList.add("hidden");

    document.getElementById(section).classList.remove("hidden");
}

// ---------- STORAGE ----------
function getData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

function setData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// ---------- LEAVE ----------
function submitLeave() {
    const name = document.getElementById("name").value;
    const start = document.getElementById("startDate").value;
    const end = document.getElementById("endDate").value;

    if (!name || !start || !end) {
        document.getElementById("leaveResult").innerText = "Please fill in all fields.";
        return;
    }

    let absences = getData("absences");

    absences.push({ name, start, end });
    setData("absences", absences);

    // Calculate how many off same period
    let count = absences.length;

    let message = "";
    if (count >= 5) {
        message = "⚠️ Low likelihood — too many people already off.";
    } else if (count >= 3) {
        message = "⚠️ Medium likelihood — limited capacity.";
    } else {
        message = "✅ High likelihood — good coverage.";
    }

    document.getElementById("leaveResult").innerText = message;
}

// ---------- TASKS ----------
function addTask() {
    const text = document.getElementById("task").value;
    const owner = document.getElementById("owner").value;
    const priority = document.getElementById("priority").value;

    if (!text || !owner) {
        alert("Fill in all fields");
        return;
    }

    let tasks = getData("tasks");

    tasks.push({
        text,
        owner,
        priority,
        done: false,
        date: new Date().toISOString()
    });

    setData("tasks", tasks);
    renderTasks();
}

function toggleTask(index) {
    let tasks = getData("tasks");
    tasks[index].done = !tasks[index].done;
    setData("tasks", tasks);
    renderTasks();
}

function renderTasks() {
    const list = document.getElementById("taskList");
    list.innerHTML = "";

    let tasks = getData("tasks");

    tasks.forEach((task, i) => {
        const li = document.createElement("li");

        li.innerHTML = `
            <strong>${task.text}</strong><br>
            Owner: ${task.owner}<br>
            Priority: ${task.priority}<br>
            Status: ${task.done ? "✅ Done" : "❌ Outstanding"}<br>
            <button onclick="toggleTask(${i})">Toggle</button>
        `;

        list.appendChild(li);
    });
}

// ---------- DASHBOARD ----------
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
            summary += `❌ ${t.text} (${t.owner})\n`;
        });
    }

    // RISK LOGIC
    if (outstanding.length >= 3) {
        summary += "\n⚠️ RISK: Multiple outstanding tasks";
    }

    if (absences.length >= 5) {
        summary += "\n⚠️ RISK: High absence level";
    }

    document.getElementById("summary").innerText = summary;
}

// ---------- LOAD ----------
renderTasks();
