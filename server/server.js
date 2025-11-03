const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key-change-this-in-production';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    ['http://localhost:5502', 'http://127.0.0.1:5502'];

// Security Middleware
app.use(helmet());

// Rate limiting - prevent brute force attacks
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Stricter rate limit for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login attempts per 15 minutes
    message: 'Too many login attempts, please try again later.'
});

// CORS Middleware
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (ALLOWED_ORIGINS.indexOf(origin) === -1) {
            return callback(new Error('Not allowed by CORS'), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json());

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

// Ensure data directory and files exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({}));
}
if (!fs.existsSync(TASKS_FILE)) {
    fs.writeFileSync(TASKS_FILE, JSON.stringify({}));
}

// Helper functions
const readUsers = () => JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
const writeUsers = (users) => fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
const readTasks = () => JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
const writeTasks = (tasks) => fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// ========== AUTHENTICATION ROUTES ==========

// Signup route
app.post('/api/signup', authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        if (password.length < 4) {
            return res.status(400).json({ error: 'Password must be at least 4 characters' });
        }

        const users = readUsers();

        if (users[username]) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        users[username] = { password: hashedPassword };
        writeUsers(users);

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login route
app.post('/api/login', authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const users = readUsers();

        if (!users[username]) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Compare password
        const validPassword = await bcrypt.compare(password, users[username].password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '24h' });

        res.json({ token, username });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ========== TASK ROUTES ==========

// Get all tasks for authenticated user
app.get('/api/tasks', authenticateToken, (req, res) => {
    try {
        const tasks = readTasks();
        const userTasks = tasks[req.user.username] || [];
        res.json(userTasks);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Add a new task
app.post('/api/tasks', authenticateToken, (req, res) => {
    try {
        const { text, date, completed, priority, category, notes, recurrence } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Task text required' });
        }

        const tasks = readTasks();
        if (!tasks[req.user.username]) {
            tasks[req.user.username] = [];
        }

        const newTask = {
            id: Date.now(),
            text,
            date: date || null,
            completed: completed || false,
            priority: priority || 'medium',
            category: category || 'personal',
            notes: notes || null,
            recurrence: recurrence || 'none'
        };

        tasks[req.user.username].push(newTask);
        writeTasks(tasks);

        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update a task
app.put('/api/tasks/:id', authenticateToken, (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const { text, date, completed, priority, category, notes, recurrence } = req.body;

        const tasks = readTasks();
        const userTasks = tasks[req.user.username] || [];

        const taskIndex = userTasks.findIndex(task => task.id === taskId);

        if (taskIndex === -1) {
            return res.status(404).json({ error: 'Task not found' });
        }

        userTasks[taskIndex] = {
            ...userTasks[taskIndex],
            text: text !== undefined ? text : userTasks[taskIndex].text,
            date: date !== undefined ? date : userTasks[taskIndex].date,
            completed: completed !== undefined ? completed : userTasks[taskIndex].completed,
            priority: priority !== undefined ? priority : userTasks[taskIndex].priority,
            category: category !== undefined ? category : userTasks[taskIndex].category,
            notes: notes !== undefined ? notes : userTasks[taskIndex].notes,
            recurrence: recurrence !== undefined ? recurrence : userTasks[taskIndex].recurrence
        };

        tasks[req.user.username] = userTasks;
        writeTasks(tasks);

        res.json(userTasks[taskIndex]);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete a task
app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
    try {
        const taskId = parseInt(req.params.id);

        const tasks = readTasks();
        const userTasks = tasks[req.user.username] || [];

        const filteredTasks = userTasks.filter(task => task.id !== taskId);

        if (filteredTasks.length === userTasks.length) {
            return res.status(404).json({ error: 'Task not found' });
        }

        tasks[req.user.username] = filteredTasks;
        writeTasks(tasks);

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Reorder tasks
app.post('/api/tasks/reorder', authenticateToken, (req, res) => {
    try {
        const { order } = req.body;

        const tasks = readTasks();
        const userTasks = tasks[req.user.username] || [];

        // Reorder tasks based on the provided order array
        const reorderedTasks = order.map(id => {
            return userTasks.find(task => task.id === id);
        }).filter(task => task !== undefined);

        tasks[req.user.username] = reorderedTasks;
        writeTasks(tasks);

        res.json({ message: 'Task order updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ========== ADMIN ROUTES ==========

// Get all users (admin only - no auth for simplicity)
app.get('/api/admin/users', (req, res) => {
    try {
        const users = readUsers();
        const userList = Object.keys(users).map(username => ({ username }));
        res.json(userList);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Reset user password (admin only)
app.post('/api/admin/reset-password', async (req, res) => {
    try {
        const { username, newPassword } = req.body;

        if (!username || !newPassword) {
            return res.status(400).json({ error: 'Username and new password required' });
        }

        if (newPassword.length < 4) {
            return res.status(400).json({ error: 'Password must be at least 4 characters' });
        }

        const users = readUsers();

        if (!users[username]) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        users[username].password = hashedPassword;
        writeUsers(users);

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete user (admin only)
app.delete('/api/admin/delete-user/:username', (req, res) => {
    try {
        const username = req.params.username;

        const users = readUsers();
        
        if (!users[username]) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete user
        delete users[username];
        writeUsers(users);

        // Delete user's tasks
        const tasks = readTasks();
        delete tasks[username];
        writeTasks(tasks);

        res.json({ message: 'User and tasks deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
