// Check admin authentication
const adminToken = localStorage.getItem('adminToken');
const adminUser = localStorage.getItem('adminUser');

if (!adminToken || !adminUser) {
    window.location.href = 'admin-login.html';
}

document.getElementById('adminName').textContent = adminUser;

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = 'admin-login.html';
    }
}

// Load dashboard data
async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (response.status === 401) {
            alert('Session expired. Please login again.');
            logout();
            return;
        }

        const data = await response.json();

        if (response.ok) {
            updateStats(data.stats);
            displayUsers(data.users);
        } else {
            alert(data.error || 'Failed to load dashboard');
        }
    } catch (error) {
        console.error('Dashboard error:', error);
        alert('Failed to load dashboard data');
    }
}

// Update statistics
function updateStats(stats) {
    document.getElementById('totalUsers').textContent = stats.totalUsers;
    document.getElementById('totalTasks').textContent = stats.totalTasks;
    document.getElementById('completedTasks').textContent = stats.completedTasks;
    document.getElementById('activeTasks').textContent = stats.activeTasks;
}

// Display users
function displayUsers(users) {
    const container = document.getElementById('usersContainer');
    
    if (users.length === 0) {
        container.innerHTML = '<div class="no-data">No users found</div>';
        return;
    }

    container.innerHTML = users.map(user => `
        <div class="user-row">
            <div class="user-name">👤 ${user.username}</div>
            <div class="task-count">${user.taskCount} tasks</div>
            <div>
                <button class="view-btn" onclick="viewUserTasks('${user.username}')">View Tasks</button>
            </div>
            <div>
                <button class="delete-btn" onclick="deleteUser('${user.username}')">Delete User</button>
            </div>
        </div>
    `).join('');
}

// View user tasks
async function viewUserTasks(username) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/user/${username}/tasks`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (response.status === 401) {
            alert('Session expired. Please login again.');
            logout();
            return;
        }

        const data = await response.json();

        if (response.ok) {
            showTasksModal(username, data.tasks);
        } else {
            alert(data.error || 'Failed to load tasks');
        }
    } catch (error) {
        console.error('Load tasks error:', error);
        alert('Failed to load user tasks');
    }
}

// Show tasks modal
function showTasksModal(username, tasks) {
    document.getElementById('modalUsername').textContent = `${username}'s Tasks`;
    const container = document.getElementById('modalTasksContainer');
    
    if (tasks.length === 0) {
        container.innerHTML = '<div class="no-data">No tasks found</div>';
    } else {
        container.innerHTML = tasks.map(task => `
            <div class="task-item">
                <div class="${task.completed ? 'task-completed' : ''}" style="font-weight: 600; margin-bottom: 5px;">
                    ${task.completed ? '✓' : '○'} ${task.text}
                </div>
                ${task.date ? `<div style="font-size: 12px; color: #666;">📅 ${task.date}</div>` : ''}
                ${task.priority ? `<div style="font-size: 12px; color: #666;">Priority: ${task.priority}</div>` : ''}
                ${task.category ? `<div style="font-size: 12px; color: #666;">Category: ${task.category}</div>` : ''}
            </div>
        `).join('');
    }
    
    document.getElementById('tasksModal').style.display = 'flex';
}

// Close modal
function closeModal() {
    document.getElementById('tasksModal').style.display = 'none';
}

// Delete user
async function deleteUser(username) {
    if (!confirm(`Are you sure you want to delete user "${username}" and all their tasks?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/user/${username}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (response.status === 401) {
            alert('Session expired. Please login again.');
            logout();
            return;
        }

        const data = await response.json();

        if (response.ok) {
            alert('User deleted successfully');
            loadDashboard(); // Reload dashboard
        } else {
            alert(data.error || 'Failed to delete user');
        }
    } catch (error) {
        console.error('Delete user error:', error);
        alert('Failed to delete user');
    }
}

// Close modal when clicking outside
document.getElementById('tasksModal').addEventListener('click', (e) => {
    if (e.target.id === 'tasksModal') {
        closeModal();
    }
});

// Load dashboard on page load
loadDashboard();
