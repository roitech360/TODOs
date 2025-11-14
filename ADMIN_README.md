# Admin Panel Documentation

## Access Admin Panel

**Admin Login URL:** `admin-login.html`

Example: `https://1bbd3e37.todo-app-30j.pages.dev/admin-login.html`

## Creating Your First Admin Account

1. Go to the admin login page
2. Click "Create Admin" 
3. Fill in:
   - Admin username
   - Admin password (minimum 6 characters)
   - **Admin Secret Key:** `admin-secret-2024`
4. Click "Create Admin Account"
5. Login with your new admin credentials

## Admin Features

### Dashboard Overview
- **Total Users** - Number of registered users
- **Total Tasks** - All tasks in the system
- **Completed Tasks** - Tasks marked as complete
- **Active Tasks** - Tasks still pending

### User Management
- **View all users** - See complete user list with task counts
- **View user tasks** - Click "View Tasks" to see all tasks for any user
- **Delete users** - Remove users and all their tasks (with confirmation)

## Security Notes

⚠️ **Important:** Change the admin secret key in production!

To change the admin secret key:
1. Open `server/wrangler.toml`
2. Update `ADMIN_SECRET_KEY = "your-new-secret-key"`
3. Run `cd server; wrangler deploy`

## Admin vs Regular Users

- Regular users: Access via `login.html` - Can only see/manage their own tasks
- Admin users: Access via `admin-login.html` - Can view all users and tasks
- Admin accounts have an `isAdmin: true` flag in the database
- Admin tokens include `_admin` suffix for authentication

## URLs

- **User Login:** `/login.html`
- **Admin Login:** `/admin-login.html`
- **Admin Dashboard:** `/admin-dashboard.html`

---

Built with ❤️ for efficient task management
