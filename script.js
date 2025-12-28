// --- DOM Elements ---
const totalTimeDisplay = document.getElementById('total-time-display');
const currentSubjectName = document.getElementById('current-subject-name');
const mainTimerDisplay = document.getElementById('main-timer-display');
const startStopButton = document.getElementById('start-stop-button');
const subjectListElement = document.getElementById('subject-list');
const newSubjectInput = document.getElementById('new-subject-input');
const addSubjectButton = document.getElementById('add-subject-button');
const taskSection = document.getElementById('task-section');
const taskListElement = document.getElementById('task-list');
const newTaskInput = document.getElementById('new-task-input');
const addTaskButton = document.getElementById('add-task-button');
const pomodoroTimerDisplay = document.getElementById('pomodoro-timer-display');
const pomodoroStartStopButton = document.getElementById('pomodoro-start-stop-button');
const pomodoroStudyMinutesInput = document.getElementById('pomodoro-study-minutes');

// Stats Elements
const toggleStatsBtn = document.getElementById('toggle-stats-btn');
const statsContainer = document.getElementById('stats-container');

// --- State Variables ---
let isSubjectTimerRunning = false;
let subjectInterval;
let currentSubjectId = null;
let studyChart = null;

let isPomodoroRunning = false;
let pomodoroInterval;
let pomodoroTimeLeft = 25 * 60;

let subjects = JSON.parse(localStorage.getItem('focusFlowSubjects')) || [];
let studyLogs = JSON.parse(localStorage.getItem('focusFlowLogs')) || {};

// --- Helper Functions ---
function save() {
    localStorage.setItem('focusFlowSubjects', JSON.stringify(subjects));
    localStorage.setItem('focusFlowLogs', JSON.stringify(studyLogs));
}

