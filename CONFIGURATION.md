# AI-Ley Dashboard Extension - Configuration Guide

## Overview

This guide explains how to configure the AI-Ley Dashboard extension to best suit your workflow.

## Quick Start

1. **Install the Extension**

   - The extension will auto-activate when you open a workspace
   - It will create `.cache/ai-ley` for the repository cache

2. **Default Behavior**
   - Automatically syncs all AI assistant configurations
   - Updates every 24 hours
   - Connects to dashboard at `http://localhost:1880/dashboard`

## Configuration Options

### 1. Repository Settings

#### `aiLey.repository.url`

- **Type**: `string`
- **Default**: `https://github.com/armoin2018/ai-ley.git`
- **Description**: The GitHub repository URL for AI-Ley configurations

**Use Cases**:

- Use a fork of the repository
- Use a private repository with custom configurations
- Use a different branch or repository

**Example**:

```json
{
  "aiLey.repository.url": "https://github.com/your-org/ai-ley.git"
}
```

#### `aiLey.repository.branch`

- **Type**: `string`
- **Default**: `main`
- **Description**: The branch to clone from the repository

**Use Cases**:

- Test experimental features on a development branch
- Use a specific version tag
- Use organization-specific branch

**Example**:

```json
{
  "aiLey.repository.branch": "develop"
}
```

#### `aiLey.cache.directory`

- **Type**: `string`
- **Default**: `.cache/ai-ley`
- **Description**: Local cache directory for the repository (relative to workspace root)

**Use Cases**:

- Change cache location for organizational reasons
- Use absolute path for shared cache across projects
- Keep cache outside workspace

**Examples**:

```json
{
  "aiLey.cache.directory": ".cache/ai-ley" // Relative path
}
```

```json
{
  "aiLey.cache.directory": "/Users/username/.ai-ley-cache" // Absolute path
}
```

### 2. Auto-Update Settings

#### `aiLey.update.enabled`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable automatic updates from the repository

**Use Cases**:

- Disable for offline work
- Disable when you want full control over updates
- Enable for always-current configurations

**Example**:

```json
{
  "aiLey.update.enabled": false // Disable auto-updates
}
```

#### `aiLey.update.interval`

- **Type**: `number`
- **Default**: `86400` (24 hours)
- **Description**: Interval in seconds between update checks

**Use Cases**:

- Frequent updates: `3600` (1 hour)
- Daily updates: `86400` (24 hours)
- Weekly updates: `604800` (7 days)
- Disable: `0`

**Examples**:

```json
{
  "aiLey.update.interval": 3600 // Check every hour
}
```

```json
{
  "aiLey.update.interval": 0 // Disable (manual only)
}
```

### 3. Dashboard Settings

#### `aiLey.dashboardUrl`

- **Type**: `string`
- **Default**: `http://localhost:1880/dashboard`
- **Description**: URL of the AI-Ley MCP dashboard

**Use Cases**:

- Custom port configuration
- Remote dashboard access
- HTTPS connection

**Examples**:

```json
{
  "aiLey.dashboardUrl": "http://localhost:8080/dashboard" // Custom port
}
```

```json
{
  "aiLey.dashboardUrl": "https://ailey.example.com/dashboard" // Remote
}
```

### 4. Agentic System Configuration

These settings control which AI assistant configurations are copied to your workspace.

#### `aiLey.agentic.githubCopilot`

- **Type**: `boolean`
- **Default**: `true`
- **Files**: `.github/copilot-instructions.md`

#### `aiLey.agentic.claude`

- **Type**: `boolean`
- **Default**: `true`
- **Files**: `CLAUDE.md`, `.claude/`

#### `aiLey.agentic.gemini`

- **Type**: `boolean`
- **Default**: `true`
- **Files**: `GEMINI.md`, `.gemini/`

#### `aiLey.agentic.cursor`

- **Type**: `boolean`
- **Default**: `true`
- **Files**: `.cursor/`, `cursor-config.json`

#### `aiLey.agentic.windsurf`

- **Type**: `boolean`
- **Default**: `true`
- **Files**: `.windsurf/`, `windsurf-config.json`

#### `aiLey.agentic.cline`

- **Type**: `boolean`
- **Default**: `true`
- **Files**: `.clinerules/`

#### `aiLey.agentic.roo`

- **Type**: `boolean`
- **Default**: `true`
- **Files**: `.roorules/`

#### `aiLey.agentic.codex`

- **Type**: `boolean`
- **Default**: `true`
- **Files**: `.codex/`

#### `aiLey.agentic.opencode`

- **Type**: `boolean`
- **Default**: `true`
- **Files**: `.opencode/`

