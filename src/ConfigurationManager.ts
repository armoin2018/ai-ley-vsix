import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export interface AgenticConfig {
  githubCopilot: boolean;
  claude: boolean;
  gemini: boolean;
  cursor: boolean;
  windsurf: boolean;
  cline: boolean;
  roo: boolean;
  codex: boolean;
  opencode: boolean;
  metis: boolean;
  generic: boolean;
}

export interface FileMappingRule {
  source: string; // Relative to cache repo root
  target: string; // Relative to workspace root
  type: 'file' | 'directory';
  condition?: (config: AgenticConfig) => boolean;
}

export class ConfigurationManager {
  private workspaceRoot: string;
  private cacheRoot: string;

  constructor(workspaceRoot: string, cacheRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.cacheRoot = cacheRoot;
  }

  /**
   * Gets the file mapping rules based on ai-ley.py logic
   */
  private getFileMappings(): FileMappingRule[] {
    return [
      // Core .ai-ley folder - always copied
      {
        source: '.ai-ley',
        target: '.ai-ley',
        type: 'directory',
      },
      // Project folder - always copied
      {
        source: '.project',
        target: '.project',
        type: 'directory',
      },
      // GitHub Copilot - copy entire .github directory
      {
        source: '.github',
        target: '.github',
        type: 'directory',
        condition: (config) => config.githubCopilot,
      },
      // Claude
      {
        source: 'CLAUDE.md',
        target: 'CLAUDE.md',
        type: 'file',
        condition: (config) => config.claude,
      },
      {
        source: '.claude',
        target: '.claude',
        type: 'directory',
        condition: (config) => config.claude,
      },
      // Gemini
      {
        source: 'GEMINI.md',
        target: 'GEMINI.md',
        type: 'file',
        condition: (config) => config.gemini,
      },
      {
        source: '.gemini',
        target: '.gemini',
        type: 'directory',
        condition: (config) => config.gemini,
      },
      // Cursor
      {
        source: '.cursor',
        target: '.cursor',
        type: 'directory',
        condition: (config) => config.cursor,
      },
      {
        source: 'cursor-config.json',
        target: 'cursor-config.json',
        type: 'file',
        condition: (config) => config.cursor,
      },
      // Windsurf
      {
        source: '.windsurf',
        target: '.windsurf',
        type: 'directory',
        condition: (config) => config.windsurf,
      },
      {
        source: 'windsurf-config.json',
        target: 'windsurf-config.json',
        type: 'file',
        condition: (config) => config.windsurf,
      },
      // Cline
      {
        source: '.clinerules',
        target: '.clinerules',
        type: 'directory',
        condition: (config) => config.cline,
      },
      // Roo
      {
        source: '.roorules',
        target: '.roorules',
        type: 'directory',
        condition: (config) => config.roo,
      },
      // Codex
      {
        source: '.codex',
        target: '.codex',
        type: 'directory',
        condition: (config) => config.codex,
      },
      // OpenCode
      {
        source: '.opencode',
        target: '.opencode',
        type: 'directory',
        condition: (config) => config.opencode,
      },
      // Metis
      {
        source: '.metis',
        target: '.metis',
        type: 'directory',
        condition: (config) => config.metis,
      },
      // Generic agent files
      {
        source: 'AGENT.md',
        target: 'AGENT.md',
        type: 'file',
        condition: (config) => config.generic,
      },
      {
        source: 'AGENTS.md',
        target: 'AGENTS.md',
        type: 'file',
        condition: (config) => config.generic,
      },
    ];
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
   * Check if a file should be skipped (similar to ai-ley.py logic)
   */
  private shouldSkipFile(filePath: string): boolean {
    const skipPatterns = [
      'node_modules/',
      '.next/',
      'dist/',
      'build/',
      '.git/',
      '__pycache__/',
      '.DS_Store',
      '.tmp',
      '.log',
      'package-lock.json',
      'yarn.lock',
      '.env.local',
      '.env.production',
    ];

    const normalizedPath = filePath.replace(/\\/g, '/');

    for (const pattern of skipPatterns) {
      if (pattern.endsWith('/')) {
        if (normalizedPath.includes(pattern)) {
          return true;
        }
      } else if (pattern.startsWith('.')) {
        if (normalizedPath.endsWith(pattern)) {
          return true;
        }
      } else {
        if (normalizedPath.includes(pattern)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Copy a file from source to target
   */
  private async copyFile(sourcePath: string, targetPath: string): Promise<void> {
    const targetDir = path.dirname(targetPath);

    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Check if update is needed using MD5 hash
    const sourceHash = this.calculateMD5(sourcePath);
    let needsUpdate = true;

    if (fs.existsSync(targetPath)) {
      const targetHash = this.calculateMD5(targetPath);
      needsUpdate = sourceHash !== targetHash;
    }

    if (needsUpdate) {
      fs.copyFileSync(sourcePath, targetPath);
      return;
    }
  }

  /**
   * Remove a file if it exists
   */
  private removeFile(filePath: string): boolean {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        return true;
      } catch (error) {
        console.error(`Failed to remove file ${filePath}:`, error);
        return false;
      }
    }
    return false;
  }

  /**
   * Remove a directory recursively if it exists
   */
  private removeDirectory(dirPath: string): boolean {
    if (fs.existsSync(dirPath)) {
      try {
        fs.rmSync(dirPath, { recursive: true, force: true });
        return true;
      } catch (error) {
        console.error(`Failed to remove directory ${dirPath}:`, error);
        return false;
      }
    }
    return false;
  }

  /**
   * Copy a directory recursively from source to target
   */
  private async copyDirectory(
    sourcePath: string,
    targetPath: string,
    skipCheck: boolean = false,
  ): Promise<number> {
    let updatedCount = 0;

    if (!fs.existsSync(sourcePath)) {
      return updatedCount;
    }

    // Ensure target directory exists
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }

    const entries = fs.readdirSync(sourcePath, { withFileTypes: true });

    for (const entry of entries) {
      const sourceEntryPath = path.join(sourcePath, entry.name);
      const targetEntryPath = path.join(targetPath, entry.name);
      const relativePath = path.relative(this.cacheRoot, sourceEntryPath);

      // Skip files based on patterns
      if (!skipCheck && this.shouldSkipFile(relativePath)) {
        continue;
      }

      if (entry.isDirectory()) {
        updatedCount += await this.copyDirectory(sourceEntryPath, targetEntryPath, skipCheck);
      } else if (entry.isFile()) {
        const sourceHash = this.calculateMD5(sourceEntryPath);
        let needsUpdate = true;

        if (fs.existsSync(targetEntryPath)) {
          const targetHash = this.calculateMD5(targetEntryPath);
          needsUpdate = sourceHash !== targetHash;
        }

        if (needsUpdate) {
          await this.copyFile(sourceEntryPath, targetEntryPath);
          updatedCount++;
        }
      }
    }

    return updatedCount;
  }

  /**
   * Synchronize configurations based on user settings
   */
  public async syncConfigurations(
    agenticConfig: AgenticConfig,
    options: { silent?: boolean } = {},
  ): Promise<void> {
    const silent = options.silent ?? false;
    const mappings = this.getFileMappings();
    let totalUpdated = 0;
    let totalRemoved = 0;

    for (const mapping of mappings) {
      const targetPath = path.join(this.workspaceRoot, mapping.target);
      
      // Check if this mapping should be active based on condition
      const shouldExist = !mapping.condition || mapping.condition(agenticConfig);
      
      if (shouldExist) {
        // Copy files when enabled
        const sourcePath = path.join(this.cacheRoot, mapping.source);

        if (!fs.existsSync(sourcePath)) {
          console.log(`Source not found: ${mapping.source}`);
          continue;
        }

        try {
          if (mapping.type === 'file') {
            await this.copyFile(sourcePath, targetPath);
            totalUpdated++;
          } else if (mapping.type === 'directory') {
            const count = await this.copyDirectory(sourcePath, targetPath);
            totalUpdated += count;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          vscode.window.showWarningMessage(`Failed to copy ${mapping.source}: ${errorMessage}`);
        }
      } else {
        // Remove files when disabled (except .ai-ley which is always kept)
        if (mapping.source === '.ai-ley') {
          continue; // Never remove core .ai-ley directory
        }
        
        try {
          if (mapping.type === 'file') {
            if (this.removeFile(targetPath)) {
              totalRemoved++;
            }
          } else if (mapping.type === 'directory') {
            if (this.removeDirectory(targetPath)) {
              totalRemoved++;
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          vscode.window.showWarningMessage(`Failed to remove ${mapping.target}: ${errorMessage}`);
        }
      }
    }

    // Update .gitignore if enabled
    const config = vscode.workspace.getConfiguration('aiLey');
    const autoUpdateGitignore = config.get<boolean>('gitignore.autoUpdate', true);
    if (autoUpdateGitignore) {
      try {
        await this.updateGitignore();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showWarningMessage(`Failed to update .gitignore: ${errorMessage}`);
      }
    }

    // Provide feedback to user
    const messages: string[] = [];
    if (totalUpdated > 0) {
      messages.push(`${totalUpdated} files added/updated`);
    }
    if (totalRemoved > 0) {
      messages.push(`${totalRemoved} files/directories removed`);
    }

    if (messages.length > 0) {
      vscode.window.showInformationMessage(`AI-Ley: ${messages.join(', ')}`);
    } else if (!silent) {
      vscode.window.showInformationMessage(`AI-Ley: All configurations are up to date.`);
    }
  }

  /**
   * Update .gitignore with AI-Ley related files and directories
   */
  public async updateGitignore(): Promise<void> {
    const gitignorePath = path.join(this.workspaceRoot, '.gitignore');
    
    console.log('AI-Ley: Checking .gitignore at:', gitignorePath);
    
    // Files and directories to ignore
    const ignoreEntries = [
      '',
      '# AI-Ley generated files and directories',
      '# Core AI-Ley',
      '.ai-ley/',
      '.cache/',
      '.project/',
      '',
      '# AI Assistant configurations',
      '.github/copilot-instructions.md',
      '.github/chatmodes/',
      '.github/prompts/',
      '.github/copilot-instructions/',
      'CLAUDE.md',
      '.claude/',
      'GEMINI.md',
      '.gemini/',
      '.cursor/',
      'cursor-config.json',
      '.windsurf/',
      'windsurf-config.json',
      '.clinerules/',
      '.roorules/',
      '.codex/',
      '.opencode/',
      '.metis/',
      'AGENT.md',
      'AGENTS.md'
    ];

    let gitignoreContent = '';
    let existingContent = '';

    // Read existing .gitignore if it exists
    if (fs.existsSync(gitignorePath)) {
      existingContent = fs.readFileSync(gitignorePath, 'utf8');
      gitignoreContent = existingContent;
      console.log('AI-Ley: Found existing .gitignore');
    } else {
      console.log('AI-Ley: No existing .gitignore, will create new one');
    }

    // Check if AI-Ley section already exists
    const aileyMarker = '# AI-Ley generated files and directories';
    if (!gitignoreContent.includes(aileyMarker)) {
      console.log('AI-Ley: Adding AI-Ley entries to .gitignore');
      
      // Add AI-Ley section
      if (gitignoreContent && !gitignoreContent.endsWith('\n')) {
        gitignoreContent += '\n';
      }
      gitignoreContent += '\n' + ignoreEntries.join('\n');
      
      // Write updated .gitignore
      fs.writeFileSync(gitignorePath, gitignoreContent);
      console.log('AI-Ley: .gitignore updated successfully');
      vscode.window.showInformationMessage('AI-Ley: Updated .gitignore with AI-Ley files');
    } else {
      console.log('AI-Ley: .gitignore already contains AI-Ley entries, skipping update');
    }
  }

  /**
   * Get the agentic configuration from VS Code settings
   */
  public static getAgenticConfig(): AgenticConfig {
    const config = vscode.workspace.getConfiguration('aiLey.agentic');

    return {
      githubCopilot: config.get<boolean>('githubCopilot', true),
      claude: config.get<boolean>('claude', false),
      gemini: config.get<boolean>('gemini', false),
      cursor: config.get<boolean>('cursor', false),
      windsurf: config.get<boolean>('windsurf', false),
      cline: config.get<boolean>('cline', false),
      roo: config.get<boolean>('roo', false),
      codex: config.get<boolean>('codex', false),
      opencode: config.get<boolean>('opencode', false),
      metis: config.get<boolean>('metis', false),
      generic: config.get<boolean>('generic', true),
    };
  }
}