function formatTime(seconds) {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

/** Updates the total time at the top of the screen **/
function updateTotal() {
    const total = subjects.reduce((acc, s) => acc + (s.time || 0), 0);
    totalTimeDisplay.textContent = formatTime(total);
}

function logTime(subjectName, seconds) {
    const today = new Date().toISOString().split('T')[0];
    if (!studyLogs[today]) studyLogs[today] = {};
    studyLogs[today][subjectName] = (studyLogs[today][subjectName] || 0) + seconds;
    save();
}

// --- Subject Logic ---
function renderSubjects() {
    subjectListElement.innerHTML = '';
    subjects.forEach(s => {
        const div = document.createElement('div');
        div.className = `subject-item ${s.id === currentSubjectId ? 'active' : ''}`;
        div.innerHTML = `
            <div style="flex-grow: 1" onclick="selectSubject(${s.id})">
                <strong>${s.name}</strong><br><small id="list-time-${s.id}">${formatTime(s.time)}</small>
            </div>
            <button class="delete-btn" onclick="deleteSubject(${s.id})">✖</button>
        `;
        subjectListElement.appendChild(div);
    });
    updateTotal();
}

window.deleteSubject = function(id) {
    if(!confirm("Delete this subject?")) return;
    subjects = subjects.filter(s => s.id !== id);
    if (currentSubjectId === id) {
        currentSubjectId = null;
        taskSection.classList.add('hidden');
        clearInterval(subjectInterval);
        isSubjectTimerRunning = false;
        startStopButton.textContent = "Start Study";
        startStopButton.classList.remove('stop');
        mainTimerDisplay.textContent = "00:00:00";
        currentSubjectName.textContent = "No Subject Selected";
    }
    save();
    renderSubjects();
};

window.selectSubject = function(id) {
    // If a timer is running, stop it before switching
    if (isSubjectTimerRunning) {
        clearInterval(subjectInterval);
        isSubjectTimerRunning = false;
        startStopButton.textContent = "Start Study";
        startStopButton.classList.remove('stop');
    }
    
    currentSubjectId = id;
    const s = subjects.find(sub => sub.id === id);
    currentSubjectName.textContent = s.name;
    mainTimerDisplay.textContent = formatTime(s.time);
    taskSection.classList.remove('hidden');
    renderSubjects();
    renderTasks();
};

addSubjectButton.onclick = () => {
    const name = newSubjectInput.value.trim();
    if (name) {
        subjects.push({ id: Date.now(), name, time: 0, tasks: [] });
        newSubjectInput.value = '';
        save();
        renderSubjects();
    }
};

// --- Timer Logic (FIXED TOTAL TIME TRACKING) ---
startStopButton.onclick = () => {
    if (!currentSubjectId) return alert("Select a subject first!");
    
    if (isSubjectTimerRunning) {
        clearInterval(subjectInterval);
        startStopButton.textContent = "Start Study";
        startStopButton.classList.remove('stop');
    } else {
        startStopButton.textContent = "Stop Study";
        startStopButton.classList.add('stop');
        
        subjectInterval = setInterval(() => {
            const s = subjects.find(sub => sub.id === currentSubjectId);
            if (s) {
                s.time++; // Increment Subject time
                logTime(s.name, 1); // Log for Pie Chart
                
                // Update UI elements immediately
                mainTimerDisplay.textContent = formatTime(s.time);
                
                // Update specific item in the list without re-rendering everything (better performance)
                const listSmall = document.getElementById(`list-time-${s.id}`);
                if (listSmall) listSmall.textContent = formatTime(s.time);
                
                updateTotal(); // Update the big total at the top
            }
        }, 1000);
    }
    isSubjectTimerRunning = !isSubjectTimerRunning;
};

// --- Task Logic ---
function renderTasks() {
    const s = subjects.find(sub => sub.id === currentSubjectId);
    taskListElement.innerHTML = '';
    if (!s.tasks) s.tasks = [];
    s.tasks.forEach((t, index) => {
        const div = document.createElement('div');
        div.className = 'task-item';
        div.innerHTML = `<span>${t}</span><button class="delete-btn" onclick="deleteTask(${index})">✖</button>`;
        taskListElement.appendChild(div);
    });
}

window.deleteTask = function(index) {
    const s = subjects.find(sub => sub.id === currentSubjectId);
    s.tasks.splice(index, 1);
    save();
    renderTasks();
};

addTaskButton.onclick = () => {
    const text = newTaskInput.value.trim();
    if (text && currentSubjectId) {
        const s = subjects.find(sub => sub.id === currentSubjectId);
        if (!s.tasks) s.tasks = [];
        s.tasks.push(text);
        newTaskInput.value = '';
        save();
        renderTasks();
    }
};

// --- Pomodoro Logic ---
pomodoroStartStopButton.onclick = () => {
    if (isPomodoroRunning) {
        clearInterval(pomodoroInterval);
        pomodoroStartStopButton.textContent = "Start Pomodoro";
    } else {
        if (!currentSubjectId) return alert("Select a subject to attribute Pomodoro time to!");
        
        pomodoroTimeLeft = pomodoroStudyMinutesInput.value * 60;
        const initialSeconds = pomodoroTimeLeft;

        pomodoroInterval = setInterval(() => {
            pomodoroTimeLeft--;
            const m = Math.floor(pomodoroTimeLeft / 60);
            const s = pomodoroTimeLeft % 60;
            pomodoroTimerDisplay.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
            
            if (pomodoroTimeLeft <= 0) {
                clearInterval(pomodoroInterval);
                isPomodoroRunning = false;
                pomodoroStartStopButton.textContent = "Start Pomodoro";
                
                // Add pomodoro time to subject
                const sub = subjects.find(x => x.id === currentSubjectId);
                sub.time += initialSeconds;
                logTime(sub.name, initialSeconds);
                
                renderSubjects();
                alert("Pomodoro finished! Time added to " + sub.name);
            }
        }, 1000);
        pomodoroStartStopButton.textContent = "Stop";
    }
    isPomodoroRunning = !isPomodoroRunning;
};

// --- Chart/Stats ---
function renderChart() {
    const today = new Date().toISOString().split('T')[0];
    const data = studyLogs[today] || {};
    const labels = Object.keys(data);
    const values = Object.values(data).map(v => (v / 60).toFixed(2));

    if (studyChart) studyChart.destroy();
    const canvas = document.getElementById('studyChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    studyChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{ 
                data: values, 
                backgroundColor: ['#e94560', '#53538c', '#33a364', '#f1c40f', '#9b59b6', '#1abc9c'] 
            }]
        },
        options: { 
            responsive: true,
            plugins: { 
                legend: { position: 'bottom', labels: { color: '#fff', font: { family: 'Poppins' } } } 
            } 
        }
    });
}

toggleStatsBtn.onclick = () => {
    statsContainer.classList.toggle('hidden');
    if (!statsContainer.classList.contains('hidden')) renderChart();
};

// Initial Load
renderSubjects();
