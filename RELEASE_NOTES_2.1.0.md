# AI-Ley Extension v2.1.0 Release Notes

## 🎉 What's New

### Major Configuration Changes

#### 1. **Unified Dashboard Configuration**

- **Removed**: Separate `aiLey.mcp.dashboardUrl` configuration
- **Simplified**: Now uses single `aiLey.dashboardUrl` for both MCP and standalone modes
- **Benefit**: When MCP is enabled, the ProjectName parameter is automatically appended to the dashboard URL

#### 2. **Workspace-Level Configuration**

- **All AI-Ley settings now use workspace scope** (`scope: "window"`)
- Settings are stored in `.vscode/settings.json` instead of user settings
- Each workspace can have its own AI-Ley configuration
- MCP server configuration is now workspace-specific

#### 3. **Dynamic File Management**

- Files are now **automatically added when agentic types are enabled**
- Files are **automatically removed when agentic types are disabled**
- Exception: Core `.ai-ley/` directory is never removed
- Real-time sync when settings change

#### 4. **Enhanced .gitignore Management**

Comprehensive .gitignore entries are automatically added:

```gitignore
# AI-Ley generated files and directories
# Core AI-Ley
.ai-ley/
.cache/ai-ley/

# AI Assistant configurations
.github/copilot-instructions.md
CLAUDE.md
.claude/
GEMINI.md
.gemini/
.cursor/
cursor-config.json
.windsurf/
windsurf-config.json
.clinerules/
.roorules/
.codex/
.opencode/
.metis/
AGENT.md
AGENTS.md
```

## 🔧 Configuration Changes

### Settings Order

Repository branch setting is now positioned directly below repository URL for better organization.

### Workspace Scope

All settings now include `"scope": "window"` which means:

- ✅ Settings are workspace-specific
- ✅ Each project can have different configurations
- ✅ Settings don't affect other workspaces
- ✅ Better for team collaboration (settings can be committed)

## 📝 Default Settings

### Enabled by Default

- ✅ `aiLey.agentic.githubCopilot` - GitHub Copilot support
- ✅ `aiLey.agentic.generic` - Generic agent files (AGENT.md, AGENTS.md)
- ✅ `aiLey.gitignore.autoUpdate` - Automatic .gitignore updates

### Disabled by Default

- ❌ All other agentic types (Claude, Gemini, Cursor, Windsurf, Cline, Roo, Codex, OpenCode, Metis)
- ❌ MCP server integration

## 🚀 New Features

### 1. Smart File Synchronization

The extension now intelligently manages files based on your settings:

- **Enable a setting** → Files are copied to your workspace
- **Disable a setting** → Files are removed from your workspace
- **Real-time updates** → Changes happen immediately when you toggle settings

### 2. ProjectName Parameter

When MCP is enabled, the current workspace name is automatically appended as a URL parameter:

```
Before: http://localhost:1880/dashboard
After:  http://localhost:1880/dashboard?ProjectName=my-project
```

### 3. Improved MCP Configuration Command

- `AI-Ley: Configure MCP Server` command simplified
- Only asks for MCP server URL (dashboard URL is unified)
- Shows final dashboard URL with ProjectName parameter
- Workspace-level configuration storage

## 🔄 Migration Notes

### If Upgrading from v2.0.0

1. **MCP Dashboard URL**: The separate `aiLey.mcp.dashboardUrl` setting is removed. Update your `aiLey.dashboardUrl` setting if you were using a custom MCP dashboard URL.

2. **Settings Location**: All settings will now be workspace-specific. You may want to:

   - Copy your user-level settings to workspace settings
   - Or reconfigure per workspace as needed

3. **File Management**:
   - Files for disabled agentic types will be removed on next sync
   - Only GitHub Copilot and Generic files will remain by default
   - Enable specific agentic types in settings if you need them

## 📋 Full Changelog

### Added

- Automatic file removal when agentic types are disabled
- Comprehensive .gitignore entries for all AI-Ley files
- Workspace-level configuration scope for all settings
- Enhanced feedback messages showing files added/removed

### Changed

- Unified dashboard URL configuration (removed separate MCP dashboard URL)
- Repository branch setting moved below repository URL
- All agentic types disabled by default (except GitHub Copilot and Generic)
- MCP configuration command simplified
- Version bumped to 2.1.0

### Fixed

- .gitignore now properly updated with AI-Ley generated files
- Files from disabled extensions no longer copied by default
- Settings properly scoped to workspace level

## 🎯 Usage Examples

### Enable Claude Support

1. Open Settings (`Cmd+,` or `Ctrl+,`)
2. Search for "AI-Ley"
3. Enable `Agentic: Claude`
4. Files are automatically copied and .gitignore is updated

### Configure MCP Server

1. Run command: `AI-Ley: Configure MCP Server`
2. Select "Enable MCP Server"
3. Enter MCP server URL (e.g., `http://localhost:1880/mcp`)
4. Dashboard will automatically include your project name

### Disable Unwanted Agents

1. Open Settings
2. Disable any agentic types you don't use
3. Files are automatically removed from your workspace
4. .gitignore is updated accordingly

## 📦 Installation

Install the `.vsix` file:

```bash
code --install-extension ai-ley-2.1.0.vsix
```

Or drag and drop the `.vsix` file into VS Code.

## 🐛 Known Issues

None reported yet. Please report issues on the GitHub repository.

## 🙏 Credits

Developed with ❤️ for the AI-Ley community.

---

**Extension Name**: AI-Ley  
**Version**: 2.1.0  
**Publisher**: armoin  
**Repository**: https://github.com/armoin2018/ai-ley
