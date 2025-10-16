# Contribution Feature - Version 2.2.9

## Overview

The AI-Ley extension now supports contributing back updates to the main ai-ley repository. When you make local changes to shared configuration files in `.ai-ley/shared`, the extension can automatically:

1. Detect your changes during update cycles
2. Create a feature branch in your local cache
3. Commit and push the changes
4. Create a pull request to the ai-ley repository
5. Preserve your changes in `.my/shared` for future reference
6. Revert the cache back to the main branch

## Configuration

### Enable/Disable Contributions

The contribution feature is **enabled by default**. You can toggle it in VS Code settings:

**Setting:** `aiLey.contribute.enabled`
- **Type:** Boolean
- **Default:** `true`
- **Description:** Enable contributing back updates to the AI-Ley repository when local changes are detected in `.ai-ley/shared`

To disable:
1. Open VS Code Settings (Cmd+, on Mac or Ctrl+, on Windows/Linux)
2. Search for "AI-Ley: Contribute"
3. Uncheck the checkbox

Or in `settings.json`:
```json
{
  "aiLey.contribute.enabled": false
}
```

## How It Works

### Change Detection

During the configured update window (default: every 24 hours), the extension:

1. **Pulls latest changes** from the ai-ley repository to `.cache/ai-ley`
2. **Syncs configurations** to your workspace
3. **Compares files** between:
   - Your workspace: `.ai-ley/shared/`
   - Cached version: `.cache/ai-ley/.ai-ley/shared/`

### Contribution Process

When changes are detected in `.ai-ley/shared`, the extension:

1. **Copies changed files** to `.cache/ai-ley/.ai-ley/shared/`
2. **Creates a feature branch** with naming pattern:
   ```
   contribution/{project-name}-{date}-{timestamp}
   ```
   Example: `contribution/my-project-2025-10-16-1697462400000`

3. **Commits changes** with descriptive message:
   ```
   Community contribution: Updated X file(s) in shared

   From workspace: {workspace-name}
   Files:
   - path/to/file1.md
   - path/to/file2.md
   ```

4. **Pushes branch** to `github.com/armoin2018/ai-ley`

5. **Creates pull request** via GitHub API with:
   - Title: "Community contribution: Updated shared files"
   - Body: Details about changed files and source workspace
   - Base: `main` branch
   - Head: Your feature branch

6. **Backs up changes** to `.my/shared/` with same folder structure

7. **Reverts cache** to main branch and syncs with latest changes

## GitHub Authentication

To create pull requests, you need GitHub authentication. The extension supports two methods:

### Method 1: Environment Variable (Recommended for CI/CD)

Set the `GITHUB_TOKEN` environment variable with a Personal Access Token that has `repo` scope:

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

### Method 2: Manual Entry

If no token is found in the environment, the extension will prompt you to enter one when attempting to create a pull request.

To create a GitHub Personal Access Token:

1. Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Click "Generate new token"
3. Select scopes:
   - ✅ `repo` (Full control of private repositories)
4. Generate token and copy it
5. Paste it when prompted by the extension

**Note:** Keep your token secure and never commit it to version control!

## Directory Structure

After contribution, your workspace will have:

```
your-workspace/
├── .ai-ley/
│   └── shared/           # Your modified shared files
│       └── ...
├── .cache/
│   └── ai-ley/          # Synced with main branch (your changes reverted)
│       └── .ai-ley/
│           └── shared/
└── .my/
    └── shared/          # Backup of your contributed files
        └── ...          # Same structure as .ai-ley/shared
```

## Use Cases

### Scenario 1: Improving Global Instructions

You've improved the global instructions in `.ai-ley/shared/global-instructions.md`:

1. Edit `.ai-ley/shared/global-instructions.md` in your workspace
2. Wait for the next update cycle (or force update with `AI-Ley: Force Update from Repository`)
3. Extension detects changes and creates a PR automatically
4. Your changes are preserved in `.my/shared/global-instructions.md`
5. The community reviews and merges your PR

### Scenario 2: Adding New Templates

You've created a new template in `.ai-ley/shared/templates/`:

1. Create `.ai-ley/shared/templates/my-new-template.md`
2. Trigger update cycle
3. Extension creates PR with your new template
4. Template is backed up to `.my/shared/templates/my-new-template.md`

### Scenario 3: Fixing Typos

You noticed typos in shared documentation:

1. Fix typos in `.ai-ley/shared/docs/something.md`
2. Next update detects changes
3. PR created with your fixes
4. Original fixed version saved to `.my/shared/docs/something.md`

## Manual Force Update

To trigger contribution check immediately:

1. Open Command Palette (Cmd+Shift+P or Ctrl+Shift+P)
2. Type "AI-Ley: Force Update from Repository"
3. Press Enter

This will:
- Pull latest changes from ai-ley repository
- Sync configurations
- Check for local changes and contribute if any exist

## Notifications

The extension provides feedback through VS Code notifications:

- ℹ️ "Detected X changed file(s) in .ai-ley/shared. Contributing back..."
- ✅ "Pull request created successfully! View at: {URL}"
- ✅ "Contribution complete! X file(s) contributed."
- ⚠️ "No GitHub token available, cannot create pull request. Branch pushed but PR not created."
- ❌ "Contribution failed - {error message}"

## Troubleshooting

### Issue: "No GitHub token available"

**Solution:** Set up GitHub authentication using one of the methods above.

### Issue: "Failed to push branch"

**Possible causes:**
- Network connectivity issues
- Git authentication not configured for the cached repository
- Remote repository access denied

**Solution:** 
1. Check your network connection
2. Ensure git is configured with proper credentials
3. Check that you have access to fork/push to the repository

### Issue: "Failed to create pull request"

**Possible causes:**
- Invalid GitHub token
- Token lacks `repo` scope
- GitHub API rate limits

**Solution:**
1. Verify your token is valid
2. Ensure token has `repo` scope
3. Wait if rate limited (resets hourly)

### Issue: Changes not detected

**Possible causes:**
- Contribution feature disabled
- Files unchanged (MD5 hash comparison)
- Files not in `.ai-ley/shared/` directory

**Solution:**
1. Check `aiLey.contribute.enabled` is `true`
2. Ensure files are actually modified
3. Verify files are in `.ai-ley/shared/` subdirectory

## Privacy & Security

### What gets shared?

- Only files in `.ai-ley/shared/` directory
- File paths relative to `.ai-ley/shared/`
- Your workspace name (in commit message and PR description)

### What doesn't get shared?

- Project-specific code
- Environment variables
- Private configurations outside `.ai-ley/shared/`
- Workspace-specific files

### Disabling Contributions

If you want to use AI-Ley but never contribute back:

1. Set `aiLey.contribute.enabled` to `false` in settings
2. All other features continue to work normally
3. You still receive updates from the main repository

## Contributing Guidelines

When contributing changes:

1. **Test your changes** before they're contributed
2. **Keep changes relevant** to the shared configuration purpose
3. **Document complex changes** with comments
4. **Be respectful** of the community standards

The AI-Ley maintainers will review all pull requests and may:
- Request changes
- Suggest improvements
- Merge as-is
- Close if not appropriate

## Version History

### 2.2.9
- ✨ Added contribution feature
- ✨ Auto-detect changes in `.ai-ley/shared/`
- ✨ Auto-create pull requests to ai-ley repository
- ✨ Backup contributed files to `.my/shared/`
- ⚙️ Added `aiLey.contribute.enabled` configuration option
