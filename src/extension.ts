import { promises as fsPromises } from 'fs';
import * as fs from 'fs';
import fetch from 'node-fetch';
import * as path from 'path';
import * as vscode from 'vscode';
import { ConfigurationManager } from './ConfigurationManager';
import { GitHubRepoManager } from './GitHubRepoManager';
import { UpdateScheduler } from './UpdateScheduler';
import { ContributionManager } from './ContributionManager';

// Log immediately when module loads
console.log('');
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║  AI-LEY EXTENSION MODULE LOADED                                ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log('');

let currentPanel: vscode.WebviewPanel | undefined;

interface WorkspaceServices {
  updateScheduler?: UpdateScheduler;
  repoManager?: GitHubRepoManager;
  configManager?: ConfigurationManager;
  contributionManager?: ContributionManager;
  logFilePath?: string;
  logInitialized?: boolean;
}

const workspaceServices = new Map<string, WorkspaceServices>();

const MCP_CONFIG_FILENAME = 'mcp.json';
const MCP_CONFIG_FOLDER = '.vscode';

/**
 * Retrieve or create the service container for a workspace.
 */
function getWorkspaceServices(workspaceRoot: string): WorkspaceServices {
  let services = workspaceServices.get(workspaceRoot);
  if (!services) {
    services = {};
    workspaceServices.set(workspaceRoot, services);
  }
  return services;
}

/**
 * Initialize logging for the workspace
 */
function initializeLogging(workspaceRoot: string): void {
  const services = getWorkspaceServices(workspaceRoot);

  try {
    const logFilePath = path.join(workspaceRoot, 'ai-ley.log');
    const timestamp = new Date().toISOString();
    const header = `${'='.repeat(80)}\n[${timestamp}] AI-Ley Extension Session Started\n[${timestamp}] Workspace: ${workspaceRoot}\n[${timestamp}] Log File: ${logFilePath}\n${'='.repeat(80)}\n`;

    // Check if workspace root exists and is writable
    if (!fs.existsSync(workspaceRoot)) {
      console.error(`[AI-Ley] Workspace root does not exist: ${workspaceRoot}`);
      services.logInitialized = false;
      return;
    }

    fs.writeFileSync(logFilePath, header, 'utf8');
    services.logFilePath = logFilePath;
    services.logInitialized = true;

    console.log(`[AI-Ley] Logging initialized: ${logFilePath}`);
    log(`Logging initialized successfully`, workspaceRoot);
  } catch (error) {
    services.logInitialized = false;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[AI-Ley] Failed to initialize logging for ${workspaceRoot}:`, errorMessage);
    console.error('[AI-Ley] Error details:', error);
  }
}

/**
 * Log message to ai-ley.log file in workspace
 */
function log(message: string, workspaceRoot?: string): void {
  if (!workspaceRoot) {
    logGlobal(message);
    return;
  }

  const services = workspaceServices.get(workspaceRoot);
  if (!services || !services.logInitialized || !services.logFilePath) {
    // Fall back to console if logging not initialized
    console.log(`[AI-Ley][${workspaceRoot}] ${message}`);
    return;
  }

  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  try {
    fs.appendFileSync(services.logFilePath, logMessage, 'utf8');
  } catch (error) {
    // Silently fall back to console
    console.log(`[AI-Ley][${workspaceRoot}] ${message}`);
  }
}

function logGlobal(message: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[AI-Ley][${timestamp}] ${message}`);
}

function getWorkspaceRoot(): string | undefined {
  return vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : undefined;
}

async function fileExists(targetPath: string): Promise<boolean> {
  try {
    await fsPromises.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function writeMcpConfig(serverUrl: string): Promise<void> {
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    vscode.window.showWarningMessage('AI-Ley: Cannot create mcp.json without an open workspace');
    return;
  }

  const vscodeDir = path.join(workspaceRoot, MCP_CONFIG_FOLDER);
  const mcpPath = path.join(vscodeDir, MCP_CONFIG_FILENAME);

  await fsPromises.mkdir(vscodeDir, { recursive: true });
  const iconUrl = 'https://raw.githubusercontent.com/armoin2018/ai-ley/main/icon.png';

  const mcpConfig = {
    servers: {
      'ai-ley': {
        type: 'http',
        url: serverUrl,
        name: 'AI-Ley MCP Server',
        description: 'AI-Ley Model Context Protocol server',
        icon: iconUrl,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    }
  };

  await fsPromises.writeFile(mcpPath, JSON.stringify(mcpConfig, null, 2), 'utf8');
}

async function removeMcpConfig(): Promise<void> {
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    return;
  }

  const mcpPath = path.join(workspaceRoot, MCP_CONFIG_FOLDER, MCP_CONFIG_FILENAME);
  if (await fileExists(mcpPath)) {
    await fsPromises.unlink(mcpPath);
  }
}

/**
 * Check if AI-Ley MCP extension is installed and active
 */
async function checkMcpExtension(): Promise<boolean> {
  const mcpExtension = vscode.extensions.getExtension('armoin.ai-ley-mcp') || 
                      vscode.extensions.getExtension('ai-ley-mcp') ||
                      vscode.extensions.getExtension('ai-ley.mcp');
  
  if (mcpExtension) {
    if (!mcpExtension.isActive) {
      try {
        await mcpExtension.activate();
      } catch (error) {
        console.log('Failed to activate AI-Ley MCP extension:', error);
        return false;
      }
    }
    return true;
  }
  return false;
}

/**
 * Get the current project/repository name
 */
function getProjectName(): string {
  if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
    return 'unknown-project';
  }

  const workspaceFolder = vscode.workspace.workspaceFolders[0];
  const workspaceName = workspaceFolder.name;
  
  // Clean the project name to be URL-safe
  return workspaceName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
}

