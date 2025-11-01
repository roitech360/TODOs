const API_URL = 'http://localhost:3000/api';
let currentResetUser = null;

// Load all users on page load
document.addEventListener('DOMContentLoaded', loadUsers);

async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/admin/users`);
        
        if (response.ok) {
            const users = await response.json();
            displayUsers(users);
        } else {
            document.getElementById('usersList').innerHTML = '<p class="empty-state">Failed to load users</p>';
        }
    } catch (error) {
        document.getElementById('usersList').innerHTML = '<p class="empty-state">Error connecting to server</p>';
    }
}

function displayUsers(users) {
    const usersList = document.getElementById('usersList');
    
    if (users.length === 0) {
        usersList.innerHTML = `
            <div class="empty-state">
                <p>No users registered yet</p>
                <p style="font-size: 0.9rem; color: #999;">Users will appear here after they sign up</p>
            </div>
        `;
        return;
    }

    usersList.innerHTML = users.map(user => `
        <div class="user-item">
            <div class="user-info">
                <h3>${user.username}</h3>
                <p>Registered user</p>
            </div>
            <div class="user-actions">
                <button class="reset-btn" onclick="openResetModal('${user.username}')">Reset Password</button>
                <button class="delete-btn" onclick="deleteUser('${user.username}')">Delete User</button>
            </div>
        </div>
    `).join('');
}

function openResetModal(username) {
    currentResetUser = username;
    document.getElementById('resetUsername').textContent = username;
    document.getElementById('newPassword').value = '';
    document.getElementById('resetModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('resetModal').classList.add('hidden');
    currentResetUser = null;
}

async function confirmReset() {
    const newPassword = document.getElementById('newPassword').value;

    if (!newPassword || newPassword.length < 4) {
        alert('Password must be at least 4 characters long');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: currentResetUser,
                newPassword: newPassword
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert(`Password reset successful for ${currentResetUser}`);
            closeModal();
        } else {
            alert(data.error || 'Failed to reset password');
        }
    } catch (error) {
        alert('Error connecting to server');
    }
}

async function deleteUser(username) {
    if (!confirm(`Are you sure you want to delete user "${username}"? This will also delete all their tasks.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/delete-user/${username}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            alert(`User "${username}" deleted successfully`);
            loadUsers(); // Reload the list
        } else {
            alert(data.error || 'Failed to delete user');
        }
    } catch (error) {
        alert('Error connecting to server');
    }
}

// Close modal when clicking outside
document.getElementById('resetModal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// Allow Enter key to submit password reset
document.getElementById('newPassword')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        confirmReset();
    }
});
