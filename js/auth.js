// Authentication check
const authToken = localStorage.getItem('authToken');
const currentUser = localStorage.getItem('currentUser');

if (!authToken || !currentUser) {
    window.location.href = 'login.html';
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
}
