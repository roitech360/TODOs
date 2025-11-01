// Check if already logged in
if (localStorage.getItem('authToken')) {
    window.location.href = 'index.html';
}

const API_URL = 'http://localhost:3000/api';

function showSignup() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
}

function showLogin() {
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
}

async function signup() {
    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;

    if (!username || !password) {
        alert('Please fill in all fields');
        return;
    }

    if (password.length < 4) {
        alert('Password must be at least 4 characters long');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Account created successfully! Please login.');
            showLogin();
            
            // Clear signup form
            document.getElementById('signupUsername').value = '';
            document.getElementById('signupPassword').value = '';
            document.getElementById('signupConfirmPassword').value = '';
        } else {
            alert(data.error || 'Signup failed');
        }
    } catch (error) {
        alert('Error connecting to server. Make sure the server is running.');
    }
}

async function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('currentUser', data.username);
            window.location.href = 'index.html';
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (error) {
        alert('Error connecting to server. Make sure the server is running.');
    }
}

// Allow Enter key to submit
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        if (!document.getElementById('loginForm').classList.contains('hidden')) {
            login();
        } else {
            signup();
        }
    }
});
