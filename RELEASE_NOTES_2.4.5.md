# AI-Ley Extension v2.4.5 - Release Notes

## 🚀 New Feature: Periodic Cache Monitoring

### The Problem
Users reported that even with `aiLey.autoInit.existingProjects` enabled, projects with `.ai-ley` but missing `.cache/ai-ley` were not automatically getting the cache deployed.

### The Solution
Added a background monitoring task that checks every **1 minute** for missing cache directories and automatically triggers deployment.

## ✨ Features

### Automatic Cache Recovery
- **Frequency**: Checks every 60 seconds (1 minute)
- **Scope**: All open workspaces
- **Trigger**: Missing `.cache/ai-ley` when `.ai-ley` exists and `autoInit.existingProjects` is enabled
- **Action**: Automatically runs force update to clone and deploy cache

### User Notifications
When cache is detected as missing, you'll see:
```
AI-Ley: Deploying missing cache for project "{project-name}"
```

### Smart Monitoring
The monitor will:
- ✅ Skip parent ai-ley repository
- ✅ Only run when `autoInit.existingProjects` is enabled
- ✅ Respect project pattern matching
- ✅ Stop when workspace is closed
- ✅ Clean up resources on extension deactivation

## 🔧 Technical Implementation

### New Function: `checkForMissingCache()`
```typescript
async function checkForMissingCache(
  context: vscode.ExtensionContext, 
  syncStatus: vscode.StatusBarItem
): Promise<void>
```

This function:
1. Checks if workspace is open
2. Verifies it's not the parent repository
3. Confirms `autoInit.existingProjects` is enabled
4. Detects missing cache when `.ai-ley` exists
5. Triggers `updateScheduler.forceUpdate()` if needed

### Background Interval
```typescript
cacheCheckInterval = setInterval(async () => {
  try {
    await checkForMissingCache(context, syncStatus);
  } catch (error) {
    console.error('Cache check failed:', error);
  }
}, 60000); // 1 minute
```

### Cleanup on Deactivation
```typescript
export function deactivate() {
  if (cacheCheckInterval) {
    clearInterval(cacheCheckInterval);
    cacheCheckInterval = undefined;
  }
  // ... other cleanup
}
```

## 📋 Use Cases

### Scenario 1: User Deletes Cache
```
1. User has project with .ai-ley deployed
2. User deletes .cache/ai-ley folder
3. Within 1 minute, extension detects missing cache
4. Notification shown: "Deploying missing cache..."
5. Cache is automatically cloned and deployed
```

### Scenario 2: Incomplete Installation
```
1. User manually copies .ai-ley from another project
2. Cache was never created
3. Within 1 minute of opening workspace
4. Extension detects missing cache
5. Cache is automatically deployed
```

### Scenario 3: Fresh Clone of Project with AI-Ley
```
1. User clones a repository that has .ai-ley committed
2. No .cache/ai-ley exists locally
3. autoInit.existingProjects is enabled
4. Within 1 minute, cache is deployed automatically
```

## ⚙️ Configuration

```json
{
  // Enable this setting for automatic cache monitoring
  "aiLey.autoInit.existingProjects": true,
  
  // Optional: Limit to specific project patterns
  "aiLey.autoInit.projectPattern": ".*",
  
  // Other relevant settings
  "aiLey.update.enabled": true,
  "aiLey.update.interval": 86400
}
```

## 📊 Performance Impact

- **CPU**: Minimal - check runs every 60 seconds
- **Memory**: Negligible - uses existing functions
- **Network**: Only when cache is missing (git clone)
- **Disk I/O**: Minimal - just checking directory existence

## 🔍 Monitoring & Debugging

### Console Logs
Look for these messages in the Output panel (View > Output > AI-Ley):

```
Cache check: Missing cache detected for project: {name}
```

### Status Bar
Watch the sync status bar for these indicators:
- `🔄 AI-Ley: Force updating...` - Cache deployment in progress
- `✅ AI-Ley: Ready` - Cache successfully deployed

## ⚡ Immediate vs Periodic Detection

| Detection Method | When | Scenario |
|-----------------|------|----------|
| On Activation | Workspace opens | New workspace, folder change |
| Every 1 Minute | Background | User deletes cache, manual copy |
| On Force Update | User triggered | Manual intervention |

## 🆕 What's New in v2.4.5

1. **Periodic Cache Check**: Background monitoring every 60 seconds
2. **Proactive Deployment**: No user intervention needed
3. **Resource Cleanup**: Proper interval disposal on deactivation
4. **Error Handling**: Wrapped in try-catch to prevent crashes

## 🔄 Upgrade Path

### From v2.4.4
- No configuration changes needed
- Monitoring starts automatically
- Enable `autoInit.existingProjects` to activate feature

### Testing Your Setup
1. Enable `aiLey.autoInit.existingProjects`
2. Open a project with `.ai-ley` folder
3. Delete `.cache/ai-ley` folder
4. Wait up to 1 minute
5. Watch for deployment notification

## 📝 Notes

- Monitor runs continuously while workspace is open
- First check happens after 1 minute (not immediate)
- Uses existing force update mechanism (reliable)
- Respects all existing settings and patterns
- No impact when cache exists

---

**Version**: 2.4.5  
**Release Date**: October 24, 2025  
**Previous Version**: 2.4.4  
**Key Feature**: Periodic cache monitoring every 1 minute
