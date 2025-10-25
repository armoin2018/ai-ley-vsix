# AI-Ley Extension v2.4.4 - Release Notes

## 🐛 Bug Fix

### Fixed Cache Directory Auto-Initialization
- **Issue**: When launching a workspace where `.cache/ai-ley` folder doesn't exist but `.ai-ley` does exist, the extension was not deploying the AI-Ley project even when `aiLey.autoInit.existingProjects` was enabled
- **Impact**: Users who deleted their cache or had incomplete installations weren't getting proper auto-initialization
- **Fix**: Enhanced the auto-initialization logic to properly detect missing cache and trigger deployment

## 🔧 Technical Changes

### Enhanced Project State Detection

Previously, the extension treated a project as "initialized" if either `.ai-ley` OR `.cache/ai-ley` existed. This caused issues when the cache was missing but the project had AI-Ley files.

**Old Logic:**
```typescript
function isAiLeyInitialized(workspaceRoot: string): boolean {
  return fs.existsSync(aiLeyPath) || fs.existsSync(cachePath);
}
```

**New Logic:**
```typescript
function isAiLeyInitialized(workspaceRoot: string): boolean {
  return fs.existsSync(aiLeyPath); // Only check .ai-ley
}

function hasCacheDirectory(workspaceRoot: string): boolean {
  return fs.existsSync(cachePath); // Separate cache check
}
```

### Enhanced Auto-Initialize Logic

The `shouldAutoInitialize()` function now has three scenarios:

1. **New Project** (no `.ai-ley`): Deploy if `autoInit.newProjects` is enabled
2. **Existing Project** (has `.ai-ley`): Deploy if `autoInit.existingProjects` is enabled AND pattern matches
3. **Existing Project Missing Cache**: Deploy if `autoInit.existingProjects` is enabled AND pattern matches AND cache directory doesn't exist

## 📋 Use Cases

### Scenario 1: Cache Deleted
```
Before: .ai-ley ✓, .cache/ai-ley ✗
Action: User opens workspace
Setting: aiLey.autoInit.existingProjects = true
Result: ✅ Cache is re-cloned and deployed
```

### Scenario 2: Fresh Install
```
Before: .ai-ley ✗, .cache/ai-ley ✗
Action: User opens workspace
Setting: aiLey.autoInit.newProjects = true
Result: ✅ Full deployment as new project
```

### Scenario 3: Complete Setup
```
Before: .ai-ley ✓, .cache/ai-ley ✓
Action: User opens workspace
Setting: aiLey.autoInit.existingProjects = true
Result: ✅ Normal update check, no re-deployment unless updates available
```

### Scenario 4: Partial Setup (Edge Case)
```
Before: .ai-ley ✗, .cache/ai-ley ✓ (very rare)
Action: User opens workspace
Setting: aiLey.autoInit.newProjects = true
Result: ✅ Treated as new project, full deployment
```

## ⚙️ Configuration

The relevant settings for this fix:

```json
{
  // Enable to auto-deploy when cache is missing on existing projects
  "aiLey.autoInit.existingProjects": true,
  
  // Pattern to match project names (default matches all)
  "aiLey.autoInit.projectPattern": ".*",
  
  // Enable for new projects without AI-Ley
  "aiLey.autoInit.newProjects": false
}
```

## 🚀 Upgrade Notes

- No breaking changes
- Existing configurations continue to work
- Better automatic recovery when cache is deleted
- More reliable initialization for existing projects

## 📝 Developer Notes

### Files Modified
- `src/extension.ts`:
  - Split `isAiLeyInitialized()` to only check `.ai-ley`
  - Added `hasCacheDirectory()` helper function
  - Enhanced `shouldAutoInitialize()` with cache check logic

### Testing Checklist
- [x] New project without any AI-Ley files
- [x] Existing project with `.ai-ley` but no cache
- [x] Existing project with both `.ai-ley` and cache
- [x] Project pattern matching
- [x] TypeScript compilation successful

## 🔄 Migration Path

If you're experiencing issues with missing cache:

1. **Option 1 (Automatic)**: 
   - Enable `aiLey.autoInit.existingProjects`
   - Reload workspace
   - Cache will be automatically re-cloned

2. **Option 2 (Manual)**:
   - Click the AI-Ley sync status bar item
   - OR run "AI-Ley: Force Update from Repository"
   - Cache will be cloned and synced

3. **Option 3 (Clean)**: 
   - Delete `.cache` folder
   - Enable `aiLey.autoInit.existingProjects`
   - Reload workspace

---

**Version**: 2.4.4  
**Release Date**: October 24, 2025  
**Previous Version**: 2.4.3  
**Related Issues**: Cache deployment, auto-initialization