/**
 * Append ProjectName parameter to MCP URL
 */
function appendProjectNameToUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const projectName = getProjectName();
    
    // Add ProjectName parameter
    urlObj.searchParams.set('ProjectName', projectName);
    
    return urlObj.toString();
  } catch (error) {
    // If URL parsing fails, return original URL
    console.error('Failed to parse MCP URL:', error);
    return url;
  }
}

/**
 * Check if current workspace is the parent ai-ley repository
 */
async function isParentAiLeyRepo(workspaceRoot: string): Promise<boolean> {
  try {
    const packageJsonPath = path.join(workspaceRoot, 'package.json');
    if (await fileExists(packageJsonPath)) {
      const content = await fsPromises.readFile(packageJsonPath, 'utf8');
      const pkg = JSON.parse(content);
      // Check if this is the ai-ley parent project
      if (pkg.repository && typeof pkg.repository === 'object') {
        const repoUrl = pkg.repository.url || '';
        // Match exact repository: armoin2018/ai-ley (with or without .git)
        return /armoin2018\/ai-ley(\.git)?$/i.test(repoUrl);
      }
      if (pkg.repository && typeof pkg.repository === 'string') {
        // Match exact repository: armoin2018/ai-ley (with or without .git)
        return /armoin2018\/ai-ley(\.git)?$/i.test(pkg.repository);
      }
    }
    
    // Also check .git/config for remote origin
    const gitConfigPath = path.join(workspaceRoot, '.git', 'config');
    if (await fileExists(gitConfigPath)) {
      const gitConfig = await fsPromises.readFile(gitConfigPath, 'utf8');
      // Match exact repository: armoin2018/ai-ley (with or without .git)
      return /armoin2018\/ai-ley(\.git)?$/im.test(gitConfig);
    }
  } catch (error) {
    console.error('Error checking if parent ai-ley repo:', error);
  }
  return false;
}

/**
 * Check if AI-Ley is already initialized in the workspace
 */
function isAiLeyInitialized(workspaceRoot: string): boolean {
  const fs = require('fs');
  const aiLeyPath = path.join(workspaceRoot, '.ai-ley');
  
  // Check if .ai-ley directory exists (the main indicator)
  return fs.existsSync(aiLeyPath);
}

/**
 * Check if the cache directory exists (using configured cache directory)
 */
function hasCacheDirectory(workspaceRoot: string, workspaceFolder?: vscode.WorkspaceFolder): boolean {
  const configurationScope = workspaceFolder ? workspaceFolder.uri : undefined;
  const config = vscode.workspace.getConfiguration('aiLey', configurationScope);
  const cacheDir = config.get<string>('cache.directory') || '.cache/ai-ley';
  
  // Resolve cache directory path
  const cachePath = path.isAbsolute(cacheDir) ? cacheDir : path.join(workspaceRoot, cacheDir);
  
  const exists = fs.existsSync(cachePath);
  log(`Cache directory check: ${cachePath} - Exists: ${exists}`, workspaceRoot);
  
  return exists;
}

/**
 * Check if project matches auto-init pattern
 */
function projectMatchesPattern(projectName: string, pattern: string): boolean {
  try {
    const regex = new RegExp(pattern);
    return regex.test(projectName);
  } catch (error) {
    console.error('Invalid regex pattern:', pattern, error);
    return false;
  }
}

/**
 * Check if AI-Ley should auto-initialize for this workspace
 */
