// Switch between login and signup forms
function showLogin() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('signupForm').classList.add('hidden');
}

function showSignup() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
}

// Admin Login
async function adminLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminUser', data.username);
            window.location.href = 'admin-dashboard.html';
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

// Admin Signup
async function adminSignup() {
    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const adminKey = document.getElementById('adminKey').value;

    if (!username || !password || !confirmPassword || !adminKey) {
        alert('Please fill in all fields');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, adminKey })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Admin account created successfully! Please login.');
            showLogin();
            // Clear form
            document.getElementById('signupUsername').value = '';
            document.getElementById('signupPassword').value = '';
            document.getElementById('signupConfirmPassword').value = '';
            document.getElementById('adminKey').value = '';
        } else {
            alert(data.error || 'Signup failed');
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert('Signup failed. Please try again.');
    }
}

// Enter key support
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') adminLogin();
    });

    document.getElementById('adminKey').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') adminSignup();
    });
});
