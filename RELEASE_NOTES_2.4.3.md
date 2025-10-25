# AI-Ley Extension v2.4.3 - Release Notes

## 🐛 Bug Fixes

### Fixed Asset Deployment for New Projects
- **Issue**: The latest update was not deploying AI-Ley assets to newly created projects when auto-init for new projects was enabled
- **Fix**: Modified the initialization flow to properly force sync when `aiLey.autoInit.newProjects` is enabled
- **Impact**: When you open a new workspace with auto-init enabled, the AI-Ley project files will now be properly deployed to the workspace

### Enhanced Force Update Functionality
- **Improvement**: The "Force Update" command (accessible via the sync status bar item or command palette) now works independently of auto-init settings
- **Usage**: Click on the sync status bar item or run `AI-Ley: Force Update from Repository` command to manually update AI-Ley configurations at any time
- **Benefit**: Users can now manually trigger updates even when auto-init is disabled

## 🔧 Technical Changes

### Extension Initialization
- Updated `initializeManagers()` to accept a `forceInitialSync` parameter
- Modified workspace folder change handler to properly trigger initialization for new workspaces
- Enhanced `shouldAutoInitialize()` logic to correctly identify when to deploy assets

### Update Scheduler
- Enhanced `UpdateScheduler.start()` to accept a `forceInitialSync` boolean parameter
- Modified `checkAndUpdate()` to support forced synchronization when auto-initialization is triggered
- Improved status messages during initialization and update processes

## 📝 Configuration

The following settings control auto-initialization behavior:

- `aiLey.autoInit.newProjects`: Automatically initialize AI-Ley for new projects (default: `false`)
- `aiLey.autoInit.existingProjects`: Automatically initialize AI-Ley for existing projects matching the pattern (default: `false`)
- `aiLey.autoInit.projectPattern`: Regex pattern to match project names for auto-initialization (default: `".*"`)

## 🚀 Usage

### For New Projects
1. Enable `aiLey.autoInit.newProjects` in settings
2. Open a new workspace/folder
3. AI-Ley will automatically clone the repository and deploy all configured assets

### Force Update
1. Click on the AI-Ley sync status bar item (shows sync icon)
2. OR run `AI-Ley: Force Update from Repository` from the command palette
3. This works regardless of auto-init settings

## 🔄 Upgrade Notes

- No breaking changes
- Existing configurations will continue to work as before
- The fix ensures that auto-init now works as originally intended

---

**Version**: 2.4.3  
**Release Date**: October 22, 2025  
**Previous Version**: 2.4.2