async function shouldAutoInitialize(
  workspaceRoot: string,
  projectName: string,
  workspaceFolder: vscode.WorkspaceFolder,
): Promise<boolean> {
  log('=== shouldAutoInitialize START ===', workspaceRoot);
  log(`Workspace: ${workspaceRoot}`, workspaceRoot);
  log(`Project Name: ${projectName}`, workspaceRoot);
  
  const config = vscode.workspace.getConfiguration('aiLey', workspaceFolder.uri);
  const isInitialized = isAiLeyInitialized(workspaceRoot);
  const hasCache = hasCacheDirectory(workspaceRoot, workspaceFolder);
  
  log(`Is Initialized (.ai-ley exists): ${isInitialized}`, workspaceRoot);
  log(`Has Cache: ${hasCache}`, workspaceRoot);
  
  // New project - check if auto-init is enabled for new projects
  if (!isInitialized) {
    const autoInitNew = config.get<boolean>('autoInit.newProjects', false);
    log(`Auto-init for new projects: ${autoInitNew}`, workspaceRoot);
    
    if (autoInitNew) {
      log('✓ SHOULD INITIALIZE: New project with auto-init enabled', workspaceRoot);
      log('=== shouldAutoInitialize END ===', workspaceRoot);
      return true;
    }
    
    log('✗ SHOULD NOT INITIALIZE: New project but auto-init disabled', workspaceRoot);
    log('=== shouldAutoInitialize END ===', workspaceRoot);
    return false;
  }
  
  // Existing project - check if auto-init is enabled for existing projects
  const autoInitExisting = config.get<boolean>('autoInit.existingProjects', false);
  log(`Auto-init for existing projects: ${autoInitExisting}`, workspaceRoot);
  
  if (!autoInitExisting) {
    log('✗ SHOULD NOT INITIALIZE: Existing project but auto-init disabled', workspaceRoot);
    log('=== shouldAutoInitialize END ===', workspaceRoot);
    return false;
  }
  
  // Check if project matches the pattern
  const pattern = config.get<string>('autoInit.projectPattern', '.*');
  log(`Project pattern: ${pattern}`, workspaceRoot);
  
  const matches = projectMatchesPattern(projectName, pattern);
  log(`Project matches pattern: ${matches}`, workspaceRoot);
  
  if (!matches) {
    log('✗ SHOULD NOT INITIALIZE: Project does not match pattern', workspaceRoot);
    log('=== shouldAutoInitialize END ===', workspaceRoot);
    return false;
  }
  
  // At this point: existing project, auto-init enabled, pattern matches
  // Initialize if cache is missing or always (based on logic)
  if (!hasCache) {
    log('✓ SHOULD INITIALIZE: Existing project with missing cache', workspaceRoot);
  } else {
    log('✓ SHOULD INITIALIZE: Existing project with auto-init enabled and pattern matched', workspaceRoot);
  }
  
  log('=== shouldAutoInitialize END ===', workspaceRoot);
  return true;
}

/**
 * Check workspace for missing cache and trigger deployment if needed
 */
async function checkForMissingCache(
  context: vscode.ExtensionContext, 
  syncStatus: vscode.StatusBarItem,
  specificWorkspace?: string
): Promise<void> {
  logGlobal('=== checkForMissingCache START ===');
  
  if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
    logGlobal('No workspace folders open');
    logGlobal('=== checkForMissingCache END ===');
    return;
  }

  // Determine which workspaces to check
  const foldersToCheck = specificWorkspace 
    ? vscode.workspace.workspaceFolders.filter(f => f.uri.fsPath === specificWorkspace)
    : vscode.workspace.workspaceFolders;

  logGlobal(`Checking ${foldersToCheck.length} workspace folder(s)`);

  for (const folder of foldersToCheck) {
    const workspaceRoot = folder.uri.fsPath;
    const projectName = folder.name;
    
  log(`\nChecking workspace: ${workspaceRoot}`, workspaceRoot);
  log(`Project Name: ${projectName}`, workspaceRoot);

    // Skip if parent repository
    const isParent = await isParentAiLeyRepo(workspaceRoot);
  log(`Is parent repository: ${isParent}`, workspaceRoot);
    
    if (isParent) {
      log('Skipping parent repository', workspaceRoot);
      continue;
    }

    // Check if auto-init for existing projects is enabled
    const config = vscode.workspace.getConfiguration('aiLey', folder.uri);
    const autoInitExisting = config.get<boolean>('autoInit.existingProjects', false);
    
  log(`Auto-init for existing projects: ${autoInitExisting}`, workspaceRoot);
    
    if (!autoInitExisting) {
      log('Auto-init for existing projects is disabled', workspaceRoot);
      continue;
    }

    // Check if project has .ai-ley but is missing cache
    const isInitialized = isAiLeyInitialized(workspaceRoot);
  const hasCache = hasCacheDirectory(workspaceRoot, folder);
    
  log(`Is initialized (.ai-ley exists): ${isInitialized}`, workspaceRoot);
  log(`Has cache: ${hasCache}`, workspaceRoot);

    if (isInitialized && !hasCache) {
      const pattern = config.get<string>('autoInit.projectPattern', '.*');
      const matches = projectMatchesPattern(projectName, pattern);
      
  log(`Project pattern: ${pattern}`, workspaceRoot);
  log(`Project matches pattern: ${matches}`, workspaceRoot);
      
      if (matches) {
        log('✓ DEPLOYING CACHE: Missing cache detected for existing project', workspaceRoot);
        vscode.window.showInformationMessage(`AI-Ley: Deploying missing cache for project "${projectName}"`);
        
        // Trigger force update to deploy cache
        const services = workspaceServices.get(workspaceRoot);
        if (services?.updateScheduler) {
          await services.updateScheduler.forceUpdate();
          log('Force update completed', workspaceRoot);
        } else {
          log('ERROR: updateScheduler not available', workspaceRoot);
        }
      } else {
        log('✗ NOT DEPLOYING: Project does not match pattern', workspaceRoot);
      }
    } else {
      if (!isInitialized) {
        log('✗ NOT DEPLOYING: Project not initialized (.ai-ley missing)', workspaceRoot);
      }
      if (hasCache) {
        log('✗ NOT DEPLOYING: Cache already exists', workspaceRoot);
      }
    }
  }
  
  logGlobal('=== checkForMissingCache END ===');
}

