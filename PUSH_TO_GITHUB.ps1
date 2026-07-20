# PowerShell script to help push to GitHub
# Run this after installing Git

Write-Host "=== SwiftRoute Delivery - GitHub Push Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if Git is installed
try {
    $gitVersion = git --version 2>&1
    Write-Host "✓ Git is installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Git first:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://git-scm.com/download/win" -ForegroundColor White
    Write-Host "2. Install with default settings" -ForegroundColor White
    Write-Host "3. Restart PowerShell and run this script again" -ForegroundColor White
    Write-Host ""
    Write-Host "Or use GitHub Desktop: https://desktop.github.com/" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "Step 1: Initialize Git repository..." -ForegroundColor Cyan
if (Test-Path ".git") {
    Write-Host "✓ Git repository already initialized" -ForegroundColor Green
} else {
    git init
    Write-Host "✓ Git repository initialized" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 2: Add all files..." -ForegroundColor Cyan
git add .
Write-Host "✓ Files added to staging" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Create initial commit..." -ForegroundColor Cyan
git commit -m "Initial commit: SwiftRoute Delivery Navigation System

- Complete navigation system with route optimization
- Google Maps integration
- Delivery management system
- Backend API with FastAPI
- Frontend with standalone HTML app
- Team: Alissa Forde and Javonte Carter
- Founded: 2025"
Write-Host "✓ Commit created" -ForegroundColor Green

Write-Host ""
Write-Host "Step 4: Set up remote repository..." -ForegroundColor Cyan
Write-Host ""
Write-Host "You need to create a GitHub repository first:" -ForegroundColor Yellow
Write-Host "1. Go to https://github.com/new" -ForegroundColor White
Write-Host "2. Create a new repository (name it 'navigation-system' or your choice)" -ForegroundColor White
Write-Host "3. Copy the repository URL" -ForegroundColor White
Write-Host ""
$repoUrl = Read-Host "Enter your GitHub repository URL (or press Enter to skip)"

if ($repoUrl) {
    Write-Host ""
    Write-Host "Adding remote repository..." -ForegroundColor Cyan
    git remote remove origin 2>$null
    git remote add origin $repoUrl
    Write-Host "✓ Remote repository added" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Step 5: Push to GitHub..." -ForegroundColor Cyan
    git branch -M main
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Successfully pushed to GitHub!" -ForegroundColor Green
        Write-Host "Your code is now on GitHub at: $repoUrl" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "✗ Push failed. You may need to authenticate." -ForegroundColor Red
        Write-Host "Try using GitHub Desktop or set up SSH keys." -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "Skipping remote setup. To push later, run:" -ForegroundColor Yellow
    Write-Host "  git remote add origin <your-repo-url>" -ForegroundColor Gray
    Write-Host "  git push -u origin main" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan

