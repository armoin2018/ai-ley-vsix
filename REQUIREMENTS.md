# AI-Ley VS Code Extension — Requirements

## Purpose & Scope

- Provide a VS Code extension that automates the setup and maintenance of AI-Ley assets inside a workspace.
- Deliver seamless integration with the AI-Ley MCP dashboard while keeping repository-sourced configurations synchronized and customizable per workspace.
- Support versioned releases packaged as `.vsix` artifacts and verified through TypeScript compilation.

## Functional Requirements

### Repository & Cache Management

- Clone the AI-Ley configuration repository (default `https://github.com/armoin2018/ai-ley.git`, branch `main`) into a workspace-relative cache directory (default `.cache/ai-ley`).
- Use shallow clones (`--depth 1`) for performance and ensure parent directories are created when absent.
- Detect whether the repository is already cloned and skip redundant operations; expose helpers to check for updates without pulling.
- When updates exist, hard-reset the cache to match the remote branch and notify the user of successful updates.

### Configuration Synchronization

- Maintain a mapping from cached assets to workspace targets using the ai-ley.py reference logic.
- Always synchronize the core `.ai-ley/` directory.
- Conditionally synchronize additional files/folders based on agent configuration toggles:
  - GitHub Copilot (`.github/copilot-instructions.md`)
  - Claude (`CLAUDE.md`, `.claude/`)
  - Gemini (`GEMINI.md`, `.gemini/`)
  - Cursor (`.cursor/`, `cursor-config.json`)
  - Windsurf (`.windsurf/`, `windsurf-config.json`)
  - Cline (`.clinerules/`)
  - Roo (`.roorules/`)
  - Codex (`.codex/`)
  - OpenCode (`.opencode/`)
  - Metis (`.metis/`)
  - Generic agent docs (`AGENT.md`, `AGENTS.md`).
- Compare files via MD5 hashing and copy only when content differs.
- Skip artifacts using predefined patterns (e.g., `node_modules/`, `.git/`, `dist/`, logs).
- Remove previously copied files/directories when their agent configuration is disabled (except the core `.ai-ley/` directory).
- Surface summary notifications indicating counts of updated and removed items.

### Update Scheduling

- Respect workspace settings `aiLey.update.enabled` (default `true`) and `aiLey.update.interval` (seconds, default `86400`).
- When enabled and the interval is positive, start a scheduler that:
  - Runs an initial sync on activation.
  - Performs recurring update checks at the configured cadence.
  - Supports manual restart when related settings change.
- Provide a "Force Update" action that ensures the repository is current and re-synchronizes configurations immediately.

### Dashboard & MCP Integration

- Provide a webview viewer for the AI-Ley dashboard (`aiLey.openDashboard` command and status bar item).
- Default dashboard URL is `http://localhost:1880/dashboard`; support overrides via workspace setting.
- When MCP integration is enabled and the companion MCP extension is installed, append `ProjectName=<workspace-name>` to the dashboard URL before loading.
- Offer a guided `aiLey.configureMcpServer` command to toggle MCP usage and persist MCP server URL.
- Fall back gracefully (with warnings) if MCP is enabled in settings but the MCP extension is unavailable.

### Command Surface

- Register the following commands and expose them via the command palette:
  - `aiLey.openDashboard`
  - `aiLey.syncConfigurations`
  - `aiLey.forceUpdate`
  - `aiLey.configureMcpServer`
- Ensure commands are only actionable when a workspace folder is present; display contextual error messages otherwise.

### Auto-Initialization

- Support user-level settings to auto-initialize AI-Ley assets:
  - `aiLey.autoInit.newProjects` (boolean, default `false`)
  - `aiLey.autoInit.existingProjects` (boolean, default `false`)
  - `aiLey.autoInit.projectPattern` (string regex, default `".*"`)
- On workspace activation or folder addition, evaluate current state:
  - Treat a workspace lacking `.ai-ley/` and `.cache/ai-ley/` as a "new project".
  - Treat workspaces containing AI-Ley assets as "existing projects" and match the folder name against the configured regex.
- When auto-init conditions are met, trigger initialization (clone/sync/gitignore) and notify the user of the action.

### Gitignore Management

- Maintain the workspace `.gitignore` file when `aiLey.gitignore.autoUpdate` (default `true`) is enabled.
- Append a dedicated AI-Ley section containing entries for core and agent-specific assets; avoid duplicate insertion by detecting the AI-Ley marker comment.
- Create `.gitignore` if it does not exist, logging actions to the output channel/console and displaying user-facing confirmations.

### Status Bar Feedback & Notifications

- Expose two status bar items:
  - Dashboard connectivity indicator (updates with reachability checks, opens dashboard on click).
  - Sync status indicator (shows current state, doubles as a shortcut for force updates).
- Perform `HEAD` requests to validate dashboard availability and attempt HTTPS fallback if HTTP fails.
- Provide informative messages for successes, warnings, and errors (e.g., cloning progress, MCP activation state, sync summaries).

## Configuration Requirements

- All settings under `aiLey.*` exist with the defaults specified in `package.json`:
  - Repository controls (`repository.url`, `repository.branch`, `cache.directory`).
  - Update controls (`update.enabled`, `update.interval`).
  - Dashboard & MCP settings (`dashboardUrl`, `mcp.enabled`, `mcp.serverUrl`).
  - Agent toggles (`aiLey.agentic.*`) default to `false` except `githubCopilot` and `generic`.
  - Gitignore automation (`gitignore.autoUpdate` default `true`).
  - Auto-init settings at application scope (user-level) with defaults described above.
- Settings are scoped to `workspace` unless otherwise noted (auto-init settings are `application`).
- Configuration change events must immediately:
  - Restart the scheduler if update settings change.
  - Trigger re-sync when agent toggles change.
  - Reinitialize managers when repository or cache settings change.
  - Reload the dashboard webview when dashboard/MCP settings change.

## Integration & Compatibility Requirements

- Require VS Code `^1.85.0` or later (per `engines.vscode`).
- Depend on `node-fetch@^2.7.0` for network checks and `simple-git@^3.25.0` for git operations.
- Assume Git CLI is available in the environment for cloning/pulling.
- Auto-activate once a workspace folder is present (`workspaceContains:**`).
- Must interoperate with optional AI-Ley MCP extension (`armoin.ai-ley-mcp`, `ai-ley-mcp`, or `ai-ley.mcp`).

## Non-Functional Requirements

- **Performance**: Use shallow clones and hash comparison to minimize data transfer and redundant copies; skip large/irrelevant files via pattern filters.
- **Reliability**: Catch and report errors during clone, update, sync, or gitignore operations; continue functioning even if optional steps fail.
- **Usability**: Provide clear status bar cues, notifications, and logging for user awareness; ensure commands respond promptly with actionable feedback.
- **Maintainability**: Centralize file mapping logic and configuration retrieval to mirror `ai-ley.py` semantics; keep default behaviors documented in README/CONFIGURATION.
- **Security**: Avoid storing secrets; only handle repository URLs the user provides and respect workspace boundaries.

## Testing Requirements

- Validate initial cloning and sync on a clean workspace.
- Verify change detection by modifying upstream files and ensuring only changed assets copy through.
- Toggle each agentic setting to confirm files add/remove correctly and .gitignore adjusts once per workspace.
- Exercise the scheduler by simulating update intervals and confirming manual force updates.
- Confirm dashboard connectivity logic handles reachable/unreachable URLs and MCP toggling (with and without the MCP extension installed).
- Test auto-init behavior for new and existing projects with varying regex patterns, including invalid regex handling.
- Ensure settings change listeners invoke appropriate reinitialization/synchronization flows.

## Build & Release Requirements

- Source is authored in TypeScript within `src/`; compiled JavaScript is emitted to `dist/` using `npm run compile` (tsc project).
- Packaging is performed via `npm run package` (vsce) producing versioned `.vsix` artifacts (e.g., `ai-ley-2.2.1.vsix`).
- Maintain semantic versioning; update `package.json` version and regenerate the `.vsix` upon feature or fix releases.
- Preserve existing scripts (`compile`, `watch`, `package`, `vscode:prepublish`) and ensure they succeed before distributing builds.

## Release & Documentation Requirements

- Keep README, CONFIGURATION, AUTO_INIT_FEATURE, and implementation summary aligned with current behaviors.
- Document new features and fixes in changelog/release notes.
- Provide quickstart instructions for installation, compilation, and packaging.
- Include LICENSE and other synced AI-Ley artifact documentation in releases.

## Operational Observability

- Log significant events (clone start/end, update status, gitignore changes, auto-init decisions) to aid troubleshooting via the VS Code output console.
- Display user notifications for success, warning, and error outcomes without overwhelming the user.

## Acceptance Criteria

- When installed in a compliant VS Code environment, the extension must automatically provision AI-Ley assets, respect configuration toggles, maintain the dashboard experience (with optional MCP), and support automated upkeep via scheduler and auto-init features.
- Packaging and compilation steps must succeed without manual intervention, yielding distributable `.vsix` files aligned with the declared version.
