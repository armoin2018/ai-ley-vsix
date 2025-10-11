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
    const dashboardUrl = config.get<string>('dashboardUrl') || 'http://localhost:1880/dashboard';
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

  // 🔄 Watch configuration changes
  vscode.workspace.onDidChangeConfiguration(async (event: vscode.ConfigurationChangeEvent) => {
    if (event.affectsConfiguration('aiLey.dashboardUrl')) {
      const config = vscode.workspace.getConfiguration('aiLey');
      const newUrl = config.get<string>('dashboardUrl') || 'http://localhost:1880/dashboard';
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
  let dashboardUrl: string = config.get('dashboardUrl') || 'http://localhost:1880/dashboard';

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
