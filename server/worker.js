// Cloudflare Worker for TODO Backend
import bcryptjs from 'bcryptjs';

// JWT functions (simplified for Workers)
function generateToken(username, secret) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ username, exp: Date.now() + 86400000 }));
  const signature = btoa(username + secret);
  return `${header}.${payload}.${signature}`;
}

function verifyToken(token, secret) {
  try {
    const [header, payload, signature] = token.split('.');
    const decoded = JSON.parse(atob(payload));
    if (decoded.exp < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const SECRET_KEY = env.SECRET_KEY || 'default-secret-key';

    try {
      // Signup
      if (path === '/api/signup' && request.method === 'POST') {
        const { username, password } = await request.json();
        
        if (!username || !password || password.length < 4) {
          return new Response(JSON.stringify({ error: 'Invalid input' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const existingUser = await env.USERS.get(username);
        if (existingUser) {
          return new Response(JSON.stringify({ error: 'Username already exists' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        await env.USERS.put(username, JSON.stringify({ password: hashedPassword }));

        return new Response(JSON.stringify({ message: 'User created successfully' }), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Login
      if (path === '/api/login' && request.method === 'POST') {
        const { username, password } = await request.json();
        
        const userDataRaw = await env.USERS.get(username);
        if (!userDataRaw) {
          return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const userData = JSON.parse(userDataRaw);
        const validPassword = await bcryptjs.compare(password, userData.password);
        
        if (!validPassword) {
          return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const token = generateToken(username, SECRET_KEY);
        return new Response(JSON.stringify({ token, username }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get tasks
      if (path === '/api/tasks' && request.method === 'GET') {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split(' ')[1];
        const user = verifyToken(token, SECRET_KEY);
        
        if (!user) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const tasksRaw = await env.TASKS.get(user.username);
        const tasks = tasksRaw ? JSON.parse(tasksRaw) : [];
        
        return new Response(JSON.stringify(tasks), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Add task
      if (path === '/api/tasks' && request.method === 'POST') {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split(' ')[1];
        const user = verifyToken(token, SECRET_KEY);
        
        if (!user) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { text, date, completed, priority, category, notes, recurrence } = await request.json();
        
        if (!text) {
          return new Response(JSON.stringify({ error: 'Task text required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const tasksRaw = await env.TASKS.get(user.username);
        const tasks = tasksRaw ? JSON.parse(tasksRaw) : [];
        
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

        tasks.push(newTask);
        await env.TASKS.put(user.username, JSON.stringify(tasks));

        return new Response(JSON.stringify(newTask), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Update task
      if (path.startsWith('/api/tasks/') && request.method === 'PUT') {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split(' ')[1];
        const user = verifyToken(token, SECRET_KEY);
        
        if (!user) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const taskId = parseInt(path.split('/').pop());
        const updateData = await request.json();
        
        const tasksRaw = await env.TASKS.get(user.username);
        const tasks = tasksRaw ? JSON.parse(tasksRaw) : [];
        
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) {
          return new Response(JSON.stringify({ error: 'Task not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        tasks[taskIndex] = { ...tasks[taskIndex], ...updateData };
        await env.TASKS.put(user.username, JSON.stringify(tasks));

        return new Response(JSON.stringify(tasks[taskIndex]), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Delete task
      if (path.startsWith('/api/tasks/') && request.method === 'DELETE') {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split(' ')[1];
        const user = verifyToken(token, SECRET_KEY);
        
        if (!user) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const taskId = parseInt(path.split('/').pop());
        
        const tasksRaw = await env.TASKS.get(user.username);
        const tasks = tasksRaw ? JSON.parse(tasksRaw) : [];
        
        const filteredTasks = tasks.filter(task => task.id !== taskId);
        await env.TASKS.put(user.username, JSON.stringify(filteredTasks));

        return new Response(JSON.stringify({ message: 'Task deleted successfully' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Reorder tasks
      if (path === '/api/tasks/reorder' && request.method === 'POST') {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split(' ')[1];
        const user = verifyToken(token, SECRET_KEY);
        
        if (!user) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { order } = await request.json();
        
        const tasksRaw = await env.TASKS.get(user.username);
        const tasks = tasksRaw ? JSON.parse(tasksRaw) : [];
        
        const reorderedTasks = order.map(id => tasks.find(task => task.id === id)).filter(Boolean);
        await env.TASKS.put(user.username, JSON.stringify(reorderedTasks));

        return new Response(JSON.stringify({ message: 'Task order updated successfully' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
