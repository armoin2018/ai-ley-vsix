import fetch from 'node-fetch';
import * as path from 'path';
import * as vscode from 'vscode';
import { ConfigurationManager } from './ConfigurationManager';
import { GitHubRepoManager } from './GitHubRepoManager';
import { UpdateScheduler } from './UpdateScheduler';

let currentPanel: vscode.WebviewPanel | undefined;
let updateScheduler: UpdateScheduler | undefined;
let repoManager: GitHubRepoManager | undefined;
let configManager: ConfigurationManager | undefined;

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

export async function activate(context: vscode.ExtensionContext) {
  // Create and show a status bar item for dashboard
  const dashboardStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  dashboardStatus.text = '$(globe) AI-Ley: Connecting...';
  dashboardStatus.tooltip = `Connecting to AI-Ley dashboard`;
  dashboardStatus.show();
  context.subscriptions.push(dashboardStatus);

  // Create and show a status bar item for configuration sync
  const syncStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
  syncStatus.text = '$(sync) AI-Ley: Initializing...';
  syncStatus.tooltip = 'Click to force update AI-Ley configurations';
  syncStatus.command = 'aiLey.forceUpdate';
  syncStatus.show();
  context.subscriptions.push(syncStatus);

  // Initialize managers if workspace is available
  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    await initializeManagers(context, workspaceRoot, syncStatus);
  }

  // Load initial config and connect
  await initializeDashboard(context, dashboardStatus);

  // Command to reopen dashboard manually
  const dashboardCmd = vscode.commands.registerCommand('aiLey.openDashboard', async () => {
    const config = vscode.workspace.getConfiguration('aiLey');
    const mcpEnabled = config.get<boolean>('mcp.enabled', false);
    const mcpAvailable = await checkMcpExtension();
    
    let dashboardUrl: string;
    if (mcpEnabled && mcpAvailable) {
      const baseMcpUrl = config.get<string>('mcp.dashboardUrl') || 'http://localhost:1880/mcp';
      dashboardUrl = appendProjectNameToUrl(baseMcpUrl);
    } else {
      dashboardUrl = config.get<string>('dashboardUrl') || 'http://localhost:1880/dashboard';
    }
    
    openDashboard(context, dashboardUrl);
  });
  context.subscriptions.push(dashboardCmd);

  // Command to sync configurations manually
  const syncCmd = vscode.commands.registerCommand('aiLey.syncConfigurations', async () => {
    if (!configManager) {
      vscode.window.showErrorMessage('AI-Ley: No workspace folder open');
      return;
    }

    try {
      const agenticConfig = ConfigurationManager.getAgenticConfig();
      await configManager.syncConfigurations(agenticConfig);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`AI-Ley sync failed: ${errorMessage}`);
    }
  });
  context.subscriptions.push(syncCmd);

  // Command to force update from repository
  const forceUpdateCmd = vscode.commands.registerCommand('aiLey.forceUpdate', async () => {
    if (!updateScheduler) {
      vscode.window.showErrorMessage('AI-Ley: No workspace folder open');
      return;
    }

    await updateScheduler.forceUpdate();
  });
  context.subscriptions.push(forceUpdateCmd);

  // Command to configure MCP server
  const configureMcpCmd = vscode.commands.registerCommand('aiLey.configureMcpServer', async () => {
    const config = vscode.workspace.getConfiguration('aiLey');
    
    // Get current settings
    const currentEnabled = config.get<boolean>('mcp.enabled', false);
    const currentServerUrl = config.get<string>('mcp.serverUrl', 'http://localhost:1880/mcp');
    const currentDashboardUrl = config.get<string>('mcp.dashboardUrl', 'http://localhost:1880/mcp');
    
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
      // Configure MCP server URLs
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
      
      const dashboardUrl = await vscode.window.showInputBox({
        title: 'AI-Ley MCP Dashboard URL',
        prompt: 'Enter the AI-Ley MCP dashboard URL',
        value: currentDashboardUrl,
        validateInput: (value) => {
          try {
            new URL(value);
            return null;
          } catch {
            return 'Please enter a valid URL';
          }
        }
      });
      
      if (!dashboardUrl) return;
      
      // Update configuration
      await config.update('mcp.enabled', true, vscode.ConfigurationTarget.Workspace);
      await config.update('mcp.serverUrl', serverUrl, vscode.ConfigurationTarget.Workspace);
      await config.update('mcp.dashboardUrl', dashboardUrl, vscode.ConfigurationTarget.Workspace);
      
      const finalDashboardUrl = appendProjectNameToUrl(dashboardUrl);
      vscode.window.showInformationMessage(`AI-Ley: MCP Server configured. Dashboard will include ProjectName=${getProjectName()}`);
      vscode.window.showInformationMessage(`Final dashboard URL: ${finalDashboardUrl}`);
    } else {
      // Disable MCP
      await config.update('mcp.enabled', false, vscode.ConfigurationTarget.Workspace);
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
      
      let newUrl: string;
      if (mcpEnabled && mcpAvailable) {
        const baseMcpUrl = config.get<string>('mcp.dashboardUrl') || 'http://localhost:1880/mcp';
        newUrl = appendProjectNameToUrl(baseMcpUrl);
      } else {
        newUrl = config.get<string>('dashboardUrl') || 'http://localhost:1880/dashboard';
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
      await updateStatus(dashboardStatus, newUrl);
    }

    // Restart scheduler if update settings change
    if (
      event.affectsConfiguration('aiLey.update.enabled') ||
      event.affectsConfiguration('aiLey.update.interval')
    ) {
      if (updateScheduler) {
        updateScheduler.restart();
      }
    }

    // Re-sync if agentic settings change
    if (event.affectsConfiguration('aiLey.agentic')) {
      if (configManager) {
        const agenticConfig = ConfigurationManager.getAgenticConfig();
        await configManager.syncConfigurations(agenticConfig);
      }
    }

    // Reinitialize managers if repository settings change
    if (
      event.affectsConfiguration('aiLey.repository') ||
      event.affectsConfiguration('aiLey.cache.directory')
    ) {
      if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        await initializeManagers(context, workspaceRoot, syncStatus);
      }
    }
  });
}

