// fallback data for offline mode

const FALLBACK_INSPECTORS = [
  { id: 1, name: "Leanne Graham", username: "Bret", email: "Sincere@april.biz" },
  { id: 2, name: "Ervin Howell", username: "Antonette", email: "Shanna@melissa.tv" },
  { id: 3, name: "Clementine Bauch", username: "Samantha", email: "Nathan@yesenia.net" },
  { id: 4, name: "Patricia Lebsack", username: "Karianne", email: "Julianne.OConner@kory.org" },
  { id: 5, name: "Chelsey Dietrich", username: "Kamren", email: "Lucio_Hettinger@annie.ca" },
  { id: 6, name: "Mrs. Dennis Schulist", username: "Leopoldo_Corkery", email: "Karley_Dach@jasper.info" },
  { id: 7, name: "Kurtis Weissnat", username: "Elwyn.Skiles", email: "Telly.Hoeger@billy.biz" },
  { id: 8, name: "Nicholas Runolfsdottir V", username: "Maxime_Nienow", email: "Sherwood@rosamond.me" },
  { id: 9, name: "Glenna Reichert", username: "Delphine", email: "Chaim_McDermott@dana.io" },
  { id: 10, name: "Clementina DuBuque", username: "Moriah.Stanton", email: "Rey.Padberg@karina.biz" }
];

const FALLBACK_TODOS = [
  { id: 1, title: "Verify safety locks on all loading dock gates.", completed: false },
  { id: 2, title: "Inspect fire hazard clearance zone in Zone G.", completed: false },
  { id: 3, title: "Check main forklift emergency stop switches and horn functionality.", completed: false },
  { id: 4, title: "Examine fire extinguisher pressure gauges in Sector 3.", completed: false },
  { id: 5, title: "Review emergency exit pathway lighting and clear blockage.", completed: false },
  { id: 6, title: "Verify overnight hazard log has been reviewed by supervisor.", completed: false },
  { id: 7, title: "Confirm appropriate PPE wearing compliance at packaging lines.", completed: false }
];

// localStorage keys

const TASKS_KEY = "safety_tasks_v3";
const INSPECTOR_KEY = "current_inspector_v1";
const AUDIT_KEY = "audit_log_v1";

// app state

let tasks = [];
let currentInspector = null;
let auditLog = [];
let editingTaskId = null;

// DOM elements

const inspectorIdInput = document.getElementById("inspectorIdInput");
const startShiftBtn = document.getElementById("startShiftBtn");
const currentInspectorDisplay = document.getElementById("currentInspectorDisplay");

const taskCreatorForm = document.getElementById("taskCreatorForm");
const newTaskTextInput = document.getElementById("newTaskTextInput");
const newTaskPrioritySelect = document.getElementById("newTaskPrioritySelect");
const newTaskCategorySelect = document.getElementById("newTaskCategorySelect");
const addTaskBtn = document.getElementById("addTaskBtn");

const endShiftBtn = document.getElementById("endShiftBtn");
const exportTasksBtn = document.getElementById("exportTasksBtn");

const checklist = document.getElementById("checklist");
const auditLogList = document.getElementById("auditLogList");

const pendingCountEl = document.getElementById("pendingCount");
const completedCountEl = document.getElementById("completedCount");

const filterStatus = document.getElementById("filterStatus");
const filterCategory = document.getElementById("filterCategory");
const filterPriority = document.getElementById("filterPriority");
const sortOption = document.getElementById("sortOption");

// start app

document.addEventListener("DOMContentLoaded", () => {
  loadDataFromStorage();
  setupEventListeners();
  updateUIOnAuthState();
});

// storage helpers

function safeParseFromStorage(key, fallbackValue) {
  try {
    const rawValue = localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallbackValue;
  } catch (error) {
    console.error(`Corrupt localStorage data found for key: ${key}`, error);
    localStorage.removeItem(key);
    return fallbackValue;
  }
}

function loadDataFromStorage() {
  tasks = safeParseFromStorage(TASKS_KEY, []);
  currentInspector = safeParseFromStorage(INSPECTOR_KEY, null);
  auditLog = safeParseFromStorage(AUDIT_KEY, []);

  if (!Array.isArray(tasks)) {
    tasks = [];
    localStorage.removeItem(TASKS_KEY);
  }

  if (!Array.isArray(auditLog)) {
    auditLog = [];
    localStorage.removeItem(AUDIT_KEY);
  }
}

