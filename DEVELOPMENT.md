# Development Guide - Beer Pong Tournament App

## Git Workflow - IMPORTANT

**Always follow Git best practices when working on this project:**

### When to Commit
Commit frequently, not just for "big" changes:
- ✅ After completing a feature
- ✅ After fixing a bug
- ✅ Before trying something experimental
- ✅ At the end of each coding session
- ✅ When you reach a stable working state

### Git Command Workflow
```bash
# 1. Check what changed
git status

# 2. Add your changes
git add .

# 3. Commit with a descriptive message
git commit -m "Brief description of what changed"

# 4. Push to GitHub
git push
```

### Good Commit Message Examples
```
✅ "Add hot streak feature with flame effects"
✅ "Fix timer not resetting between games"
✅ "Update cup colors and hover animations"
✅ "Refactor bracket component for better performance"
✅ "Add group stage knockout tracking"
```

### Bad Commit Message Examples
```
❌ "Update"
❌ "Fix stuff"
❌ "Changes"
❌ "Work in progress"
```

## Project Information

### Tech Stack
- **Framework**: React with Vite
- **Styling**: Tailwind CSS
- **Key Features**: 
  - Tournament bracket system
  - Group stage with knockout tracking
  - Interactive game screen with cup tracking
  - Timer functionality
  - Hot streak detection (3+ consecutive cups)

### Running the App
```bash
npm install    # Install dependencies
npm run dev    # Start development server
```

### Git Configuration
- Repository: https://github.com/CechOndra/beer-pong-tournament
- Main branch: `main`
- Git user: Redok (cech.ondrej21@gmail.com)

## AI Agent Instructions

When working on this project:
1. **Always commit and push changes** after completing work
2. Use descriptive commit messages
3. Test changes locally before committing
4. Keep commits focused on single features/fixes when possible
5. Update this file if new development practices are established