async function initializeManagers(
  context: vscode.ExtensionContext,
  workspaceRoot: string,
  syncStatus: vscode.StatusBarItem,
): Promise<void> {
  try {
    // Stop existing scheduler if any
    if (updateScheduler) {
      updateScheduler.stop();
    }

    // Get configuration
    const config = vscode.workspace.getConfiguration('aiLey');
    const repoUrl =
      config.get<string>('repository.url') || 'https://github.com/armoin2018/ai-ley.git';
    const repoBranch = config.get<string>('repository.branch') || 'main';
    const cacheDir = config.get<string>('cache.directory') || '.cache/ai-ley';

    // Resolve cache directory path
    const cachePath = path.isAbsolute(cacheDir) ? cacheDir : path.join(workspaceRoot, cacheDir);

    // Initialize managers
    repoManager = new GitHubRepoManager({
      url: repoUrl,
      branch: repoBranch,
      localPath: cachePath,
    });

    configManager = new ConfigurationManager(workspaceRoot, cachePath);

    updateScheduler = new UpdateScheduler(repoManager, configManager, syncStatus);

    // Start the scheduler
    updateScheduler.start();

    console.log('AI-Ley managers initialized successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
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
  
  if (mcpEnabled && mcpAvailable) {
    // Use MCP dashboard URL when MCP is enabled and available
    const baseMcpUrl = config.get<string>('mcp.dashboardUrl') || 'http://localhost:1880/mcp';
    dashboardUrl = appendProjectNameToUrl(baseMcpUrl);
    vscode.window.showInformationMessage(`AI-Ley: Connected to MCP server for project: ${getProjectName()}`);
  } else {
    // Use regular dashboard URL
    dashboardUrl = config.get('dashboardUrl') || 'http://localhost:1880/dashboard';
    if (mcpEnabled && !mcpAvailable) {
      vscode.window.showWarningMessage('AI-Ley: MCP server enabled but extension not found');
    }
  }

  await updateStatus(status, dashboardUrl);

  // Auto-open dashboard when a workspace is active
  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
    openDashboard(context, dashboardUrl);
  }
}

async function updateStatus(status: vscode.StatusBarItem, dashboardUrl: string) {
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
  // Stop the update scheduler
  if (updateScheduler) {
    updateScheduler.stop();
  }

  currentPanel = undefined;
  updateScheduler = undefined;
  repoManager = undefined;
  configManager = undefined;
}