function saveTasks() {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function saveInspector() {
  if (currentInspector) {
    localStorage.setItem(INSPECTOR_KEY, JSON.stringify(currentInspector));
  } else {
    localStorage.removeItem(INSPECTOR_KEY);
  }
}

function saveAuditLog() {
  localStorage.setItem(AUDIT_KEY, JSON.stringify(auditLog));
}

// events

function setupEventListeners() {
  startShiftBtn.addEventListener("click", handleStartShift);

  inspectorIdInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleStartShift();
    }
  });

  taskCreatorForm.addEventListener("submit", (event) => {
    event.preventDefault();
    handleAddTask();
  });

  checklist.addEventListener("change", handleChecklistChange);
  checklist.addEventListener("click", handleChecklistClick);

  filterStatus.addEventListener("change", renderTasks);
  filterCategory.addEventListener("change", renderTasks);
  filterPriority.addEventListener("change", renderTasks);
  sortOption.addEventListener("change", renderTasks);

  exportTasksBtn.addEventListener("click", handleExportReport);
  endShiftBtn.addEventListener("click", handleEndShift);
}

// UI state

function updateUIOnAuthState() {
  const isActive = Boolean(currentInspector);

  if (isActive) {
    currentInspectorDisplay.innerHTML = `
      <span class="status-online">
        ● Shift Active: ${escapeHtml(currentInspector.name)} (ID: ${currentInspector.id})
      </span>
    `;

    inspectorIdInput.value = currentInspector.id;
    inspectorIdInput.disabled = true;
    startShiftBtn.disabled = true;
    startShiftBtn.textContent = "Checked In";

    newTaskTextInput.disabled = false;
    newTaskPrioritySelect.disabled = false;
    newTaskCategorySelect.disabled = false;
    addTaskBtn.disabled = false;

    endShiftBtn.disabled = false;
    exportTasksBtn.disabled = false;

    setFilterControlsDisabled(false);

    renderTasks();
    renderAuditLogs();
    return;
  }

  currentInspectorDisplay.innerHTML = `
    <span class="status-offline">● SHIFT INACTIVE</span>
  `;

  inspectorIdInput.value = "";
  inspectorIdInput.disabled = false;
  startShiftBtn.disabled = false;
  startShiftBtn.textContent = "Start Shift";

  newTaskTextInput.value = "";
  newTaskTextInput.disabled = true;
  newTaskPrioritySelect.value = "Medium";
  newTaskPrioritySelect.disabled = true;
  newTaskCategorySelect.value = "Equipment Check";
  newTaskCategorySelect.disabled = true;
  addTaskBtn.disabled = true;

  endShiftBtn.disabled = true;
  exportTasksBtn.disabled = true;

  setFilterControlsDisabled(true);
  resetCounts();

  checklist.innerHTML = `
    <li class="checklist-notice-item">
      <span class="notice-icon" aria-hidden="true">🔐</span>
      <p>Please start your shift to view and manage safety tasks.</p>
    </li>
  `;

  renderAuditLogs();
}

function setFilterControlsDisabled(disabled) {
  filterStatus.disabled = disabled;
  filterCategory.disabled = disabled;
  filterPriority.disabled = disabled;
  sortOption.disabled = disabled;
}

function resetCounts() {
  pendingCountEl.textContent = "0";
  completedCountEl.textContent = "0";
}

// inspector session