export async function activate(context: vscode.ExtensionContext) {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  AI-LEY: EXTENSION ACTIVATION STARTED                          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  logGlobal('AI-Ley Extension Activation Started');

  // Create and show a status bar item for dashboard
  const dashboardStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  dashboardStatus.text = '$(globe) AI-Ley: Connecting...';
  dashboardStatus.tooltip = 'Click to open AI-Ley dashboard';
  dashboardStatus.command = 'aiLey.openDashboard';
  dashboardStatus.show();
  context.subscriptions.push(dashboardStatus);
  console.log('  ✓ AI-LEY: Dashboard status bar item created and shown');

  // Create and show a status bar item for configuration sync
  const syncStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
  syncStatus.text = '$(sync) AI-Ley: Initializing...';
  syncStatus.tooltip = 'Click to sync AI-Ley configurations';
  syncStatus.command = 'aiLey.syncConfigurations';
  syncStatus.show();
  context.subscriptions.push(syncStatus);
  console.log('  ✓ AI-LEY: Sync status bar item created and shown');

  // Create and show a status bar item for force update
  const updateStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 98);
  updateStatus.text = '$(cloud-download) AI-Ley';
  updateStatus.tooltip = 'Click to force update from repository';
  updateStatus.command = 'aiLey.forceUpdate';
  updateStatus.show();
  context.subscriptions.push(updateStatus);
  console.log('  ✓ AI-LEY: Update status bar item created and shown');

  // Create and show a status bar item for manual refresh with status
  const refreshStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  refreshStatus.text = '$(sync~spin) AI-Ley: Starting...';
  refreshStatus.tooltip = 'AI-Ley is starting up...';
  refreshStatus.command = 'aiLey.refresh';
  refreshStatus.show();
  context.subscriptions.push(refreshStatus);
  console.log('  ✓ AI-LEY: Refresh status bar item created and shown');

  // Initialize logging and managers for ALL workspace folders
  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
  logGlobal(`Found ${vscode.workspace.workspaceFolders.length} workspace folder(s)`);
    
    let processedCount = 0;
    const totalFolders = vscode.workspace.workspaceFolders.length;
    
    for (const folder of vscode.workspace.workspaceFolders) {
      const workspaceRoot = folder.uri.fsPath;
      const projectName = folder.name;
      
      processedCount++;
      
  // Initialize logging for this workspace before logging messages
  initializeLogging(workspaceRoot);

      // Update refresh status to show progress
      refreshStatus.text = `$(sync~spin) AI-Ley: Initializing (${processedCount}/${totalFolders})`;
      refreshStatus.tooltip = `Processing workspace: ${projectName}`;
      
  log(`\n${'='.repeat(80)}`, workspaceRoot);
  log(`Processing workspace: ${workspaceRoot}`, workspaceRoot);
  log(`Project name: ${projectName}`, workspaceRoot);
      
      // Log configuration for this workspace
      const config = vscode.workspace.getConfiguration('aiLey', folder.uri);
  log(`Configuration - Cache Directory: ${config.get<string>('cache.directory', '.cache/ai-ley')}`, workspaceRoot);
  log(`Configuration - Auto-init New Projects: ${config.get<boolean>('autoInit.newProjects', false)}`, workspaceRoot);
  log(`Configuration - Auto-init Existing Projects: ${config.get<boolean>('autoInit.existingProjects', false)}`, workspaceRoot);
  log(`Configuration - Project Pattern: ${config.get<string>('autoInit.projectPattern', '.*')}`, workspaceRoot);
      
      // Check if this is the parent ai-ley repository
      const isParentRepo = await isParentAiLeyRepo(workspaceRoot);
  log(`Is parent ai-ley repository: ${isParentRepo}`, workspaceRoot);
      
      if (isParentRepo) {
        // Don't modify files in the parent ai-ley repository
        log('Parent repository detected - skipping file modifications', workspaceRoot);
        continue;
      }
      
      // Check if AI-Ley should auto-initialize
      const shouldInit = await shouldAutoInitialize(workspaceRoot, projectName, folder);
      log(`Should auto-initialize: ${shouldInit}`, workspaceRoot);
      
      // Initialize managers for this workspace
      await initializeManagers(context, workspaceRoot, syncStatus, shouldInit, folder);
      
      if (shouldInit) {
        // Show notification about auto-initialization
        const isNew = !isAiLeyInitialized(workspaceRoot);
        const message = isNew 
          ? `AI-Ley: Auto-initializing for new project "${projectName}"`
          : `AI-Ley: Auto-initializing for project "${projectName}"`;
        log(`Showing notification: ${message}`, workspaceRoot);
        vscode.window.showInformationMessage(message);
      }

      // Perform immediate cache check on activation
      log('Performing immediate cache check on activation', workspaceRoot);
      await checkForMissingCache(context, syncStatus, workspaceRoot);
      
      log(`Finished processing workspace: ${workspaceRoot}`, workspaceRoot);
    }
    
    // Set final ready state
    refreshStatus.text = '$(refresh) AI-Ley';
    refreshStatus.tooltip = 'Click to refresh AI-Ley (check cache and sync configurations)';
    logGlobal('All workspaces processed - AI-Ley ready');
  } else {
    logGlobal('No workspace folders available');
    refreshStatus.text = '$(refresh) AI-Ley';
    refreshStatus.tooltip = 'Click to refresh AI-Ley (check cache and sync configurations)';
  }

  // Load initial config and connect
  await initializeDashboard(context, dashboardStatus);

  // Command to reopen dashboard manually
  const dashboardCmd = vscode.commands.registerCommand('aiLey.openDashboard', async () => {
    const config = vscode.workspace.getConfiguration('aiLey');
    const mcpEnabled = config.get<boolean>('mcp.enabled', false);
    const mcpAvailable = await checkMcpExtension();
    
    const baseDashboardUrl = config.get<string>('dashboardUrl') || 'http://localhost:1880/dashboard';
    let dashboardUrl: string;
    
    if (mcpEnabled && mcpAvailable) {
      dashboardUrl = appendProjectNameToUrl(baseDashboardUrl);
    } else {
      dashboardUrl = baseDashboardUrl;
    }
    
    openDashboard(context, dashboardUrl);
  });
  context.subscriptions.push(dashboardCmd);

  // Command to sync configurations manually
  const syncCmd = vscode.commands.registerCommand('aiLey.syncConfigurations', async () => {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
      vscode.window.showErrorMessage('AI-Ley: No workspace folder open');
      return;
    }

    const agenticConfig = ConfigurationManager.getAgenticConfig();
    const failures: string[] = [];

    await Promise.all(
      vscode.workspace.workspaceFolders.map(async (folder) => {
        const workspaceRoot = folder.uri.fsPath;
        const services = workspaceServices.get(workspaceRoot);

        if (!services?.configManager) {
          const message = 'Config manager not available for manual sync';
          log(message, workspaceRoot);
          failures.push(`${folder.name}: ${message}`);
          return;
        }

        try {
          await services.configManager.syncConfigurations(agenticConfig);
          log('Manual configuration sync completed', workspaceRoot);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          log(`ERROR in manual sync: ${errorMessage}`, workspaceRoot);
          failures.push(`${folder.name}: ${errorMessage}`);
        }
      }),
    );

    if (failures.length > 0) {
      vscode.window.showErrorMessage(`AI-Ley sync failed for: ${failures.join('; ')}`);
    } else {
      vscode.window.showInformationMessage('AI-Ley: Configurations synced for all workspaces');
    }
  });
  context.subscriptions.push(syncCmd);

  // Command to force update from repository
  const forceUpdateCmd = vscode.commands.registerCommand('aiLey.forceUpdate', async () => {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
      vscode.window.showErrorMessage('AI-Ley: No workspace folder open');
      return;
    }

    const failures: string[] = [];

    await Promise.all(
      vscode.workspace.workspaceFolders.map(async (folder) => {
        const workspaceRoot = folder.uri.fsPath;
        const services = workspaceServices.get(workspaceRoot);

        if (!services?.updateScheduler) {
          const message = 'Update scheduler not available';
          log(message, workspaceRoot);
          failures.push(`${folder.name}: ${message}`);
          return;
        }

        try {
          log('Manual force update started', workspaceRoot);
          await services.updateScheduler.forceUpdate();
          log('Manual force update completed', workspaceRoot);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          log(`ERROR in manual force update: ${errorMessage}`, workspaceRoot);
          failures.push(`${folder.name}: ${errorMessage}`);
        }
      }),
    );

    if (failures.length > 0) {
      vscode.window.showErrorMessage(`AI-Ley force update failed for: ${failures.join('; ')}`);
    } else {
      vscode.window.showInformationMessage('AI-Ley: Force update completed for all workspaces');
    }
  });
  context.subscriptions.push(forceUpdateCmd);

  // Command to refresh (check cache and sync)
  const refreshCmd = vscode.commands.registerCommand('aiLey.refresh', async () => {
    logGlobal('=== aiLey.refresh command triggered ===');
    
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
      logGlobal('ERROR: No workspace folder open');
      vscode.window.showWarningMessage('AI-Ley: No workspace folder open');
      return;
    }

    try {
      // Update status to show refresh in progress
      refreshStatus.text = '$(sync~spin) AI-Ley: Refreshing...';
      refreshStatus.tooltip = 'Refreshing AI-Ley configurations...';
      
      logGlobal(`Refresh started for ${vscode.workspace.workspaceFolders.length} workspace(s)`);
      vscode.window.showInformationMessage('AI-Ley: Refreshing all workspaces...');
      
      // Check for missing cache and deploy if needed for ALL workspaces
      await checkForMissingCache(context, syncStatus);
      
      // Update status during force update
      refreshStatus.text = '$(sync~spin) AI-Ley: Updating...';
      refreshStatus.tooltip = 'Updating from repository...';
      
      // Also run force update to ensure everything is synced
      const failures: string[] = [];
      await Promise.all(
        vscode.workspace.workspaceFolders.map(async (folder) => {
          const workspaceRoot = folder.uri.fsPath;
          const services = workspaceServices.get(workspaceRoot);

          if (!services?.updateScheduler) {
            const message = 'Update scheduler not available during refresh';
            log(message, workspaceRoot);
            failures.push(`${folder.name}: ${message}`);
            return;
          }

          try {
            log('Running force update during refresh', workspaceRoot);
            await services.updateScheduler.forceUpdate();
            log('Force update during refresh completed', workspaceRoot);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log(`ERROR in refresh force update: ${errorMessage}`, workspaceRoot);
            failures.push(`${folder.name}: ${errorMessage}`);
          }
        }),
      );
      
      // Reset status to ready
      refreshStatus.text = '$(refresh) AI-Ley';
      refreshStatus.tooltip = 'Click to refresh AI-Ley (check cache and sync configurations)';
      
      if (failures.length > 0) {
        logGlobal(`Refresh completed with errors: ${failures.join('; ')}`);
        vscode.window.showErrorMessage(`AI-Ley refresh completed with errors: ${failures.join('; ')}`);
      } else {
        logGlobal('Refresh completed successfully');
        vscode.window.showInformationMessage('AI-Ley: Refresh completed!');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logGlobal(`ERROR in refresh: ${errorMessage}`);
      
      // Reset status even on error
      refreshStatus.text = '$(warning) AI-Ley';
      refreshStatus.tooltip = `Error: ${errorMessage}. Click to retry.`;
      
      vscode.window.showErrorMessage(`AI-Ley refresh failed: ${errorMessage}`);
      
      // Reset to normal after 5 seconds
      setTimeout(() => {
        refreshStatus.text = '$(refresh) AI-Ley';
        refreshStatus.tooltip = 'Click to refresh AI-Ley (check cache and sync configurations)';
      }, 5000);
    }
  });
  context.subscriptions.push(refreshCmd);

  // Command to configure MCP server
  const configureMcpCmd = vscode.commands.registerCommand('aiLey.configureMcpServer', async () => {
    const config = vscode.workspace.getConfiguration('aiLey');
    
    // Get current settings
    const currentEnabled = config.get<boolean>('mcp.enabled', false);
    const currentServerUrl = config.get<string>('mcp.serverUrl', 'http://localhost:1880/mcp');
    const currentDashboardUrl = config.get<string>('dashboardUrl', 'http://localhost:1880/dashboard');
    
    // Ask user if they want to enable MCP
    const enableChoice = await vscode.window.showQuickPick(
      [
        { label: 'Enable MCP Server', description: 'Connect to AI-Ley MCP Server', value: true },
        { label: 'Disable MCP Server', description: 'Use standalone dashboard', value: false }
      ],
      { 
        title: 'AI-Ley MCP Server Configuration',
        placeHolder: currentEnabled ? 'MCP Server is currently enabled' : 'MCP Server is currently disabled'
      }
    );
    
    if (enableChoice === undefined) return;
    
    if (enableChoice.value) {
      // Configure MCP server URL
      const serverUrl = await vscode.window.showInputBox({
        title: 'AI-Ley MCP Server URL',
        prompt: 'Enter the AI-Ley MCP server URL',
        value: currentServerUrl,
        validateInput: (value) => {
          try {
            new URL(value);
            return null;
          } catch {
            return 'Please enter a valid URL';
          }
        }
      });
      
      if (!serverUrl) return;
      
      // Update configuration
      await config.update('mcp.enabled', true, vscode.ConfigurationTarget.Workspace);
      await config.update('mcp.serverUrl', serverUrl, vscode.ConfigurationTarget.Workspace);

      try {
        await writeMcpConfig(serverUrl);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`AI-Ley: Failed to write mcp.json - ${errorMessage}`);
      }
      
      const finalDashboardUrl = appendProjectNameToUrl(currentDashboardUrl);
      vscode.window.showInformationMessage(`AI-Ley: MCP Server configured. Dashboard will include ProjectName=${getProjectName()}`);
      vscode.window.showInformationMessage(`Dashboard URL: ${finalDashboardUrl}`);
    } else {
      // Disable MCP
      await config.update('mcp.enabled', false, vscode.ConfigurationTarget.Workspace);
      try {
        await removeMcpConfig();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`AI-Ley: Failed to remove mcp.json - ${errorMessage}`);
      }
      vscode.window.showInformationMessage('AI-Ley: MCP Server disabled');
    }
  });
  context.subscriptions.push(configureMcpCmd);

  // 🔄 Watch configuration changes
  vscode.workspace.onDidChangeConfiguration(async (event: vscode.ConfigurationChangeEvent) => {
    if (event.affectsConfiguration('aiLey.dashboardUrl') || event.affectsConfiguration('aiLey.mcp')) {
      const config = vscode.workspace.getConfiguration('aiLey');
      const mcpEnabled = config.get<boolean>('mcp.enabled', false);
      const mcpAvailable = await checkMcpExtension();
      const mcpServerUrl = config.get<string>('mcp.serverUrl', 'http://localhost:1880/mcp');

      if (mcpEnabled) {
        try {
          await writeMcpConfig(mcpServerUrl);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          vscode.window.showErrorMessage(`AI-Ley: Failed to update mcp.json - ${errorMessage}`);
        }
      } else {
        try {
          await removeMcpConfig();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          vscode.window.showErrorMessage(`AI-Ley: Failed to remove mcp.json - ${errorMessage}`);
        }
      }
      
      const baseDashboardUrl = config.get<string>('dashboardUrl') || 'http://localhost:1880/dashboard';
      let newUrl: string;
      
      if (mcpEnabled && mcpAvailable) {
        newUrl = appendProjectNameToUrl(baseDashboardUrl);
      } else {
        newUrl = baseDashboardUrl;
      }
      
      vscode.window.showInformationMessage(`AI-Ley Dashboard URL changed to: ${newUrl}`);
      if (currentPanel) {
        // Reload the dashboard with the new URL
        currentPanel.webview.html = getWebviewHtml(newUrl);
        currentPanel.title = 'AI-Ley Dashboard (Updated)';
      } else {
        openDashboard(context, newUrl);
      }
      // Update status bar
      await updateDashboardStatus(dashboardStatus, newUrl);
    }

    // Restart scheduler if update settings change
    if (
      event.affectsConfiguration('aiLey.update.enabled') ||
      event.affectsConfiguration('aiLey.update.interval')
    ) {
      for (const [workspaceRoot, services] of workspaceServices.entries()) {
        if (services.updateScheduler) {
          log('Restarting update scheduler due to configuration change', workspaceRoot);
          services.updateScheduler.restart();
        }
      }
    }

    // Re-sync if agentic settings change
    if (event.affectsConfiguration('aiLey.agentic')) {
      const agenticConfig = ConfigurationManager.getAgenticConfig();
      await Promise.all(
        Array.from(workspaceServices.entries()).map(async ([workspaceRoot, services]) => {
          if (services.configManager) {
            try {
              log('Agentic configuration changed - re-syncing', workspaceRoot);
              await services.configManager.syncConfigurations(agenticConfig);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              log(`ERROR re-syncing agentic configuration: ${errorMessage}`, workspaceRoot);
            }
          }
        }),
      );
    }

    // Reinitialize managers if repository settings change
    if (
      event.affectsConfiguration('aiLey.repository') ||
      event.affectsConfiguration('aiLey.cache.directory')
    ) {
      if (vscode.workspace.workspaceFolders) {
        for (const folder of vscode.workspace.workspaceFolders) {
          await initializeManagers(context, folder.uri.fsPath, syncStatus, false, folder);
        }
      }
    }
  });

  // Watch for workspace folder changes (when user opens a new folder)
  vscode.workspace.onDidChangeWorkspaceFolders(async (event: vscode.WorkspaceFoldersChangeEvent) => {
    logGlobal('=== Workspace folders changed ===');
    logGlobal(`Added: ${event.added.length}, Removed: ${event.removed.length}`);

    // Handle removed workspace folders
    for (const folder of event.removed) {
      const workspaceRoot = folder.uri.fsPath;
      const services = workspaceServices.get(workspaceRoot);
      if (services?.updateScheduler) {
        services.updateScheduler.stop();
        log('Stopped update scheduler for removed workspace', workspaceRoot);
      }
      workspaceServices.delete(workspaceRoot);
    }

    // Handle added workspace folders
    for (const folder of event.added) {
      const workspaceRoot = folder.uri.fsPath;
      const projectName = folder.name;

      // Initialize logging for this workspace before recording logs
      initializeLogging(workspaceRoot);

      log(`\n${'='.repeat(80)}`, workspaceRoot);
      log(`New workspace added: ${workspaceRoot}`, workspaceRoot);
      log(`Project name: ${projectName}`, workspaceRoot);

      // Check if this is the parent ai-ley repository
      const isParentRepo = await isParentAiLeyRepo(workspaceRoot);
      log(`Is parent ai-ley repository: ${isParentRepo}`, workspaceRoot);

      if (isParentRepo) {
        log('Parent repository detected - skipping', workspaceRoot);
        vscode.window.showInformationMessage('AI-Ley: Parent repository detected - extension will not modify files');
        continue;
      }

      // Check if AI-Ley should auto-initialize for this new workspace
      const shouldInit = await shouldAutoInitialize(workspaceRoot, projectName, folder);
      log(`Should auto-initialize: ${shouldInit}`, workspaceRoot);

      if (shouldInit) {
        const isNew = !isAiLeyInitialized(workspaceRoot);
        const message = isNew
          ? `AI-Ley: Auto-initializing for new project "${projectName}"`
          : `AI-Ley: Auto-initializing for project "${projectName}"`;
        log(`Showing notification: ${message}`, workspaceRoot);
        vscode.window.showInformationMessage(message);

        // Initialize managers for the new workspace with forced sync
        await initializeManagers(context, workspaceRoot, syncStatus, shouldInit, folder);

        // Perform immediate cache check for newly added workspace
        await checkForMissingCache(context, syncStatus, workspaceRoot);
      }

      log(`Finished processing new workspace: ${workspaceRoot}`, workspaceRoot);
    }
  });
}

