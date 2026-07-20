# GitHub Setup Guide

## Quick Setup Instructions

### Step 1: Install Git

**Option A: Git for Windows (Command Line)**
1. Download from: https://git-scm.com/download/win
2. Run the installer (use default settings)
3. Restart your terminal/PowerShell

**Option B: GitHub Desktop (GUI - Easier)**
1. Download from: https://desktop.github.com/
2. Install and sign in with your GitHub account
3. Skip to Step 3 below

### Step 2: Create GitHub Repository

1. Go to https://github.com
2. Sign in (or create account)
3. Click the "+" icon → "New repository"
4. Name it: `navigation-system` (or your preferred name)
5. Choose Public or Private
6. **Don't** initialize with README (we already have one)
7. Click "Create repository"
8. Copy the repository URL (e.g., `https://github.com/yourusername/navigation-system.git`)

### Step 3: Push Your Code

#### Using Git Command Line:

Open PowerShell in your project folder and run:

```powershell
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: SwiftRoute Delivery Navigation System"

# Add your GitHub repository as remote (replace with your URL)
git remote add origin https://github.com/yourusername/navigation-system.git

# Push to GitHub
git branch -M main
git push -u origin main
```

#### Using GitHub Desktop:

1. Open GitHub Desktop
2. Click "File" → "Add Local Repository"
3. Browse to your project folder: `C:\Users\javonte1.carter\Navigation System`
4. Click "Add Repository"
5. GitHub Desktop will detect it's not a git repo yet
6. Click "Create a Repository"
7. Name: `navigation-system`
8. Click "Create Repository"
9. Write commit message: "Initial commit: SwiftRoute Delivery Navigation System"
10. Click "Commit to main"
11. Click "Publish repository" (top right)
12. Choose your GitHub account and repository name
13. Click "Publish Repository"

### Step 4: Verify

Go to your GitHub repository page and you should see all your files!

## Future Updates

After making changes, to push updates:

**Command Line:**
```powershell
git add .
git commit -m "Description of your changes"
git push
```

**GitHub Desktop:**
1. Make your changes
2. Write commit message
3. Click "Commit to main"
4. Click "Push origin"

## Important Notes

- The `.gitignore` file will exclude unnecessary files (node_modules, __pycache__, etc.)
- Your Google Maps API key is in the code - consider using environment variables for production
- The `README.md` file documents your project