async function handleStartShift() {
  const badgeId = inspectorIdInput.value.trim();

  if (!badgeId) {
    alert("Please enter your Badge ID.");
    return;
  }

  const badgeIdNumber = Number(badgeId);

  if (!Number.isInteger(badgeIdNumber) || badgeIdNumber <= 0) {
    alert("Badge ID must be a positive number.");
    inspectorIdInput.value = "";
    return;
  }

  startShiftBtn.disabled = true;
  startShiftBtn.textContent = "Verifying...";

  let matchedInspector = null;

  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/users");

    if (!response.ok) {
      throw new Error("Inspector API request failed.");
    }

    const users = await response.json();
    matchedInspector = users.find((user) => user.id === badgeIdNumber);
  } catch (error) {
    console.warn("Inspector API unavailable. Using local fallback registry.", error);
    matchedInspector = FALLBACK_INSPECTORS.find((user) => user.id === badgeIdNumber);
  }

  if (!matchedInspector) {
    alert("Invalid Badge ID or Inspector not found.");
    inspectorIdInput.value = "";
    startShiftBtn.disabled = false;
    startShiftBtn.textContent = "Start Shift";
    return;
  }

  currentInspector = matchedInspector;
  saveInspector();

  addAuditLog(
    "SHIFT_START",
    null,
    `Inspector ${currentInspector.name} started shift.`
  );

  const inspectorHasExistingTasks = tasks.some(
    (task) => task.assignedInspectorId === currentInspector.id
  );

  if (!inspectorHasExistingTasks) {
    await generateBaselineChecklist();
  }

  updateUIOnAuthState();
}

// baseline tasks

async function generateBaselineChecklist() {
  let baselineTodos = [];

  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/todos?_limit=7");

    if (!response.ok) {
      throw new Error("Baseline task API request failed.");
    }

    baselineTodos = await response.json();
  } catch (error) {
    console.warn("Baseline task API unavailable. Using local fallback checklist.", error);
    baselineTodos = FALLBACK_TODOS;
  }

  const baseTime = Date.now();

  const baselineTasks = baselineTodos.map((todo, index) => ({
    id: generateTaskId("baseline"),
    text: capitalizeFirstLetter(todo.title),
    isCompleted: false,
    timestampCreated: baseTime + index,
    timestampCompleted: null,
    priority: "Medium",
    category: "Equipment Check",
    assignedInspectorId: currentInspector.id
  }));

  tasks = tasks.concat(baselineTasks);
  saveTasks();

  addAuditLog(
    "TASK_ADDED",
    null,
    `Initialized ${baselineTasks.length} baseline safety tasks.`
  );
}

// task creation

function handleAddTask() {
  if (!currentInspector) {
    alert("Please start your shift before adding tasks.");
    return;
  }

  const taskText = newTaskTextInput.value.trim();

  if (!taskText) {
    alert("Please enter a description for the new safety task.");
    return;
  }

  const newTask = {
    id: generateTaskId("custom"),
    text: taskText,
    isCompleted: false,
    timestampCreated: Date.now(),
    timestampCompleted: null,
    priority: newTaskPrioritySelect.value,
    category: newTaskCategorySelect.value,
    assignedInspectorId: currentInspector.id
  };

  tasks.push(newTask);
  saveTasks();

  addAuditLog(
    "TASK_ADDED",
    newTask.id,
    `Added task: "${newTask.text}"`
  );

  newTaskTextInput.value = "";
  newTaskPrioritySelect.value = "Medium";
  newTaskCategorySelect.value = "Equipment Check";

  renderTasks();
}

// task rendering

function renderTasks() {
  if (!currentInspector) {
    return;
  }

  const inspectorTasks = tasks.filter(
    (task) => task.assignedInspectorId === currentInspector.id
  );

  const pendingCount = inspectorTasks.filter((task) => !task.isCompleted).length;
  const completedCount = inspectorTasks.filter((task) => task.isCompleted).length;

  pendingCountEl.textContent = pendingCount;
  completedCountEl.textContent = completedCount;

  let displayTasks = [...inspectorTasks];

  const selectedStatus = filterStatus.value;
  const selectedCategory = filterCategory.value;
  const selectedPriority = filterPriority.value;
  const selectedSort = sortOption.value;

  if (selectedStatus !== "All") {
    displayTasks = displayTasks.filter((task) => {
      if (selectedStatus === "Completed") return task.isCompleted;
      if (selectedStatus === "Pending") return !task.isCompleted;
      return true;
    });
  }

  if (selectedCategory !== "All") {
    displayTasks = displayTasks.filter((task) => task.category === selectedCategory);
  }

  if (selectedPriority !== "All") {
    displayTasks = displayTasks.filter((task) => task.priority === selectedPriority);
  }

  displayTasks.sort((a, b) => {
    if (selectedSort === "DateAsc") {
      return a.timestampCreated - b.timestampCreated;
    }

    if (selectedSort === "DateDesc") {
      return b.timestampCreated - a.timestampCreated;
    }

    if (selectedSort === "PendingFirst") {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }

      return a.timestampCreated - b.timestampCreated;
    }

    const priorityDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return a.timestampCreated - b.timestampCreated;
  });

  if (displayTasks.length === 0) {
    checklist.innerHTML = `
      <li class="checklist-notice-item">
        <span class="notice-icon" aria-hidden="true">📋</span>
        <p>No safety tasks match your current filters.</p>
      </li>
    `;
    return;
  }

  checklist.innerHTML = displayTasks.map((task) => {
    if (task.id === editingTaskId) {
      return renderTaskEditMode(task);
    }

    return renderTaskViewMode(task);
  }).join("");
}

