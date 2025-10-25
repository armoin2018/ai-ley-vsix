import * as vscode from 'vscode';
import { ConfigurationManager } from './ConfigurationManager';
import { GitHubRepoManager } from './GitHubRepoManager';
import { ContributionManager } from './ContributionManager';

export class UpdateScheduler {
  private intervalHandle: NodeJS.Timeout | null = null;
  private lastUpdateTime: Date | null = null;
  private repoManager: GitHubRepoManager;
  private configManager: ConfigurationManager;
  private contributionManager: ContributionManager;
  private statusBarItem: vscode.StatusBarItem;

  constructor(
    repoManager: GitHubRepoManager,
    configManager: ConfigurationManager,
    contributionManager: ContributionManager,
    statusBarItem: vscode.StatusBarItem,
  ) {
    this.repoManager = repoManager;
    this.configManager = configManager;
    this.contributionManager = contributionManager;
    this.statusBarItem = statusBarItem;
  }

  /**
   * Starts the update scheduler
   */
  public start(forceInitialSync: boolean = false): void {
    const config = vscode.workspace.getConfiguration('aiLey.update');
    const enabled = config.get<boolean>('enabled', true);
    const interval = config.get<number>('interval', 86400); // Default: 24 hours

    if (!enabled || interval <= 0) {
      this.stop();
      return;
    }

    // Convert seconds to milliseconds
    const intervalMs = interval * 1000;

    // Clear any existing interval
    this.stop();

    // Run initial check (with force flag if needed)
    this.checkAndUpdate(forceInitialSync).catch((error) => {
      console.error('Initial update check failed:', error);
    });

    // Set up recurring check
    this.intervalHandle = setInterval(() => {
      this.checkAndUpdate(false).catch((error) => {
        console.error('Scheduled update check failed:', error);
      });
    }, intervalMs);

    console.log(`Update scheduler started with interval: ${interval} seconds`);
  }

  /**
   * Stops the update scheduler
   */
  public stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      console.log('Update scheduler stopped');
    }
  }

  /**
   * Checks for updates and applies them if available
   */
  private async checkAndUpdate(forceSync: boolean = false): Promise<void> {
    try {
      this.updateStatusBar('Checking for updates...');

      // Check if repository is cloned
      if (!(await this.repoManager.isCloned())) {
        this.updateStatusBar('Cloning repository...');
        await this.repoManager.clone();
        await this.syncConfigurations();
        this.lastUpdateTime = new Date();
        this.updateStatusBar('Ready');
        return;
      }

      // If force sync is requested (e.g., for auto-init), ensure repo is updated and sync configs
      if (forceSync) {
        this.updateStatusBar('Initializing...');
        await this.repoManager.ensureRepository();
        await this.syncConfigurations();
        this.lastUpdateTime = new Date();
        this.updateStatusBar('Ready');
        // After sync, check for local changes to contribute back
        await this.contributionManager.checkAndContribute();
        return;
      }

      // Check if updates are available
      const hasUpdates = await this.repoManager.hasUpdates();

      if (hasUpdates) {
        this.updateStatusBar('Updating...');
        const updated = await this.repoManager.update();

        if (updated) {
          await this.syncConfigurations();
          this.lastUpdateTime = new Date();
        }

        this.updateStatusBar('Ready');
      } else {
        await this.syncConfigurations({ silent: true });
        this.updateStatusBar('Ready');
      }

      // After sync, check for local changes to contribute back
      await this.contributionManager.checkAndContribute();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Update check failed:', errorMessage);
      this.updateStatusBar('Error');
      vscode.window.showErrorMessage(`AI-Ley update failed: ${errorMessage}`);
    }
  }

  /**
   * Synchronizes configurations after update
   */
  private async syncConfigurations(options: { silent?: boolean } = {}): Promise<void> {
    const agenticConfig = ConfigurationManager.getAgenticConfig();
    await this.configManager.syncConfigurations(agenticConfig, options);
  }

  /**
   * Forces an immediate update check
   */
  public async forceUpdate(): Promise<void> {
    try {
      this.updateStatusBar('Force updating...');

      await this.repoManager.ensureRepository();
      await this.syncConfigurations();

      this.lastUpdateTime = new Date();
      this.updateStatusBar('Ready');

      vscode.window.showInformationMessage('AI-Ley: Force update completed!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.updateStatusBar('Error');
      vscode.window.showErrorMessage(`AI-Ley force update failed: ${errorMessage}`);
    }
  }

  /**
   * Updates the status bar with current state
   */
  private updateStatusBar(state: string): void {
    const icons: Record<string, string> = {
      Ready: '$(check)',
      'Checking for updates...': '$(sync~spin)',
      'Cloning repository...': '$(cloud-download)',
      'Updating...': '$(sync~spin)',
      'Force updating...': '$(sync~spin)',
      Error: '$(error)',
    };

    const icon = icons[state] || '$(info)';
    this.statusBarItem.text = `${icon} AI-Ley: ${state}`;

    if (this.lastUpdateTime) {
      const timeStr = this.lastUpdateTime.toLocaleString();
      this.statusBarItem.tooltip = `Last updated: ${timeStr}\nClick to force update`;
    } else {
      this.statusBarItem.tooltip = 'Click to force update';
    }
  }

  /**
   * Gets the last update time
   */
  public getLastUpdateTime(): Date | null {
    return this.lastUpdateTime;
  }

  /**
   * Restarts the scheduler (useful when configuration changes)
   */
  public restart(): void {
    this.stop();
    this.start();
  }
}
