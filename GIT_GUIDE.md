# Git & GitHub Guide - Step by Step

## Initial Setup (One Time Only)

### 1. Initialize Git in Your Project Folder
```powershell
cd path\to\your\project
git init
```

### 2. Add Your Files
```powershell
git add .
```

### 3. Create Your First Commit
```powershell
git commit -m "Initial commit"
```

### 4. Create Repository on GitHub
- Go to https://github.com/new
- Enter repository name
- **Don't** check "Initialize with README"
- Click "Create repository"

### 5. Link Local Repository to GitHub
```powershell
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

---

## Daily Workflow (After Initial Setup)

### Check What Changed
```powershell
git status
```

### Add Changes
```powershell
# Add all changes
git add .

# Or add specific file
git add filename.html
```

### Commit Changes
```powershell
git commit -m "Describe what you changed"
```

### Push to GitHub
```powershell
git push
```

---

## Common Issues & Fixes

### Accidentally Staged Files? Unstage Them:
```powershell
# Unstage all files
git restore --staged .

# Unstage specific file
git restore --staged filename.html
```

### Too Many Files Showing in Source Control?
Check if git was initialized in wrong folder:
```powershell
# Check current directory
git status

# If wrong folder, remove git
Remove-Item -Force .git -Recurse

# Then go to correct folder and initialize
cd path\to\correct\folder
git init
```

### Want to Undo Last Commit (but keep changes)?
```powershell
git reset HEAD~1
```

---

## Quick Reference

| Command | What It Does |
|---------|-------------|
| `git status` | See what changed |
| `git add .` | Stage all changes |
| `git commit -m "message"` | Save changes locally |
| `git push` | Upload to GitHub |
| `git pull` | Download from GitHub |
| `git log` | See commit history |

---

## Tips

- Always `git status` first to see what you're working with
- Write clear commit messages describing what you changed
- Commit often - small commits are better than huge ones
- Push regularly to back up your work to GitHub
