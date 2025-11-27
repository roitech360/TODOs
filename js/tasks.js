// Initialize page
const currentUser = localStorage.getItem('currentUser');
const authToken = localStorage.getItem('authToken');

// Set welcome message and avatar
document.getElementById('welcomeText').textContent = `Welcome, ${currentUser}!`;
document.getElementById('userAvatar').textContent = currentUser.charAt(0).toUpperCase();

let tasks = [];

// Load tasks on page load
loadTasks();

async function loadTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            tasks = await response.json();
            renderTasks();
        } else if (response.status === 401) {
            alert('Session expired. Please login again.');
            logout();
        } else {
            console.error('Failed to load tasks');
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        alert('Error loading tasks. Please try again.');
    }
}

function renderTasks() {
    const tasksList = document.getElementById('tasksList');
    const statsSection = document.getElementById('statsSection');

    if (tasks.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>No tasks yet. Add one above to get started!</p>
            </div>
        `;
        statsSection.style.display = 'none';
        return;
    }

    tasksList.innerHTML = tasks.map(task => `
        <div class="task-item">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                   onchange="toggleTask('${task.id}', this.checked)">
            <div class="task-content">
                <span class="task-text ${task.completed ? 'completed' : ''}">${escapeHtml(task.text)}</span>
                ${task.date ? `<div class="task-date">📅 ${formatDate(task.date)}</div>` : ''}
            </div>
            <div class="task-actions">
                <button class="edit-btn" onclick="editTask('${task.id}')">Edit</button>
                <button class="delete-btn" onclick="deleteTask('${task.id}')">Delete</button>
            </div>
        </div>
    `).join('');    // Update stats
    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.length - completed;
    
    document.getElementById('totalTasks').textContent = tasks.length;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('pendingTasks').textContent = pending;
    statsSection.style.display = 'flex';
}

async function addTask() {
    const taskInput = document.getElementById('taskInput');
    const taskDate = document.getElementById('taskDate');
    const taskText = taskInput.value.trim();
    const date = taskDate ? taskDate.value : null;

    console.log('Adding task:', taskText, 'with date:', date);

    if (!taskText) {
        alert('Please enter a task');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: taskText, date: date || null })
        });

        console.log('Response status:', response.status);

        if (response.ok) {
            taskInput.value = '';
            // Reset to today's date after adding task
            if (taskDate) {
                const today = new Date().toISOString().split('T')[0];
                taskDate.value = today;
            }
            await loadTasks();
            console.log('Task added successfully');
        } else if (response.status === 401) {
            alert('Session expired. Please login again.');
            logout();
        } else {
            const data = await response.json();
            console.error('Failed to add task:', data);
            alert(data.error || 'Failed to add task');
        }
    } catch (error) {
        console.error('Error adding task:', error);
        alert('Error adding task. Please try again.');
    }
}

async function toggleTask(taskId, completed) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ completed })
        });

        if (response.ok) {
            await loadTasks();
        } else if (response.status === 401) {
            alert('Session expired. Please login again.');
            logout();
        } else {
            alert('Failed to update task');
            await loadTasks(); // Reload to reset checkbox
        }
    } catch (error) {
        console.error('Error updating task:', error);
        alert('Error updating task. Please try again.');
        await loadTasks();
    }
}

async function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newText = prompt('Edit task:', task.text);
    if (!newText || newText.trim() === '') return;

    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: newText.trim() })
        });

        if (response.ok) {
            await loadTasks();
        } else if (response.status === 401) {
            alert('Session expired. Please login again.');
            logout();
        } else {
            alert('Failed to edit task');
        }
    } catch (error) {
        console.error('Error editing task:', error);
        alert('Error editing task. Please try again.');
    }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            await loadTasks();
        } else if (response.status === 401) {
            alert('Session expired. Please login again.');
            logout();
        } else {
            alert('Failed to delete task');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('Error deleting task. Please try again.');
    }
}

// Allow Enter key to add task
document.getElementById('taskInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addTask();
    }
});

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Make functions globally accessible for HTML onclick attributes
window.addTask = addTask;
window.toggleTask = toggleTask;
window.editTask = editTask;
window.deleteTask = deleteTask;

// Also add event listener for add task button
document.addEventListener('DOMContentLoaded', function() {
    const addTaskBtn = document.getElementById('addTaskBtn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', addTask);
    }
    
    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('taskDate');
    if (dateInput) {
        dateInput.value = today;
    }
});
