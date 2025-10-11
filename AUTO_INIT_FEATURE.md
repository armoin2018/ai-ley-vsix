# AI-Ley Auto-Initialization Feature

## Overview

AI-Ley v2.1.0 now includes automatic initialization capabilities that allow you to automatically set up AI-Ley in new and existing projects based on configurable rules.

## New Settings (User-Level)

All auto-initialization settings are configured at the **User level** (`"scope": "application"`), meaning they apply globally across all your projects.

### 1. Auto Init: New Projects

**Setting**: `aiLey.autoInit.newProjects`  
**Type**: Boolean  
**Default**: `false` (disabled)  
**Scope**: User-level (application)

**Description**: Automatically initialize AI-Ley when a new project is opened (a project without existing AI-Ley configuration).

**Use Case**: Perfect for developers who want AI-Ley set up automatically in every new project they create or clone.

**Example**:

```json
{
  "aiLey.autoInit.newProjects": true
}
```

When enabled, AI-Ley will:

- Detect when you open a project that doesn't have `.ai-ley/` or `.cache/ai-ley/`
- Automatically clone the AI-Ley repository
- Set up the configuration files based on your agentic settings
- Update `.gitignore` if auto-update is enabled
- Show a notification: "AI-Ley: Auto-initializing for new project 'project-name'"

---

### 2. Auto Init: Existing Projects

**Setting**: `aiLey.autoInit.existingProjects`  
**Type**: Boolean  
**Default**: `false` (disabled)  
**Scope**: User-level (application)

**Description**: Automatically initialize AI-Ley for existing projects that already have AI-Ley configuration and match the specified pattern.

**Use Case**: Useful for developers working on multiple AI-Ley-enabled projects who want automatic sync when opening them.

**Example**:

```json
{
  "aiLey.autoInit.existingProjects": true
}
```

When enabled with a matching pattern, AI-Ley will:

- Detect when you open a project that has existing AI-Ley configuration
- Check if the project name matches the regex pattern
- Automatically ensure configurations are up to date
- Show a notification: "AI-Ley: Auto-initializing for project 'project-name'"

---

### 3. Auto Init: Project Pattern

**Setting**: `aiLey.autoInit.projectPattern`  
**Type**: String (Regex pattern)  
**Default**: `".*"` (matches all projects)  
**Scope**: User-level (application)

**Description**: Regex pattern to match project names for automatic AI-Ley initialization. Only applies when "Auto Init: Existing Projects" is enabled.

**Use Case**: Fine-grained control over which existing projects should auto-initialize based on naming patterns.

**Examples**:

Match all projects (default):

```json
{
  "aiLey.autoInit.projectPattern": ".*"
}
```

Match only projects starting with "ai-":

```json
{
  "aiLey.autoInit.projectPattern": "^ai-.*"
}
```

Match projects containing "bot" or "agent":

```json
{
  "aiLey.autoInit.projectPattern": ".*(bot|agent).*"
}
```

Match specific project names:

```json
{
  "aiLey.autoInit.projectPattern": "^(my-project|another-project|client-app)$"
}
```

Exclude test projects:

```json
{
  "aiLey.autoInit.projectPattern": "^(?!.*test).*$"
}
```

---

## How It Works

### Detection Logic

1. **When you open a workspace/folder**, the extension checks:
   - Does this project have `.ai-ley/` or `.cache/ai-ley/` directories?
2. **If NO (New Project)**:
   - Check if `aiLey.autoInit.newProjects` is enabled
   - If yes → Auto-initialize AI-Ley
3. **If YES (Existing Project)**:
   - Check if `aiLey.autoInit.existingProjects` is enabled
   - If yes → Check if project name matches `aiLey.autoInit.projectPattern`
   - If matches → Auto-initialize AI-Ley

### Workspace Folder Changes

The extension also watches for workspace folder changes:

- When you add a new folder to your workspace
- When you switch to a different workspace
- The same detection logic applies to each newly added folder

---

## Configuration Examples

### Scenario 1: Auto-setup for all new projects

```json
{
  "aiLey.autoInit.newProjects": true,
  "aiLey.autoInit.existingProjects": false
}
```

**Result**: AI-Ley automatically initializes only in new projects.

---

### Scenario 2: Auto-setup for everything

```json
{
  "aiLey.autoInit.newProjects": true,
  "aiLey.autoInit.existingProjects": true,
  "aiLey.autoInit.projectPattern": ".*"
}
```

**Result**: AI-Ley automatically initializes in all projects, new and existing.

---

### Scenario 3: Selective auto-setup

