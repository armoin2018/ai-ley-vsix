# AI-Ley Extension v2.7.0 Release Notes

**Release Date**: October 26, 2025

## 🛡️ Major Safety Improvements

This release introduces comprehensive file safety measures to protect existing user files, particularly in the `.project` directory.

### New Features

#### Automatic Backup System
- **Backup Creation**: Automatically creates timestamped backups before overwriting existing files
- **Smart Protection**: Special protection for `.project` directory files
- **Backup Format**: Uses safe timestamp format: `filename.backup-YYYY-MM-DDTHH-MM-SS-sssZ`
- **Conditional Backups**: Only creates backups when files actually differ (MD5 comparison)

#### Enhanced Configuration Controls
- **New Setting**: `aiLey.safety.createBackups` (default: `true`)
  - Controls whether backup copies are created before file overwrites
  - Workspace-level configuration
  - Enabled by default for maximum safety

#### Backup Management
- **New Command**: `AI-Ley: Cleanup Old Backup Files`
  - Removes backup files older than 7 days
  - Available in Command Palette
  - Shows progress indication and user feedback
- **Automatic Cleanup**: Built-in cleanup logic prevents backup accumulation

#### Directory Protection
- **Enhanced Protection**: `.project` directory now has same protection level as `.ai-ley`
- **Structure Preservation**: Directory structure integrity maintained during operations
- **Safe Updates**: Individual files can be updated while preserving directory

### Technical Improvements

#### ConfigurationManager Enhancements
- `createBackup()` - Creates timestamped backup copies
- `isProtectedProjectFile()` - Identifies files needing special protection
- `cleanupOldBackups()` - Manages backup file lifecycle
- Enhanced `copyFile()` and `copyDirectory()` methods with backup support

#### Extension Commands
- Added `aiLey.cleanupBackups` command with progress indication
- Proper error handling and user feedback
- Integration with existing command infrastructure

### Safety Guarantees

- ✅ **No Data Loss**: Existing files are always backed up before overwrite
- ✅ **Recovery Options**: Users can restore from timestamped backups
- ✅ **User Control**: Backup behavior is fully configurable
- ✅ **Transparent Operations**: Clear logging and notifications
- ✅ **Backward Compatible**: No breaking changes to existing functionality

## Configuration Changes

### New Settings Added

```json
{
  "aiLey.safety.createBackups": {
    "type": "boolean",
    "default": true,
    "description": "Create backup copies of existing files before overwriting them during synchronization. Recommended for preserving existing .project files."
  }
}
```

### New Commands Added

- `aiLey.cleanupBackups` - "AI-Ley: Cleanup Old Backup Files"

## Upgrade Notes

### For Existing Users
- **Automatic Protection**: Backup creation is enabled by default
- **No Configuration Required**: Works immediately after update
- **Existing Files Safe**: All current `.project` files are automatically protected
- **Opt-out Available**: Can disable backups via settings if needed

### For New Installations
- **Safety by Default**: Maximum protection enabled from first use
- **Guided Experience**: Clear messaging about backup operations
- **Maintenance Tools**: Built-in cleanup commands available

## Usage Examples

### Backup Creation
When AI-Ley updates a file in `.project/`, you'll see:
```
AI-Ley: Created backup of existing file: /path/to/.project/PLAN.md.backup-2025-10-26T14-30-00-000Z
```

### Manual Cleanup
Use Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`):
1. Search for "AI-Ley: Cleanup Old Backup Files"
2. Execute to remove backups older than 7 days
3. Get feedback: "AI-Ley: Cleaned up 5 old backup files"

### Settings Configuration
```json
{
  "aiLey.safety.createBackups": false  // Disable backup creation
}
```

## Impact Assessment

### Performance
- **Minimal Impact**: Backup creation adds negligible overhead
- **Smart Operations**: Only creates backups when files actually differ
- **Efficient Cleanup**: Automatic cleanup prevents disk space issues

### Storage
- **Backup Size**: Backups are full copies of original files
- **Automatic Management**: 7-day retention policy prevents accumulation
- **User Control**: Manual cleanup available when needed

## Breaking Changes

**None** - This release is fully backward compatible.

## Bug Fixes

- Enhanced error handling in file synchronization operations
- Improved user feedback for file operations
- Better logging for debugging file sync issues

## Technical Details

### File Protection Logic
1. Check if file exists and is in `.project` directory
2. Compare MD5 hashes to determine if update needed
3. Create timestamped backup if file will be overwritten
4. Perform file copy operation
5. Log backup creation for user awareness

### Backup Filename Convention
```
original-filename.backup-YYYY-MM-DDTHH-MM-SS-sssZ
```
Example: `PLAN.md.backup-2025-10-26T14-30-00-123Z`

## Documentation

- **New Documentation**: `PROJECT_FILE_SAFETY.md` provides comprehensive safety guide
- **Updated README**: Includes safety feature information
- **Configuration Guide**: Updated with new settings

## Next Steps

This release establishes a foundation for enhanced file safety. Future versions may include:
- Selective file protection rules
- Backup compression options
- Restore interface for easier recovery
- Enhanced retention policies

---

**Download**: Available on VS Code Marketplace
**Support**: Report issues on [GitHub](https://github.com/armoin2018/ai-ley-vsix/issues)
**Documentation**: See `PROJECT_FILE_SAFETY.md` for detailed safety information