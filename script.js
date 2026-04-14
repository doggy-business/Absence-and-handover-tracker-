// SECTION SWITCHING
function showSection(section) {
    document.getElementById("leave").classList.add("hidden");
    document.getElementById("handover").classList.add("hidden");
    document.getElementById("dashboard").classList.add("hidden");

    document.getElementById(section).classList.remove("hidden");
}

// FAKE DATA (simulating people already off)
let existingAbsences = 3;

// LEAVE REQUEST LOGIC
function submitLeave() {
    const name = document.getElementById("name").value;
    const start = document.getElementById("startDate").value;
    const end = document.getElementById("endDate").value;

    let message = "";

    if (!name || !start || !end) {
        message = "Please fill in all fields.";
    } else if (existingAbsences >= 4) {
        message = "⚠️ Low likelihood of approval — too many people already off. Consider another date.";
    } else if (existingAbsences >= 2) {
        message = "⚠️ Medium likelihood — several people already off. Approval may depend on coverage.";
    } else {
        message = "✅ High likelihood — low absence levels.";
    }

    document.getElementById("leaveResult").innerText = message;
}

// HANDOVER TASKS
let tasks = [];

function addTask() {
    const taskInput = document.getElementById("task").value;
    const owner = document.getElementById("owner").value;
    const priority = document.getElementById("priority").value;

    if (!taskInput || !owner) {
        alert("Please fill in task and owner.");
        return;
    }

    const task = {
        text: taskInput,
        owner: owner,
        priority: priority,
        done: false
    };

    tasks.push(task);
    renderTasks();

    document.getElementById("task").value = "";
    document.getElementById("owner").value = "";
}

function toggleTask(index) {
    tasks[index].done = !tasks[index].done;
    renderTasks();
}

function renderTasks() {
    const list = document.getElementById("taskList");
    list.innerHTML = "";

    tasks.forEach((task, index) => {
        const li = document.createElement("li");

        li.innerHTML = `
            <strong>${task.text}</strong><br>
            Owner: ${task.owner} | Priority: ${task.priority}<br>
            Status: ${task.done ? "✅ Done" : "❌ Outstanding"}<br>
            <button onclick="toggleTask(${index})">Toggle</button>
        `;

        list.appendChild(li);
    });
}

// DASHBOARD SUMMARY
function generateSummary() {
    let summary = "";

    summary += "=== DAILY SUMMARY ===\n\n";

    summary += "Absences Today: " + existingAbsences + "\n\n";

    const completed = tasks.filter(t => t.done);
    const outstanding = tasks.filter(t => !t.done);

    summary += "Completed Tasks:\n";
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

    // SIMPLE RISK FLAG
    if (outstanding.length > 2) {
        summary += "\n⚠️ Risk: Multiple outstanding tasks — follow up required.";
    }

    document.getElementById("summary").innerText = summary;
}