```json
{
  "aiLey.autoInit.newProjects": true,
  "aiLey.autoInit.existingProjects": true,
  "aiLey.autoInit.projectPattern": "^(client-|internal-).*"
}
```

**Result**:

- New projects: Auto-initialize always
- Existing projects: Only if name starts with "client-" or "internal-"

---

### Scenario 4: No auto-initialization (default)

```json
{
  "aiLey.autoInit.newProjects": false,
  "aiLey.autoInit.existingProjects": false
}
```

**Result**: Manual control only. Use commands to initialize AI-Ley.

---

## Notifications

When auto-initialization occurs, you'll see a notification:

**For new projects**:

```
AI-Ley: Auto-initializing for new project "my-awesome-app"
```

**For existing projects**:

```
AI-Ley: Auto-initializing for project "my-awesome-app"
```

---

## Settings Location

To configure auto-initialization:

1. Open Settings: `Cmd+,` (Mac) or `Ctrl+,` (Windows/Linux)
2. Search for: `AI-Ley Auto Init`
3. Configure the three settings:
   - ✅ Auto Init: New Projects
   - ✅ Auto Init: Existing Projects
   - ✏️ Auto Init: Project Pattern

Or edit your User Settings JSON:

```json
{
  "aiLey.autoInit.newProjects": true,
  "aiLey.autoInit.existingProjects": false,
  "aiLey.autoInit.projectPattern": ".*"
}
```

---

## Benefits

### For New Projects

- 🚀 **Instant Setup**: No need to manually run initialization commands
- ⚡ **Consistent Configuration**: Same AI-Ley setup across all new projects
- 🎯 **Zero Friction**: Start using AI assistants immediately

### For Existing Projects

- 🔄 **Auto-Sync**: Keep configurations up to date automatically
- 🎨 **Pattern-Based**: Only initialize projects that matter to you
- 📊 **Team Workflows**: Great for monorepos or project collections

### For Teams

- 👥 **Standardization**: Ensure all team members have consistent AI-Ley setups
- 📦 **Onboarding**: New team members get AI-Ley automatically
- 🔧 **Maintenance**: Updates propagate automatically

---

## Important Notes

1. **User-Level Configuration**: These settings are user-level, not workspace-level. They apply globally to your VS Code installation.

2. **Safe Defaults**: All auto-initialization features are disabled by default to prevent unexpected behavior.

3. **Pattern Testing**: The regex pattern is tested against the workspace folder name (not the full path).

4. **Error Handling**: If the regex pattern is invalid, auto-initialization for existing projects won't work, and an error will be logged to the console.

5. **Manual Override**: You can always manually run AI-Ley commands regardless of auto-initialization settings.

---

## Regex Pattern Tips

### Common Patterns

**Match all projects**:

```regex
.*
```

**Match projects starting with a prefix**:

```regex
^prefix-.*
```

**Match projects ending with a suffix**:

```regex
.*-suffix$
```

**Match projects containing specific text**:

```regex
.*(word1|word2).*
```

**Match exact names**:

```regex
^(project1|project2|project3)$
```

**Exclude certain patterns (negative lookahead)**:

```regex
^(?!.*test).*$
```

**Case-insensitive matching**:
Add the `i` flag isn't supported in the current implementation, so use character classes:

```regex
^[Pp]roject-.*
```

---

## Troubleshooting

### Auto-initialization not working?

1. **Check settings are enabled**:

   - For new projects: `aiLey.autoInit.newProjects` = `true`
   - For existing projects: `aiLey.autoInit.existingProjects` = `true`

2. **Verify pattern** (for existing projects):

   - Open Developer Console: `Help > Toggle Developer Tools`
   - Check for regex pattern errors
   - Test your pattern: `new RegExp("your-pattern").test("project-name")`

3. **Check project detection**:

   - New projects: Should NOT have `.ai-ley/` or `.cache/ai-ley/`
   - Existing projects: Should HAVE `.ai-ley/` or `.cache/ai-ley/`

4. **Open Output Panel**:
   - `View > Output`
   - Select "AI-Ley" from dropdown
   - Check for initialization messages

---

## Commands Still Available

Even with auto-initialization enabled, manual commands are still available:

- `AI-Ley: Force Update from Repository` - Manually trigger update
- `AI-Ley: Sync Configurations` - Manually sync configuration files
- `AI-Ley: Configure MCP Server` - Configure MCP integration
- `AI-Ley: Open Dashboard` - Open the AI-Ley dashboard

---

## Version

Feature added in: **AI-Ley v2.1.0**

---

## Feedback

If you have suggestions or issues with auto-initialization, please report them on the GitHub repository.
