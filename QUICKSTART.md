# AI-Ley Dashboard Extension - Quick Start Guide

## 🚀 Quick Setup (3 Steps)

### Step 1: Install Dependencies

```bash
cd src/ai-ley-dashboard
npm install
```

### Step 2: Compile

```bash
npm run compile
```

### Step 3: Test or Package

**Option A: Test in Development Mode**

```bash
# In VS Code, press F5
# Or from Command Palette: "Debug: Start Debugging"
```

**Option B: Package and Install**

```bash
npm run package
code --install-extension ai-ley-dashboard-2.0.0.vsix
```

## 📋 Automated Setup

Use the setup script:

```bash
cd src/ai-ley-dashboard
./setup.sh
```

This will:

1. Check prerequisites
2. Install dependencies
3. Compile TypeScript
4. Optionally package the extension

## ✅ Verification

After installation, verify the extension is working:

1. Open a workspace folder in VS Code
2. Look for two status bar items:
   - 🌐 "AI-Ley: Connecting..." (dashboard status)
   - 🔄 "AI-Ley: Initializing..." (sync status)
3. Wait a moment for initialization
4. Check that `.cache/ai-ley` folder is created
5. Verify `.ai-ley` folder is synced to workspace root

## 🎯 First Use

### View Configuration

1. Open Settings (`Ctrl+,` / `Cmd+,`)
2. Search for "AI-Ley"
3. Review available options

### Manual Commands

Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- **AI-Ley: Open Dashboard** - View Node-RED dashboard
- **AI-Ley: Sync Configurations** - Sync files without updating
- **AI-Ley: Force Update** - Force repository update

### Configure AI Systems

In Settings under "AI-Ley > Agentic":

- ✅ Enable systems you use (Copilot, Claude, Gemini, etc.)
- ❌ Disable systems you don't use

Changes apply immediately!

## 🔧 Common Configurations

### Disable Auto-Updates

```json
{
  "aiLey.update.enabled": false
}
```

### Change Update Interval

```json
{
  "aiLey.update.interval": 3600 // 1 hour (in seconds)
}
```

### Use Only GitHub Copilot

```json
{
  "aiLey.agentic.githubCopilot": true,
  "aiLey.agentic.claude": false,
  "aiLey.agentic.gemini": false,
  "aiLey.agentic.cursor": false
  // ... disable others
}
```

## 📚 Learn More

- [README.md](./README.md) - Full documentation
- [CONFIGURATION.md](./CONFIGURATION.md) - Configuration guide
- [BUILD.md](./BUILD.md) - Build instructions
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Technical details

## 🐛 Troubleshooting

### Extension Not Activating

1. Check VS Code version (minimum 1.85.0)
2. Reload window: `Ctrl+Shift+P` → "Developer: Reload Window"
3. Check Output panel for errors

### Dependencies Won't Install

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Compilation Errors

```bash
# Clear compiled files and rebuild
rm -rf dist/
npm run compile
```

### Git Errors

Ensure Git is installed:

```bash
git --version
```

## 💡 Tips

1. **Start with defaults** - All features work out of the box
2. **Use workspace settings** - Per-project customization
3. **Watch status bar** - Visual feedback on sync status
4. **Check Output panel** - View detailed logs
5. **Force update** - When in doubt, click sync status bar item

## 🎉 You're Ready!

The extension will now:

- ✅ Automatically download AI configurations
- ✅ Keep them updated
- ✅ Sync based on your preferences
- ✅ Show status in real-time

Happy coding with AI-Ley! 🤖
