# Quick Start Guide - AI-Ley v2.4.3

## 🎯 What's New in v2.4.3

This version fixes the auto-initialization feature and enhances the Force Update functionality.

## 🚀 Using Auto-Init for New Projects

### Step 1: Enable Auto-Init
Open VS Code Settings (⌘+, on Mac, Ctrl+, on Windows/Linux)

Search for: `aiLey.autoInit.newProjects`

**Enable the setting:**
```json
{
  "aiLey.autoInit.newProjects": true
}
```

### Step 2: Open a New Project
1. File > Open Folder...
2. Select any project folder that doesn't have AI-Ley configured
3. VS Code will automatically:
   - Clone the AI-Ley repository
   - Deploy all configured assistant files
   - Show a notification: "AI-Ley: Auto-initializing for new project..."

### Step 3: Verify Installation
Check that these folders/files were created:
- `.ai-ley/` - Core AI-Ley configurations
- `.project/` - Project documentation
- `.github/copilot-instructions.md` - GitHub Copilot config (if enabled)
- Other assistant configs based on your settings

## 🔧 Using Force Update

### When to Use Force Update
- Auto-init is disabled but you want to initialize a project manually
- You want to update to the latest AI-Ley configurations
- You've made changes to your agentic settings and want to re-sync

### Method 1: Status Bar (Recommended)
1. Look at the bottom-left of VS Code
2. Find the status bar item: `🔄 AI-Ley: Ready`
3. Click on it
4. Wait for the update to complete

### Method 2: Command Palette
1. Press ⌘+Shift+P (Mac) or Ctrl+Shift+P (Windows/Linux)
2. Type: `AI-Ley: Force Update`
3. Press Enter
4. Wait for the update to complete

## ⚙️ Configuration Options

### Auto-Init Settings

```json
{
  // Automatically initialize new projects (recommended for most users)
  "aiLey.autoInit.newProjects": true,
  
  // Automatically initialize existing projects that match the pattern
  "aiLey.autoInit.existingProjects": false,
  
  // Regex pattern for matching projects (only used if existingProjects is true)
  "aiLey.autoInit.projectPattern": ".*",
  
  // Automatic updates from repository
  "aiLey.update.enabled": true,
  
  // Update interval in seconds (86400 = 24 hours)
  "aiLey.update.interval": 86400
}
```

### Agentic Assistant Settings

Choose which AI assistants you want configured:

```json
{
  "aiLey.agentic.generic": true,           // AGENT.md, AGENTS.md
  "aiLey.agentic.githubCopilot": true,     // .github/
  "aiLey.agentic.claude": false,           // CLAUDE.md, .claude/
  "aiLey.agentic.gemini": false,           // GEMINI.md, .gemini/
  "aiLey.agentic.cursor": false,           // .cursor/
  "aiLey.agentic.windsurf": false,         // .windsurf/
  "aiLey.agentic.cline": false,            // .clinerules/
  "aiLey.agentic.roo": false,              // .roorules/
  "aiLey.agentic.codex": false,            // .codex/
  "aiLey.agentic.opencode": false,         // .opencode/
  "aiLey.agentic.metis": false             // .metis/
}
```

## 📊 Status Bar Indicators

The AI-Ley status bar shows different states:

- `✅ AI-Ley: Ready` - Everything is up to date (click to force update)
- `🔄 AI-Ley: Checking for updates...` - Checking repository
- `🔄 AI-Ley: Updating...` - Downloading and syncing files
- `🔄 AI-Ley: Initializing...` - Setting up for first time or force update
- `☁️ AI-Ley: Cloning repository...` - First-time setup
- `❌ AI-Ley: Error` - Something went wrong (check notifications)
- `ℹ️ AI-Ley: Parent Repo` - Parent repository detected (no modifications)

## 🔍 Troubleshooting

### Auto-Init Not Working?
1. Verify setting is enabled: `aiLey.autoInit.newProjects`
2. Make sure the workspace is not the parent ai-ley repository
3. Check that the project doesn't already have AI-Ley installed
4. Look for error messages in the Output panel (View > Output > AI-Ley)

### Force Update Not Working?
1. Check internet connection (needs to reach GitHub)
2. Verify repository URL is correct: `aiLey.repository.url`
3. Check permissions on cache directory: `.cache/ai-ley`
4. Try deleting `.cache/ai-ley` and running force update again

### Files Not Syncing?
1. Check your agentic settings - disabled assistants won't have files synced
2. Run Force Update to re-sync everything
3. Verify cache directory exists and has content
4. Check file permissions in workspace

## 📚 Additional Resources

- **Main Repository**: https://github.com/armoin2018/ai-ley
- **Extension Repository**: https://github.com/armoin2018/ai-ley-vsix
- **Report Issues**: https://github.com/armoin2018/ai-ley-vsix/issues
- **Full Documentation**: See README.md in the extension repository

## 💡 Pro Tips

1. **Selective Assistant Setup**: Only enable the assistants you actually use to keep your workspace clean
2. **Automatic Updates**: Keep `aiLey.update.enabled` true to get the latest improvements
3. **Custom Update Interval**: Adjust `aiLey.update.interval` based on your needs (e.g., 3600 for hourly)
4. **GitIgnore Management**: Keep `aiLey.gitignore.autoUpdate` enabled to prevent tracking AI-Ley files
5. **MCP Integration**: Enable MCP for advanced dashboard features (see MCP documentation)

---

**Version**: 2.4.3  
**Last Updated**: October 22, 2025