function renderTaskViewMode(task) {
  const priorityClass = task.priority.toLowerCase();

  return `
    <li
      class="task-item ${task.isCompleted ? "task-completed" : ""} task-priority-${priorityClass}"
      data-task-id="${escapeHtml(task.id)}"
    >
      <div class="task-core-row">
        <div class="task-checkbox-container">
          <input
            type="checkbox"
            class="task-checkbox toggle-completed-cb"
            ${task.isCompleted ? "checked" : ""}
            ${task.assignedInspectorId !== currentInspector.id ? "disabled" : ""}
          />
        </div>

        <span class="task-text-content">${escapeHtml(task.text)}</span>
      </div>

      <div class="task-metadata-row">
        <div class="task-labels">
          <span class="badge badge-priority-${priorityClass}">
            ${escapeHtml(task.priority)}
          </span>

          <span class="badge badge-category ${getCategoryClass(task.category)}">
            ${escapeHtml(task.category)}
          </span>
        </div>

        <div class="task-timestamps">
          <span class="time-stamp">
            <strong>Created:</strong> ${formatDate(task.timestampCreated)}
          </span>

          ${task.isCompleted ? `
            <span class="time-stamp completed-time">
              <strong>Completed:</strong> ${formatDate(task.timestampCompleted)}
            </span>
          ` : ""}
        </div>
      </div>

      <div class="task-actions-row">
        <button
          type="button"
          class="btn btn-secondary btn-task-action edit-task-btn"
          data-action="edit"
        >
          Edit
        </button>

        <button
          type="button"
          class="btn btn-danger btn-task-action delete-task-btn"
          data-action="delete"
        >
          Delete
        </button>
      </div>
    </li>
  `;
}

function renderTaskEditMode(task) {
  const priorityClass = task.priority.toLowerCase();

  return `
    <li
      class="task-item ${task.isCompleted ? "task-completed" : ""} task-priority-${priorityClass}"
      data-task-id="${escapeHtml(task.id)}"
    >
      <div class="task-edit-container">
        <div class="form-group span-full">
          <label class="form-label" for="edit-text-${escapeHtml(task.id)}">
            Modify Safety Task
          </label>

          <input
            type="text"
            class="edit-input-field"
            id="edit-text-${escapeHtml(task.id)}"
            value="${escapeHtml(task.text)}"
          />
        </div>

        <div class="edit-selection-grid">
          <div class="form-group">
            <label class="form-label" for="edit-priority-${escapeHtml(task.id)}">
              Priority
            </label>

            <select class="form-select select-sm" id="edit-priority-${escapeHtml(task.id)}">
              <option value="High" ${task.priority === "High" ? "selected" : ""}>High</option>
              <option value="Medium" ${task.priority === "Medium" ? "selected" : ""}>Medium</option>
              <option value="Low" ${task.priority === "Low" ? "selected" : ""}>Low</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="edit-category-${escapeHtml(task.id)}">
              Category
            </label>

            <select class="form-select select-sm" id="edit-category-${escapeHtml(task.id)}">
              <option value="Equipment Check" ${task.category === "Equipment Check" ? "selected" : ""}>Equipment Check</option>
              <option value="Environmental Scan" ${task.category === "Environmental Scan" ? "selected" : ""}>Environmental Scan</option>
              <option value="Protocol Adherence" ${task.category === "Protocol Adherence" ? "selected" : ""}>Protocol Adherence</option>
              <option value="Emergency Prep" ${task.category === "Emergency Prep" ? "selected" : ""}>Emergency Prep</option>
              <option value="Other" ${task.category === "Other" ? "selected" : ""}>Other</option>
            </select>
          </div>
        </div>

        <div class="edit-actions-ribbon">
          <button
            type="button"
            class="btn btn-primary btn-task-action save-edit-btn"
            data-action="save-edit"
          >
            Save
          </button>

          <button
            type="button"
            class="btn btn-secondary btn-task-action cancel-edit-btn"
            data-action="cancel-edit"
          >
            Cancel
          </button>
        </div>
      </div>
    </li>
  `;
}

