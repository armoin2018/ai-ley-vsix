# AI-Ley Dashboard Extension

A VS Code extension that provides seamless integration with the AI-Ley project, automatically managing AI assistant configurations and providing dashboard access.

## Features

### 🔄 Automatic Configuration Sync

The extension automatically downloads and synchronizes AI assistant configurations from the [ai-ley repository](https://github.com/armoin2018/ai-ley.git) into your workspace.

- **Smart Updates**: Only updates files that have changed (uses MD5 hash comparison)
- **Scheduled Sync**: Configurable auto-update interval (default: 24 hours)
- **Manual Control**: Force update anytime via command or status bar click

### 📁 Configuration Management

The extension manages various AI assistant configuration files based on your preferences:

- **Core Configuration**: `.ai-ley` folder (always synced)
  - Shared instructions, personas, and prompts
  - Builder tools and documentation
- **Agentic System Support** (configurable via checkboxes):
  - ✅ **GitHub Copilot** - `.github/copilot-instructions.md`
  - ✅ **Claude** - `CLAUDE.md`, `.claude/`
  - ✅ **Gemini** - `GEMINI.md`, `.gemini/`
  - ✅ **Cursor** - `.cursor/`, `cursor-config.json`
  - ✅ **Windsurf** - `.windsurf/`, `windsurf-config.json`
  - ✅ **Cline** - `.clinerules/`
  - ✅ **Roo** - `.roorules/`
  - ✅ **Codex** - `.codex/`
  - ✅ **OpenCode** - `.opencode/`
  - ✅ **Metis** - `.metis/`
  - ✅ **Generic Agents** - `AGENT.md`, `AGENTS.md`

### 🌐 Dashboard Integration

Embedded AI-Ley dashboard viewer with:

- Automatic connection to Node-RED dashboard
- Configurable dashboard URL
- Status indicator showing connection state
- Quick access via status bar or command palette

## Installation

1. Install the extension from the VS Code marketplace (or build from source)
2. Open a workspace folder
3. The extension will automatically initialize and sync configurations

## Configuration

Access settings via `File > Preferences > Settings` and search for "AI-Ley":

### Repository Settings

```json
{
  "aiLey.repository.url": "https://github.com/armoin2018/ai-ley.git",
  "aiLey.repository.branch": "main",
  "aiLey.cache.directory": ".cache/ai-ley"
}
```

### Auto-Update Settings

```json
{
  "aiLey.update.enabled": true,
  "aiLey.update.interval": 86400 // in seconds (24 hours)
}
```

Set `interval` to `0` to disable automatic updates.

### Dashboard Settings

```json
{
  "aiLey.dashboardUrl": "http://localhost:1880/dashboard"
}
```

### Agentic System Configuration

Enable or disable specific AI assistant configurations:

```json
{
  "aiLey.agentic.githubCopilot": true,
  "aiLey.agentic.claude": true,
  "aiLey.agentic.gemini": true,
  "aiLey.agentic.cursor": true,
  "aiLey.agentic.windsurf": true,
  "aiLey.agentic.cline": true,
  "aiLey.agentic.roo": true,
  "aiLey.agentic.codex": true,
  "aiLey.agentic.opencode": true,
  "aiLey.agentic.metis": true,
  "aiLey.agentic.generic": true
}
```

## Commands

Access via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- **AI-Ley: Open Dashboard** - Open the dashboard viewer
- **AI-Ley: Sync Configurations** - Manually sync configurations without updating repository
- **AI-Ley: Force Update** - Force update from repository and sync configurations

## Status Bar

The extension adds two status bar items:

1. **Dashboard Status** - Shows connection state to the dashboard

   - 🌐 Connecting/Connected/Offline
   - Click to open dashboard

2. **Sync Status** - Shows configuration sync state
   - ✅ Ready
   - 🔄 Syncing
   - ❌ Error
   - Click to force update

## How It Works

### Based on ai-ley.py Logic

The extension implements the same logic as the Python `ai-ley.py` script:

1. **Clone/Update Repository**: Downloads the ai-ley repository to `.cache/ai-ley`
2. **Hash Comparison**: Uses MD5 hashing to detect file changes
3. **Selective Copy**: Copies only changed files based on configuration
4. **Skip Patterns**: Ignores build artifacts, dependencies, and temporary files

### File Structure

```
workspace-root/
├── .cache/
│   └── ai-ley/          # Cloned repository (cached)
├── .ai-ley/             # Core AI-Ley configs (always synced)
│   ├── shared/
│   ├── builder/
│   └── docs/
├── .github/             # GitHub Copilot configs (optional)
├── .claude/             # Claude configs (optional)
├── .cursor/             # Cursor configs (optional)
└── ...                  # Other agentic configs
```

## Development

### Building from Source

```bash
cd src/ai-ley-dashboard
npm install
npm run compile
```

### Packaging

```bash
npm run package
```

This creates a `.vsix` file you can install manually.

## Troubleshooting

### Repository Clone Fails

- Check internet connection
- Verify repository URL in settings
- Check if Git is installed and in PATH

### Files Not Syncing

- Check agentic configuration settings
- Look for files in `.cache/ai-ley` first
- Try "Force Update" command
- Check VS Code output panel for errors

### Dashboard Won't Connect

- Verify Node-RED is running
- Check dashboard URL in settings
- Try switching between HTTP and HTTPS

## Related

- [ai-ley repository](https://github.com/armoin2018/ai-ley)
- [ai-ley.py documentation](https://github.com/armoin2018/node-red-contrib-ai-ley/blob/main/ai-ley.py)
- [Node-RED AI-Ley project](https://github.com/armoin2018/node-red-contrib-ai-ley)

## License

Same license as the main AI-Ley project.
