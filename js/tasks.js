// Task management functions
const API_URL = 'http://localhost:3000/api';
let allTasks = [];

async function addTask() {
    const taskInput = document.getElementById('taskInput');
    const taskdate = document.getElementById('date');
    const priority = document.getElementById('priority').value;
    const category = document.getElementById('category').value;

    if (taskInput.value.trim() === "") {
        alert("Please enter a task.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                text: taskInput.value,
                date: taskdate.value || null,
                completed: false,
                priority: priority,
                category: category
            })
        });

        if (response.ok) {
            const task = await response.json();
            allTasks.push(task);
            renderTasks();

            taskInput.value = "";
            taskdate.value = "";
            document.getElementById('priority').value = "medium";
            document.getElementById('category').value = "personal";
        } else {
            alert('Failed to add task');
        }
    } catch (error) {
        alert('Error connecting to server');
    }
}

async function updateTask(taskId, updates) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(updates)
        });

        if (response.ok) {
            // Update local task
            const taskIndex = allTasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                allTasks[taskIndex] = { ...allTasks[taskIndex], ...updates };
                renderTasks();
            }
        } else {
            alert('Failed to update task');
        }
    } catch (error) {
        alert('Error connecting to server');
    }
}

async function editTask(taskId) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;

    const newText = prompt('Edit task:', task.text);
    if (newText && newText.trim() !== '' && newText !== task.text) {
        await updateTask(taskId, { text: newText });
    }
}

async function deleteTask(taskId, listItem) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (response.ok) {
            allTasks = allTasks.filter(t => t.id !== taskId);
            renderTasks();
        } else {
            alert('Failed to delete task');
        }
    } catch (error) {
        alert('Error connecting to server');
    }
}

// Filter and search functionality
function filterTasks() {
    renderTasks();
}

function renderTasks() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filterCategory = document.getElementById('filterCategory').value;

    let filteredTasks = allTasks.filter(task => {
        const matchesSearch = task.text.toLowerCase().includes(searchTerm);
        const matchesCategory = filterCategory === 'all' || task.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';

    filteredTasks.forEach(task => {
        const listItem = createTaskElement(task);
        taskList.appendChild(listItem);
    });

    updateTaskCounter();
}

function updateTaskCounter() {
    const total = allTasks.length;
    const completed = allTasks.filter(t => t.completed).length;
    const counter = document.getElementById('taskCounter');
    counter.textContent = `${completed}/${total} tasks completed`;
}

document.addEventListener('DOMContentLoaded', loadTasks);

async function loadTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (response.ok) {
            allTasks = await response.json();
            renderTasks();
        } else {
            alert('Failed to load tasks');
        }
    } catch (error) {
        alert('Error connecting to server. Make sure the server is running.');
    }
}

function createTaskElement(task) {
    const listItem = document.createElement('li');
    listItem.dataset.taskId = task.id;
    listItem.dataset.priority = task.priority || 'medium';

    // Check if task is overdue
    if (task.date && !task.completed) {
        const taskDate = new Date(task.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (taskDate < today) {
            listItem.classList.add('overdue');
        }
    }

    const checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', async function () {
        await updateTask(task.id, { completed: this.checked });
    });

    listItem.appendChild(checkbox);

    // Task content container
    const taskContent = document.createElement('div');
    taskContent.className = 'task-content';

    const taskText = document.createElement('div');
    taskText.className = 'task-text';
    taskText.textContent = task.text;
    if (task.completed) {
        taskText.style.textDecoration = 'line-through';
        taskText.style.opacity = '0.6';
    }

    const taskMeta = document.createElement('div');
    taskMeta.className = 'task-meta';

    if (task.date) {
        const dateSpan = document.createElement('span');
        dateSpan.className = 'task-date';
        dateSpan.textContent = `📅 ${task.date}`;
        taskMeta.appendChild(dateSpan);
    }

    const categorySpan = document.createElement('span');
    categorySpan.className = `task-category ${task.category || 'personal'}`;
    categorySpan.textContent = task.category || 'personal';
    taskMeta.appendChild(categorySpan);

    const prioritySpan = document.createElement('span');
    prioritySpan.className = 'task-priority';
    const priorityIcons = { high: '🔴', medium: '🟡', low: '🟢' };
    prioritySpan.textContent = `${priorityIcons[task.priority || 'medium']} ${task.priority || 'medium'}`;
    taskMeta.appendChild(prioritySpan);

    taskContent.appendChild(taskText);
    taskContent.appendChild(taskMeta);
    listItem.appendChild(taskContent);

    // Task actions
    const taskActions = document.createElement('div');
    taskActions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.textContent = '✏️ Edit';
    editBtn.className = 'edit-btn';
    editBtn.onclick = () => editTask(task.id);
    taskActions.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️ Delete';
    deleteBtn.className = 'delete-btn';
    deleteBtn.onclick = () => {
        if (confirm('Delete this task?')) {
            deleteTask(task.id);
        }
    };
    taskActions.appendChild(deleteBtn);

    listItem.appendChild(taskActions);

    return listItem;
}
