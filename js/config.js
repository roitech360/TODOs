// API Configuration
// Automatically detects if running locally or in production

const getApiUrl = () => {
    // Check if running on localhost
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('5502')) {
        return 'http://localhost:3000/api';
    }
    
    // Production - Cloudflare Workers backend
    return 'https://todo-backend.leroi-torres2805.workers.dev/api';
};

const API_URL = getApiUrl();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_URL };
}