async function initializeManagers(
  context: vscode.ExtensionContext,
  workspaceRoot: string,
  syncStatus: vscode.StatusBarItem,
  forceInitialSync: boolean = false,
  workspaceFolder?: vscode.WorkspaceFolder,
): Promise<void> {
  try {
    log('=== initializeManagers START ===', workspaceRoot);
    log(`Force initial sync: ${forceInitialSync}`, workspaceRoot);

    const services = getWorkspaceServices(workspaceRoot);

    // Stop existing scheduler if any
    if (services.updateScheduler) {
      services.updateScheduler.stop();
      log('Stopped existing update scheduler', workspaceRoot);
    }

    // Get configuration scoped to workspace
    const config = vscode.workspace.getConfiguration('aiLey', workspaceFolder?.uri);
    const repoUrl =
      config.get<string>('repository.url') || 'https://github.com/armoin2018/ai-ley.git';
    const repoBranch = config.get<string>('repository.branch') || 'main';
    const cacheDir = config.get<string>('cache.directory') || '.cache/ai-ley';

    log(`Repository URL: ${repoUrl}`, workspaceRoot);
    log(`Repository Branch: ${repoBranch}`, workspaceRoot);
    log(`Cache Directory (configured): ${cacheDir}`, workspaceRoot);

    // Resolve cache directory path
    const cachePath = path.isAbsolute(cacheDir) ? cacheDir : path.join(workspaceRoot, cacheDir);
    
    log(`Cache Path (resolved): ${cachePath}`, workspaceRoot);
    log(`Cache exists: ${fs.existsSync(cachePath)}`, workspaceRoot);

    // Initialize managers
    const repoManager = new GitHubRepoManager({
      url: repoUrl,
      branch: repoBranch,
      localPath: cachePath,
    });

    const configManager = new ConfigurationManager(workspaceRoot, cachePath);

    const contributionManager = new ContributionManager(workspaceRoot, cachePath, repoManager);

    const updateScheduler = new UpdateScheduler(repoManager, configManager, contributionManager, syncStatus);

    services.repoManager = repoManager;
    services.configManager = configManager;
    services.contributionManager = contributionManager;
    services.updateScheduler = updateScheduler;

    log('Managers initialized', workspaceRoot);

    // Start the scheduler (this will trigger initial sync and gitignore update)
    updateScheduler.start(forceInitialSync);
    
    log('Update scheduler started', workspaceRoot);
    log('=== initializeManagers END ===', workspaceRoot);

    log('AI-Ley managers initialized successfully', workspaceRoot);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`ERROR in initializeManagers: ${errorMessage}`, workspaceRoot);
    console.error('Failed to initialize AI-Ley managers:', errorMessage);
    vscode.window.showErrorMessage(`AI-Ley initialization failed: ${errorMessage}`);
  }
}