#### `aiLey.agentic.metis`

- **Type**: `boolean`
- **Default**: `true`
- **Files**: `.metis/`

#### `aiLey.agentic.generic`

- **Type**: `boolean`
- **Default**: `true`
- **Files**: `AGENT.md`, `AGENTS.md`

## Configuration Profiles

### Profile 1: Minimal Configuration (GitHub Copilot Only)

```json
{
  "aiLey.agentic.githubCopilot": true,
  "aiLey.agentic.claude": false,
  "aiLey.agentic.gemini": false,
  "aiLey.agentic.cursor": false,
  "aiLey.agentic.windsurf": false,
  "aiLey.agentic.cline": false,
  "aiLey.agentic.roo": false,
  "aiLey.agentic.codex": false,
  "aiLey.agentic.opencode": false,
  "aiLey.agentic.metis": false,
  "aiLey.agentic.generic": true
}
```

### Profile 2: Multi-AI Setup

```json
{
  "aiLey.agentic.githubCopilot": true,
  "aiLey.agentic.claude": true,
  "aiLey.agentic.gemini": true,
  "aiLey.agentic.cursor": false,
  "aiLey.agentic.windsurf": false,
  "aiLey.agentic.cline": false,
  "aiLey.agentic.roo": false,
  "aiLey.agentic.codex": false,
  "aiLey.agentic.opencode": false,
  "aiLey.agentic.metis": false,
  "aiLey.agentic.generic": true
}
```

### Profile 3: IDE-Focused Setup

```json
{
  "aiLey.agentic.githubCopilot": false,
  "aiLey.agentic.claude": false,
  "aiLey.agentic.gemini": false,
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

### Profile 4: Everything Enabled

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

### Profile 5: Offline/Manual Mode

```json
{
  "aiLey.update.enabled": false,
  "aiLey.update.interval": 0,
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

## Workspace vs User Settings

### User Settings

Apply to all workspaces. Useful for:

- Repository URL (if using custom fork)
- Update interval preferences
- Dashboard URL

**Location**: `File > Preferences > Settings > User`

### Workspace Settings

Apply to current workspace only. Useful for:

- Project-specific agentic configurations
- Custom cache location per project
- Disable updates for specific projects

**Location**: `File > Preferences > Settings > Workspace`

Example `.vscode/settings.json`:

```json
{
  "aiLey.agentic.githubCopilot": true,
  "aiLey.agentic.claude": false,
  "aiLey.cache.directory": ".ai-ley-cache",
  "aiLey.update.enabled": true
}
```

## Advanced Configuration

### Using Environment-Specific Repositories

You can set different repositories for different environments:

**Development**:

```json
{
  "aiLey.repository.url": "https://github.com/your-org/ai-ley.git",
  "aiLey.repository.branch": "develop",
  "aiLey.update.interval": 3600
}
```

**Production**:

```json
{
  "aiLey.repository.url": "https://github.com/your-org/ai-ley.git",
  "aiLey.repository.branch": "main",
  "aiLey.update.interval": 86400
}
```

### Team Configuration

For team consistency, commit `.vscode/settings.json`:

```json
{
  "aiLey.repository.url": "https://github.com/company/ai-ley.git",
  "aiLey.repository.branch": "main",
  "aiLey.agentic.githubCopilot": true,
  "aiLey.agentic.claude": true,
  "aiLey.agentic.gemini": false,
  "aiLey.agentic.cursor": true,
  "aiLey.update.enabled": true,
  "aiLey.update.interval": 86400
}
```

## Troubleshooting

### Configuration Not Applied

1. Check if settings are in User or Workspace scope
2. Reload VS Code window after changes
3. Check Output panel for errors

### Files Not Updating

1. Check agentic configuration checkboxes
2. Verify source files exist in `.cache/ai-ley`
3. Run "AI-Ley: Force Update" command
4. Check file permissions

### Performance Issues

If updates are slow:

1. Increase update interval
2. Disable unused agentic systems
3. Use shallow git clones (already default)

## Best Practices

1. **Start with defaults** - Only customize when needed
2. **Use workspace settings** for project-specific configs
3. **Enable auto-updates** for non-critical projects
4. **Disable auto-updates** for production or critical work
5. **Commit workspace settings** for team consistency
6. **Review changes** after force updates

## See Also

- [README.md](./README.md) - Main extension documentation
- [CHANGELOG.md](./CHANGELOG.md) - Version history
- [ai-ley.py](https://github.com/armoin2018/node-red-contrib-ai-ley/blob/main/ai-ley.py) - Python reference implementation