// checklist actions

function handleChecklistChange(event) {
  const target = event.target;

  if (!target.classList.contains("toggle-completed-cb")) {
    return;
  }

  const taskItem = target.closest(".task-item");

  if (!taskItem) {
    return;
  }

  const taskId = taskItem.dataset.taskId;
  const task = tasks.find((item) => item.id === taskId);

  if (!task || !currentInspector || task.assignedInspectorId !== currentInspector.id) {
    return;
  }

  task.isCompleted = target.checked;
  task.timestampCompleted = task.isCompleted ? Date.now() : null;

  saveTasks();

  addAuditLog(
    task.isCompleted ? "TASK_COMPLETED" : "TASK_UNCOMPLETED",
    task.id,
    `Task "${task.text}" marked as ${task.isCompleted ? "completed" : "pending"}.`
  );

  renderTasks();
}

function handleChecklistClick(event) {
  const actionButton = event.target.closest("button[data-action]");

  if (!actionButton) {
    return;
  }

  const taskItem = actionButton.closest(".task-item");

  if (!taskItem) {
    return;
  }

  const taskId = taskItem.dataset.taskId;
  const task = tasks.find((item) => item.id === taskId);

  if (!task || !currentInspector || task.assignedInspectorId !== currentInspector.id) {
    return;
  }

  const action = actionButton.dataset.action;

  if (action === "edit") {
    editingTaskId = taskId;
    renderTasks();
    return;
  }

  if (action === "cancel-edit") {
    editingTaskId = null;
    renderTasks();
    return;
  }

  if (action === "save-edit") {
    handleSaveEditedTask(taskId);
    return;
  }

  if (action === "delete") {
    handleDeleteTask(taskId);
  }
}

function handleSaveEditedTask(taskId) {
  const task = tasks.find((item) => item.id === taskId);

  if (!task) {
    return;
  }

  const textInput = document.getElementById(`edit-text-${taskId}`);
  const prioritySelect = document.getElementById(`edit-priority-${taskId}`);
  const categorySelect = document.getElementById(`edit-category-${taskId}`);

  if (!textInput || !prioritySelect || !categorySelect) {
    return;
  }

  const updatedText = textInput.value.trim();

  if (!updatedText) {
    alert("Task text cannot be empty.");
    return;
  }

  const oldText = task.text;

  task.text = updatedText;
  task.priority = prioritySelect.value;
  task.category = categorySelect.value;

  saveTasks();

  addAuditLog(
    "TASK_EDITED",
    task.id,
    `Task "${oldText}" edited to "${task.text}" (Priority: ${task.priority}, Category: ${task.category}).`
  );

  editingTaskId = null;
  renderTasks();
}

function handleDeleteTask(taskId) {
  const task = tasks.find((item) => item.id === taskId);

  if (!task) {
    return;
  }

  const confirmed = window.confirm(
    "Are you sure you want to permanently delete this task? This action cannot be undone."
  );

  if (!confirmed) {
    return;
  }

  const deletedTaskText = task.text;

  tasks = tasks.filter((item) => item.id !== taskId);
  saveTasks();

  addAuditLog(
    "TASK_DELETED",
    taskId,
    `Deleted task: "${deletedTaskText}"`
  );

  if (editingTaskId === taskId) {
    editingTaskId = null;
  }

  renderTasks();
}

// audit log

