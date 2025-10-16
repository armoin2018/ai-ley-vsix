import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import fetch from 'node-fetch';
import { GitHubRepoManager } from './GitHubRepoManager';

export class ContributionManager {
  private workspaceRoot: string;
  private cacheRoot: string;
  private repoManager: GitHubRepoManager;

  constructor(workspaceRoot: string, cacheRoot: string, repoManager: GitHubRepoManager) {
    this.workspaceRoot = workspaceRoot;
    this.cacheRoot = cacheRoot;
    this.repoManager = repoManager;
  }

  /**
   * Calculate MD5 hash of a file
   */
  private calculateMD5(filePath: string): string {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const hashSum = crypto.createHash('md5');
      hashSum.update(fileBuffer);
      return hashSum.digest('hex');
    } catch (error) {
      return '';
    }
  }

  /**
   * Compare files between workspace .ai-ley/shared and cache .ai-ley/shared
   * Returns list of changed files (relative paths from .ai-ley/shared)
   */
  private async compareSharedFiles(): Promise<string[]> {
    const workspaceSharedPath = path.join(this.workspaceRoot, '.ai-ley', 'shared');
    const cacheSharedPath = path.join(this.cacheRoot, '.ai-ley', 'shared');

    // Check if workspace shared directory exists
    if (!fs.existsSync(workspaceSharedPath)) {
      return [];
    }

    // Check if cache shared directory exists
    if (!fs.existsSync(cacheSharedPath)) {
      console.log('Cache shared directory does not exist, all files are new');
      return this.getAllFiles(workspaceSharedPath, workspaceSharedPath);
    }

    const changedFiles: string[] = [];
    const workspaceFiles = this.getAllFiles(workspaceSharedPath, workspaceSharedPath);

    for (const relativeFile of workspaceFiles) {
      const workspaceFilePath = path.join(workspaceSharedPath, relativeFile);
      const cacheFilePath = path.join(cacheSharedPath, relativeFile);

      const workspaceHash = this.calculateMD5(workspaceFilePath);

      if (!fs.existsSync(cacheFilePath)) {
        // File is new
        changedFiles.push(relativeFile);
      } else {
        const cacheHash = this.calculateMD5(cacheFilePath);
        if (workspaceHash !== cacheHash) {
          // File has changed
          changedFiles.push(relativeFile);
        }
      }
    }

    return changedFiles;
  }

  /**
   * Get all files in a directory recursively (returns relative paths)
   */
  private getAllFiles(dirPath: string, basePath: string): string[] {
    const files: string[] = [];

    if (!fs.existsSync(dirPath)) {
      return files;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        files.push(...this.getAllFiles(entryPath, basePath));
      } else if (entry.isFile()) {
        const relativePath = path.relative(basePath, entryPath);
        files.push(relativePath);
      }
    }

    return files;
  }

  /**
   * Copy changed files from workspace to cache
   */
  private async copyChangedFiles(changedFiles: string[]): Promise<void> {
    const workspaceSharedPath = path.join(this.workspaceRoot, '.ai-ley', 'shared');
    const cacheSharedPath = path.join(this.cacheRoot, '.ai-ley', 'shared');

    for (const relativeFile of changedFiles) {
      const sourceFile = path.join(workspaceSharedPath, relativeFile);
      const targetFile = path.join(cacheSharedPath, relativeFile);

      // Ensure target directory exists
      const targetDir = path.dirname(targetFile);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Copy file
      fs.copyFileSync(sourceFile, targetFile);
      console.log(`Copied: ${relativeFile}`);
    }
  }

  /**
   * Copy changed files to .my/shared directory
   */
  private async copyToMyShared(changedFiles: string[]): Promise<void> {
    const workspaceSharedPath = path.join(this.workspaceRoot, '.ai-ley', 'shared');
    const mySharedPath = path.join(this.workspaceRoot, '.my', 'shared');

    // Ensure .my/shared directory exists
    if (!fs.existsSync(mySharedPath)) {
      fs.mkdirSync(mySharedPath, { recursive: true });
    }

    for (const relativeFile of changedFiles) {
      const sourceFile = path.join(workspaceSharedPath, relativeFile);
      const targetFile = path.join(mySharedPath, relativeFile);

      // Ensure target directory exists
      const targetDir = path.dirname(targetFile);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Copy file
      fs.copyFileSync(sourceFile, targetFile);
      console.log(`Copied to .my/shared: ${relativeFile}`);
    }
  }

  /**
   * Get GitHub token from environment or prompt user
   */
  private async getGitHubToken(): Promise<string | null> {
    // First, check if token exists in environment
    if (process.env.GITHUB_TOKEN) {
      return process.env.GITHUB_TOKEN;
    }

    // Prompt user to enter token
    const token = await vscode.window.showInputBox({
      prompt: 'Enter a GitHub Personal Access Token with repo permissions to create pull requests',
      password: true,
      ignoreFocusOut: true,
      placeHolder: 'ghp_xxxxxxxxxxxxxxxxxxxx'
    });

    return token || null;
  }

  /**
   * Create a pull request on GitHub
   */
  private async createPullRequest(branchName: string, changedFiles: string[]): Promise<void> {
    const token = await this.getGitHubToken();

    if (!token) {
      vscode.window.showWarningMessage(
        'AI-Ley: No GitHub token available, cannot create pull request. Branch pushed but PR not created.'
      );
      return;
    }

    try {
      const owner = 'armoin2018';
      const repo = 'ai-ley';
      const title = `Community contribution: Updated shared files`;
      const body = `This is an automated pull request from AI-Ley extension.\n\n**Changed files:**\n${changedFiles.map(f => `- ${f}`).join('\n')}\n\nGenerated by AI-Ley extension from workspace: ${path.basename(this.workspaceRoot)}`;

      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          title,
          body,
          head: branchName,
          base: 'main',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`GitHub API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const prData: any = await response.json();
      const prUrl = prData.html_url;

      vscode.window.showInformationMessage(
        `AI-Ley: Pull request created successfully! View at: ${prUrl}`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`AI-Ley: Failed to create pull request - ${errorMessage}`);
      console.error('Failed to create pull request:', error);
    }
  }

  /**
   * Main method to check for changes and contribute back
   */
  public async checkAndContribute(): Promise<void> {
    const config = vscode.workspace.getConfiguration('aiLey.contribute');
    const enabled = config.get<boolean>('enabled', true);

    if (!enabled) {
      console.log('Contribution is disabled');
      return;
    }

    try {
      console.log('Checking for changes in .ai-ley/shared...');

      // Compare files
      const changedFiles = await this.compareSharedFiles();

      if (changedFiles.length === 0) {
        console.log('No changes detected in .ai-ley/shared');
        return;
      }

      console.log(`Found ${changedFiles.length} changed file(s):`, changedFiles);

      vscode.window.showInformationMessage(
        `AI-Ley: Detected ${changedFiles.length} changed file(s) in .ai-ley/shared. Contributing back...`
      );

      // Copy changed files to cache
      await this.copyChangedFiles(changedFiles);

      // Create a unique branch name
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const projectName = path.basename(this.workspaceRoot).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const branchName = `contribution/${projectName}-${timestamp}-${Date.now()}`;

      // Create branch in cache repo
      await this.repoManager.createBranch(branchName);

      // Add and commit changes
      const commitMessage = `Community contribution: Updated ${changedFiles.length} file(s) in shared\n\nFrom workspace: ${path.basename(this.workspaceRoot)}\nFiles:\n${changedFiles.map(f => `- ${f}`).join('\n')}`;
      await this.repoManager.commitChanges('.ai-ley/shared', commitMessage);

      // Push branch
      await this.repoManager.pushBranch(branchName);

      // Create pull request
      await this.createPullRequest(branchName, changedFiles);

      // Copy altered files to .my/shared
      await this.copyToMyShared(changedFiles);

      // Revert cache back to main branch
      await this.repoManager.checkoutMainAndSync();

      vscode.window.showInformationMessage(
        `AI-Ley: Contribution complete! ${changedFiles.length} file(s) contributed.`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`AI-Ley: Contribution failed - ${errorMessage}`);
      console.error('Contribution failed:', error);

      // Try to revert to main branch in case of error
      try {
        await this.repoManager.checkoutMainAndSync();
      } catch (revertError) {
        console.error('Failed to revert to main branch:', revertError);
      }
    }
  }
}
