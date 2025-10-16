import * as fs from 'fs';
import * as path from 'path';
import simpleGit, { SimpleGit } from 'simple-git';
import * as vscode from 'vscode';

export interface RepoConfig {
  url: string;
  branch: string;
  localPath: string;
}

export class GitHubRepoManager {
  private git: SimpleGit;
  private config: RepoConfig;

  constructor(config: RepoConfig) {
    this.config = config;
    this.git = simpleGit();
  }

  /**
   * Checks if the repository is already cloned locally
   */
  public async isCloned(): Promise<boolean> {
    try {
      const gitDir = path.join(this.config.localPath, '.git');
      return fs.existsSync(gitDir);
    } catch (error) {
      return false;
    }
  }

  /**
   * Clones the repository to the local cache directory
   */
  public async clone(): Promise<void> {
    try {
      // Ensure parent directory exists
      const parentDir = path.dirname(this.config.localPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      vscode.window.showInformationMessage(`Cloning AI-Ley repository...`);

      await this.git.clone(this.config.url, this.config.localPath, [
        '--branch',
        this.config.branch,
        '--depth',
        '1', // Shallow clone for faster download
      ]);

      vscode.window.showInformationMessage(`AI-Ley repository cloned successfully!`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to clone AI-Ley repository: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Updates the existing local repository
   */
  public async update(): Promise<boolean> {
    try {
      const repoGit = simpleGit(this.config.localPath);

      // Check if there are any changes
      const status = await repoGit.status();

      // Fetch latest changes
      await repoGit.fetch(['origin', this.config.branch]);

      // Get current commit hash
      const currentHash = await repoGit.revparse(['HEAD']);

      // Get remote commit hash
      const remoteHash = await repoGit.revparse([`origin/${this.config.branch}`]);

      // If hashes differ, there are updates available
      if (currentHash !== remoteHash) {
        // Reset to remote branch (discard local changes)
        await repoGit.reset(['--hard', `origin/${this.config.branch}`]);

        vscode.window.showInformationMessage(`AI-Ley repository updated successfully!`);
        return true;
      }

      return false; // No updates
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to update AI-Ley repository: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Ensures the repository is cloned and up-to-date
   */
  public async ensureRepository(): Promise<void> {
    if (await this.isCloned()) {
      await this.update();
    } else {
      await this.clone();
    }
  }

  /**
   * Gets the last update time of the repository
   */
  public async getLastUpdateTime(): Promise<Date | null> {
    try {
      if (!(await this.isCloned())) {
        return null;
      }

      const repoGit = simpleGit(this.config.localPath);
      const log = await repoGit.log({ maxCount: 1 });

      if (log.latest) {
        return new Date(log.latest.date);
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Checks if updates are available without pulling them
   */
  public async hasUpdates(): Promise<boolean> {
    try {
      if (!(await this.isCloned())) {
        return true; // Need to clone
      }

      const repoGit = simpleGit(this.config.localPath);

      // Fetch latest changes
      await repoGit.fetch(['origin', this.config.branch]);

      // Get current commit hash
      const currentHash = await repoGit.revparse(['HEAD']);

      // Get remote commit hash
      const remoteHash = await repoGit.revparse([`origin/${this.config.branch}`]);

      return currentHash !== remoteHash;
    } catch (error) {
      console.error('Error checking for updates:', error);
      return false;
    }
  }

  /**
   * Gets the repository path
   */
  public getRepoPath(): string {
    return this.config.localPath;
  }

  /**
   * Create a new branch in the repository
   */
  public async createBranch(branchName: string): Promise<void> {
    try {
      const repoGit = simpleGit(this.config.localPath);
      
      // Ensure we're on the main branch first
      await repoGit.checkout(this.config.branch);
      
      // Create and checkout new branch
      await repoGit.checkoutLocalBranch(branchName);
      
      console.log(`Created branch: ${branchName}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to create branch ${branchName}:`, errorMessage);
      throw error;
    }
  }

  /**
   * Commit changes in a specific path
   */
  public async commitChanges(pathPattern: string, message: string): Promise<void> {
    try {
      const repoGit = simpleGit(this.config.localPath);
      
      // Add files
      await repoGit.add(pathPattern);
      
      // Commit with message
      await repoGit.commit(message);
      
      console.log(`Committed changes: ${message}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to commit changes:`, errorMessage);
      throw error;
    }
  }

  /**
   * Push a branch to remote
   */
  public async pushBranch(branchName: string): Promise<void> {
    try {
      const repoGit = simpleGit(this.config.localPath);
      
      // Push branch to origin
      await repoGit.push(['origin', branchName, '--set-upstream']);
      
      console.log(`Pushed branch: ${branchName}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to push branch ${branchName}:`, errorMessage);
      throw error;
    }
  }

  /**
   * Checkout main branch and sync with remote
   */
  public async checkoutMainAndSync(): Promise<void> {
    try {
      const repoGit = simpleGit(this.config.localPath);
      
      // Checkout main branch
      await repoGit.checkout(this.config.branch);
      
      // Fetch latest changes
      await repoGit.fetch(['origin', this.config.branch]);
      
      // Reset to remote branch
      await repoGit.reset(['--hard', `origin/${this.config.branch}`]);
      
      console.log(`Checked out and synced ${this.config.branch}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to checkout and sync main:`, errorMessage);
      throw error;
    }
  }
}
