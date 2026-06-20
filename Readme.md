# GLS Safety & Compliance Sub-System

## Operational Readiness Module

This is a client-side warehouse safety checklist application built for GLS warehouse inspectors and operations teams. It is designed to support safety task tracking in warehouse zones where internet connectivity may be weak or unavailable.

The application stores shift data directly in the browser using `localStorage`, so inspectors can continue their checklist work without depending on a backend server.

---

## Features

### 1. Inspector Session Management

Inspectors can start a shift by entering a numeric Badge ID.

For this proof of concept, valid Badge IDs are from `1` to `10`.

The app first tries to verify the inspector using the JSONPlaceholder users API. If the API is unavailable, local fallback inspector data is used so the app can still continue working.

The active inspector session is stored using this localStorage key:

```text
current_inspector_v1
```

---

### 2. Baseline Checklist Loading

After a successful shift start, the app checks whether the current inspector already has saved tasks.

If no saved tasks are found for that inspector, the app loads 7 baseline safety tasks.

The app first tries to fetch baseline tasks from the JSONPlaceholder todos API. If that request fails, the app uses local fallback checklist tasks.

Example baseline tasks include:

* Verify safety locks on loading dock gates
* Inspect forklift emergency stop switches
* Check fire extinguisher pressure gauges
* Review emergency exit pathway lighting
* Confirm PPE compliance at packaging lines

---

### 3. Task Management

During an active shift, inspectors can manage their safety checklist.

Supported task actions:

* Add a new safety task
* Mark a task as completed
* Reopen a completed task as pending
* Edit task description, priority, and category
* Delete a task after confirmation
* View created and completed timestamps

Each task contains:

* Unique task ID
* Task description
* Completion status
* Created timestamp
* Completed timestamp
* Priority
* Category
* Assigned inspector ID

---

### 4. Filtering and Sorting

The checklist can be filtered by completion status, category, and priority.

Available status filters:

* All
* Pending
* Completed

Available category filters:

* Equipment Check
* Environmental Scan
* Protocol Adherence
* Emergency Prep
* Other

Available priority filters:

* High
* Medium
* Low

Available sorting options:

* Priority High to Low
* Creation Date Ascending
* Creation Date Descending
* Completion Status Pending First

The original task array is not directly sorted for display. A filtered and sorted copy is used while rendering the checklist.

---

### 5. Live Audit Trail

The app records important actions in a local audit trail.

Logged actions include:

```text
SHIFT_START
TASK_ADDED
TASK_COMPLETED
TASK_UNCOMPLETED
TASK_EDITED
TASK_DELETED
SHIFT_END
```

Each audit log entry includes:

* Timestamp
* Inspector ID
* Action type
* Task ID, if applicable
* Human-readable action details

The audit trail is saved in browser localStorage and is also included in exported reports.

---

### 6. JSON Report Export

The app supports client-side JSON report export.

Inspectors can:

* Download the current report during a shift
* End the shift and automatically export the report

The exported `.json` file contains:

* Report generation timestamp
* Current inspector details
* Saved safety tasks
* Saved audit log entries

Example filename:

```text
GLS_SafetyReport_1_2026-06-20T10-30-00-000Z.json
```

---

## localStorage Strategy

The application uses versioned localStorage keys to avoid conflicts with future schema changes.

```text
current_inspector_v1
safety_tasks_v3
audit_log_v1
```

Storage purpose:

* `current_inspector_v1`: Stores the active inspector session
* `safety_tasks_v3`: Stores safety checklist tasks
* `audit_log_v1`: Stores audit trail records

Each inspector only sees and manages the tasks assigned to their own Badge ID inside the UI.

---

## Tech Stack

This project is built with:

* HTML5
* CSS3
* Vanilla JavaScript ES2018+
* Browser localStorage

No external framework or runtime is required.

This project does not use:

* React
* Vite
* TypeScript
* Node.js
* Express.js
* MongoDB
* Tailwind CSS
* Bootstrap
* Package manager dependencies

---

## Project Structure

```text
GLS-Safety-Checklist/
│
├── index.html
├── style.css
├── script.js
├── README.md
│
└── assets/
```

---

## How to Run Locally

1. Download or clone the project.
2. Open the project folder.
3. Double-click the `index.html` file.
4. The app will run directly in the browser.

No installation is required.

---

## Demo Badge IDs

Use any Badge ID from `1` to `10`.

Example:

```text
Badge ID: 1
```

The app first tries to verify inspectors using:

```text
https://jsonplaceholder.typicode.com/users
```

If the API is unavailable, local fallback inspector data is used.

---

## Offline-First Behavior

After the app loads, task data, inspector session data, and audit logs are saved in browser localStorage.

The app can continue working during poor or unavailable connectivity because:

* Inspector fallback data is available locally
* Baseline checklist fallback data is available locally
* Checklist updates are saved immediately to localStorage
* Report export works fully on the client side
* No backend server is required for task management

---

## End Shift Behavior

When the inspector ends the shift:

1. A final `SHIFT_END` audit log entry is created.
2. A JSON report is downloaded.
3. Local checklist data is cleared from the browser.
4. The UI returns to the inactive shift state.

---

## Important Notes

* This is a client-side proof of concept.
* No real authentication server is used.
* No real backend database is used.
* No server-side file storage is used.
* Data is stored only in the browser.
* Clearing browser storage will remove saved checklist data.
* Ending the shift exports the report and clears the local checklist session.

---

## Deployment

The project can be deployed as a static website on platforms like:

* GitHub Pages
* Netlify
* Vercel

---

## Submission

Submit the following deliverables:

* [GitHub Repository URL](https://github.com/Hemant-Ballia/gls-safety-compliance-checklist)
* Live Deployment Link

---

## Purpose

Created as a proof of concept for the Global Logistics Solutions Operational Readiness Module, focused on offline safety checklist handling, local audit tracking, and client-side report export.