async function initializeDashboard(context: vscode.ExtensionContext, status: vscode.StatusBarItem) {
  const config = vscode.workspace.getConfiguration('aiLey');
  
  // Check if MCP server is enabled and available
  const mcpEnabled = config.get<boolean>('mcp.enabled', false);
  const mcpAvailable = await checkMcpExtension();
  
  let dashboardUrl: string;
  const baseDashboardUrl = config.get<string>('dashboardUrl') || 'http://localhost:1880/dashboard';
  
  if (mcpEnabled && mcpAvailable) {
    // Append ProjectName parameter when MCP is enabled and available
    dashboardUrl = appendProjectNameToUrl(baseDashboardUrl);
    vscode.window.showInformationMessage(`AI-Ley: Connected to MCP server for project: ${getProjectName()}`);
  } else {
    // Use dashboard URL as-is
    dashboardUrl = baseDashboardUrl;
    if (mcpEnabled && !mcpAvailable) {
      vscode.window.showWarningMessage('AI-Ley: MCP server enabled but extension not found');
    }
  }

  await updateDashboardStatus(status, dashboardUrl);

  // Auto-open dashboard when a workspace is active
  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
    openDashboard(context, dashboardUrl);
  }
}

async function updateDashboardStatus(status: vscode.StatusBarItem, dashboardUrl: string) {
  const reachable = await checkDashboardUrl(dashboardUrl);
  if (!reachable) {
    // Try HTTPS fallback
    dashboardUrl = dashboardUrl.replace(/^http:/, 'https:');
  }

  const stillReachable = await checkDashboardUrl(dashboardUrl);
  if (stillReachable) {
    status.text = '$(check) AI-Ley: Connected';
    status.tooltip = `Connected to ${dashboardUrl}`;
    status.command = 'aiLey.openDashboard';
  } else {
    status.text = '$(error) AI-Ley: Offline';
    status.tooltip = `Dashboard not reachable at ${dashboardUrl}`;
  }
}

async function checkDashboardUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', timeout: 3000 });
    return res.ok;
  } catch {
    return false;
  }
}

function openDashboard(context: vscode.ExtensionContext, url: string) {
  if (currentPanel) {
    currentPanel.reveal(vscode.ViewColumn.One);
    currentPanel.webview.html = getWebviewHtml(url);
    return;
  }

  currentPanel = vscode.window.createWebviewPanel(
    'aiLeyDashboard',
    'AI-Ley Dashboard',
    vscode.ViewColumn.One,
    { enableScripts: true, retainContextWhenHidden: true },
  );

  currentPanel.webview.html = getWebviewHtml(url);
  currentPanel.onDidDispose(() => (currentPanel = undefined));
}

function getWebviewHtml(url: string): string {
  return /* html */ `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
      iframe { width: 100%; height: 100%; border: none; }
    </style>
  </head>
  <body>
    <iframe src="${url}" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>
  </body>
  </html>`;
}

export function deactivate() {
  for (const [workspaceRoot, services] of workspaceServices.entries()) {
    if (services.updateScheduler) {
      services.updateScheduler.stop();
      log('Stopped update scheduler during deactivate', workspaceRoot);
    }
  }

  workspaceServices.clear();
  currentPanel = undefined;
}
