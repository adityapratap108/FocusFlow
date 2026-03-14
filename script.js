let taskData = { todo: [], progress: [], done: [] };

const todo = document.querySelector("#todo");
const progress = document.querySelector("#progress");
const done = document.querySelector("#done");

let columns = [todo, progress, done];
let dragElement = null;

const toggleModalButton = document.querySelector("#toggle-modal");
const modalBg = document.querySelector(".modal .bg");
const modal = document.querySelector(".modal");
const addTaskButton = document.querySelector("#add-new-task");

/* ---------------- TASK CREATION ---------------- */
function createTaskElement(title, desc) {
    const div = document.createElement("div");
    div.classList.add("task");
    div.setAttribute("draggable", "true");

    div.innerHTML = `
        <h2>${title}</h2>
        <p>${desc}</p>
        <div class="task-actions">
            <button class="deleteBtn">Delete</button>
        </div>
    `;

    div.addEventListener("dragstart", () => {
        div.classList.add("dragging");
        dragElement = div;
    });

    div.addEventListener("dragend", () => {
        div.classList.remove("dragging");
    });

    div.querySelector(".deleteBtn").addEventListener("click", () => {
        div.remove();
        saveTasks();
    });

    return div;
}

/* ---------------- SAVE & LOAD ---------------- */
function saveTasks() {
    columns.forEach(col => {
        let tasks = col.querySelectorAll(".task");
        let count = col.querySelector(".right");

        taskData[col.id] = Array.from(tasks).map(t => ({
            title: t.querySelector("h2").innerText,
            desc: t.querySelector("p").innerText
        }));

        count.innerText = tasks.length;
    });
    localStorage.setItem("tasks", JSON.stringify(taskData));
}

function loadTasks() {
    const data = JSON.parse(localStorage.getItem("tasks"));
    if (!data) return;

    for (const colId in data) {
        const column = document.getElementById(colId);
        data[colId].forEach(task => {
            column.appendChild(createTaskElement(task.title, task.desc));
        });
        column.querySelector(".right").innerText = data[colId].length;
    }
}

/* ---------------- DRAG EVENTS ---------------- */
function dragEventsOnColumns(column) {
    column.addEventListener("dragover", (e) => {
        e.preventDefault();
        column.classList.add("hover-over");
    });

    column.addEventListener("dragleave", () => {
        column.classList.remove("hover-over");
    });

    column.addEventListener("drop", (e) => {
        e.preventDefault();
        column.classList.remove("hover-over");
        if (dragElement) {
            column.appendChild(dragElement);
            saveTasks();
        }
    });
}

/* ---------------- INITIALIZATION ---------------- */
function showDragHint() {
    if (!localStorage.getItem("hasSeenHint")) {
        const hint = document.createElement("div");
        hint.className = "drag-hint";
        hint.innerHTML = `<i class="fas fa-info-circle"></i> Tip: Drag tasks between columns!`;
        document.body.appendChild(hint);

        setTimeout(() => {
            hint.style.opacity = "0";
            setTimeout(() => hint.remove(), 1000);
            localStorage.setItem("hasSeenHint", "true");
        }, 4000);
    }
}

function init() {
    loadTasks();
    columns.forEach(col => dragEventsOnColumns(col));
    
    toggleModalButton.addEventListener("click", () => modal.classList.add("active"));
    modalBg.addEventListener("click", () => modal.classList.remove("active"));

    addTaskButton.addEventListener("click", () => {
        const title = document.querySelector("#input-task-title").value;
        const desc = document.querySelector("#input-task-desc").value;
        if (!title) return;

        todo.appendChild(createTaskElement(title, desc));
        saveTasks();
        modal.classList.remove("active");
        document.querySelector("#input-task-title").value = "";
        document.querySelector("#input-task-desc").value = "";
    });

    showDragHint();
}

init();