function addAuditLog(action, taskId, details) {
  const entry = {
    timestamp: Date.now(),
    inspectorId: currentInspector ? currentInspector.id : null,
    action: action,
    taskId: taskId || null,
    details: details
  };

  auditLog.push(entry);
  saveAuditLog();
  renderAuditLogs();
}

function renderAuditLogs() {
  if (!currentInspector) {
    auditLogList.innerHTML = `
      <li class="audit-placeholder">Log in to view shift-specific logs.</li>
    `;
    return;
  }

  const inspectorLogs = auditLog
    .filter((log) => log.inspectorId === currentInspector.id)
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp);

  if (inspectorLogs.length === 0) {
    auditLogList.innerHTML = `
      <li class="audit-placeholder">No active session logs found.</li>
    `;
    return;
  }

  auditLogList.innerHTML = inspectorLogs.map((log) => `
    <li class="audit-item">
      <span class="audit-time">[${formatTimeOnly(log.timestamp)}]</span>
      <span class="audit-action ${escapeHtml(log.action)}">${escapeHtml(log.action)}</span>:
      <span class="audit-text">${escapeHtml(log.details)}</span>
    </li>
  `).join("");
}

// export and end shift

function handleExportReport() {
  if (!currentInspector) {
    alert("Please start your shift before exporting a report.");
    return;
  }

  const reportPayload = buildReportPayload();

  const fileName = `GLS_SafetyReport_${currentInspector.id}_${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}.json`;

  triggerJSONDownload(reportPayload, fileName);
}

function handleEndShift() {
  if (!currentInspector) {
    return;
  }

  const confirmed = window.confirm(
    "Are you sure you want to end your shift and export all data? This will clear your local checklist."
  );

  if (!confirmed) {
    return;
  }

  addAuditLog(
    "SHIFT_END",
    null,
    `Inspector ${currentInspector.name} ended shift.`
  );

  const reportPayload = buildReportPayload();

  const fileName = `GLS_SafetyReport_${currentInspector.id}_${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}.json`;

  triggerJSONDownload(reportPayload, fileName);

  localStorage.removeItem(TASKS_KEY);
  localStorage.removeItem(INSPECTOR_KEY);
  localStorage.removeItem(AUDIT_KEY);

  tasks = [];
  currentInspector = null;
  auditLog = [];
  editingTaskId = null;

  updateUIOnAuthState();
}

function buildReportPayload() {
  return {
    generatedAt: new Date().toISOString(),
    inspector: currentInspector
      ? {
          id: currentInspector.id,
          name: currentInspector.name,
          email: currentInspector.email || ""
        }
      : null,
    tasks: tasks,
    auditLog: auditLog
  };
}

function triggerJSONDownload(data, filename) {
  try {
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const objectUrl = URL.createObjectURL(blob);

    const downloadLink = document.createElement("a");
    downloadLink.href = objectUrl;
    downloadLink.download = filename;
    downloadLink.style.display = "none";

    document.body.appendChild(downloadLink);
    downloadLink.click();

    setTimeout(() => {
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(objectUrl);
    }, 100);
  } catch (error) {
    console.error("Failed to export JSON report.", error);
    alert("Report export failed. Please check the browser console.");
  }
}

// utilities

function generateTaskId(prefix) {
  return `task-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function getPriorityWeight(priority) {
  const priorityMap = {
    High: 3,
    Medium: 2,
    Low: 1
  };

  return priorityMap[priority] || 0;
}

function getCategoryClass(category) {
  const categoryMap = {
    "Equipment Check": "cat-equipment-tag",
    "Environmental Scan": "cat-environmental-tag",
    "Protocol Adherence": "cat-protocol-tag",
    "Emergency Prep": "cat-emergency-tag",
    "Other": "cat-other-tag"
  };

  return categoryMap[category] || "cat-other-tag";
}

function formatDate(timestamp) {
  if (!timestamp) {
    return "";
  }

  const date = new Date(timestamp);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function formatTimeOnly(timestamp) {
  if (!timestamp) {
    return "";
  }

  const date = new Date(timestamp);

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

function capitalizeFirstLetter(text) {
  if (!text) {
    return "";
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function escapeHtml(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}