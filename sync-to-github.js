#!/usr/bin/env node
/**
 * GitHub Sync Script for LinkedIn Automation Tools
 * 
 * Features:
 * - Automatic GitHub repository creation
 * - Rate-limited file uploads
 * - Incremental sync support
 * - Error handling and retries
 * 
 * Usage:
 *   GITHUB_TOKEN=your_token node sync-to-github.js
 *   GITHUB_TOKEN=your_token node sync-to-github.js --force-full
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  GITHUB_USERNAME: 'talhaXdev',
  REPO_NAME: 'linkedin-automation-tools',
  SOURCE_DIR: '/root/github-wrapper/linkedin-automation-tools',
  BASE_URL: 'https://linkedautomation.org',
  RATE_LIMIT_DELAY: 1000, // 1 second between API calls
  MAX_RETRIES: 3,
  BATCH_SIZE: 50 // Files per batch
};

// Parse CLI arguments
const args = process.argv.slice(2);
const FORCE_FULL = args.includes('--force-full');
const DRY_RUN = args.includes('--dry-run');

// GitHub API helper
class GitHubAPI {
  constructor(token) {
    this.token = token;
    this.baseURL = 'https://api.github.com';
    this.rateLimitRemaining = 5000;
  }

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'LinkedAutomation-Sync',
        ...options.headers
      }
    });

    // Update rate limit info
    this.rateLimitRemaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0');
    
    if (response.status === 403 && this.rateLimitRemaining === 0) {
      const resetTime = parseInt(response.headers.get('X-RateLimit-Reset') || '0') * 1000;
      const waitTime = resetTime - Date.now();
      console.log(`⏳ Rate limit hit. Waiting ${Math.ceil(waitTime / 1000)}s...`);
      await sleep(waitTime + 5000);
      return this.request(endpoint, options);
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API Error (${response.status}): ${error}`);
    }

    // Rate limiting - be nice to the API
    await sleep(CONFIG.RATE_LIMIT_DELAY);
    
    return response.json().catch(() => ({}));
  }

  // Check if repository exists
  async repoExists() {
    try {
      await this.request(`/repos/${CONFIG.GITHUB_USERNAME}/${CONFIG.REPO_NAME}`);
      return true;
    } catch (e) {
      if (e.message.includes('404')) return false;
      throw e;
    }
  }

  // Create repository
  async createRepo() {
    console.log('📦 Creating repository...');
    
    const data = {
      name: CONFIG.REPO_NAME,
      description: 'The most comprehensive directory of LinkedIn automation tools - 425+ tools across 6 categories',
      homepage: CONFIG.BASE_URL,
      private: false,
      has_issues: true,
      has_projects: false,
      has_wiki: false,
      auto_init: false,
      gitignore_template: 'Node',
      license_template: 'mit',
      topics: ['linkedin', 'automation', 'sales', 'prospecting', 'lead-generation', 'marketing', 'awesome-list']
    };

    return this.request('/user/repos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  // Get file SHA (for updates)
  async getFileSHA(filePath) {
    try {
      const result = await this.request(
        `/repos/${CONFIG.GITHUB_USERNAME}/${CONFIG.REPO_NAME}/contents/${filePath}`
      );
      return result.sha;
    } catch (e) {
      return null;
    }
  }

  // Create or update file
  async uploadFile(filePath, content, message) {
    const sha = await this.getFileSHA(filePath);
    const encodedContent = Buffer.from(content).toString('base64');
    
    const data = {
      message: message,
      content: encodedContent,
      branch: 'main'
    };

    if (sha) {
      data.sha = sha;
    }

    return this.request(
      `/repos/${CONFIG.GITHUB_USERNAME}/${CONFIG.REPO_NAME}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }
    );
  }

  // Get latest commit SHA
  async getLatestCommit() {
    const result = await this.request(
      `/repos/${CONFIG.GITHUB_USERNAME}/${CONFIG.REPO_NAME}/git/refs/heads/main`
    );
    return result.object.sha;
  }
}

// Utility functions
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getAllFiles(dir, baseDir = dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relativePath = path.relative(baseDir, fullPath);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...getAllFiles(fullPath, baseDir));
    } else if (stat.isFile()) {
      files.push({
        path: relativePath,
        fullPath: fullPath,
        content: fs.readFileSync(fullPath, 'utf8'),
        size: stat.size
      });
    }
  }
  
  return files;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Main sync function
async function syncToGitHub() {
  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    console.error('❌ GITHUB_TOKEN environment variable is required');
    console.error('   Get a token from: https://github.com/settings/tokens');
    console.error('   Required scopes: repo, workflow');
    process.exit(1);
  }

  console.log('🚀 LinkedIn Automation Tools - GitHub Sync\n');
  console.log(`👤 Username: ${CONFIG.GITHUB_USERNAME}`);
  console.log(`📁 Repository: ${CONFIG.REPO_NAME}`);
  console.log(`🔄 Mode: ${FORCE_FULL ? 'Full sync' : 'Incremental'}`);
  console.log(`💨 Dry run: ${DRY_RUN ? 'Yes' : 'No'}\n`);

  const github = new GitHubAPI(token);

  // Check/create repository
  const exists = await github.repoExists();
  
  if (!exists) {
    if (DRY_RUN) {
      console.log('📦 [DRY RUN] Would create repository');
    } else {
      await github.createRepo();
      console.log('✅ Repository created');
      // Wait for repo to be ready
      await sleep(3000);
    }
  } else {
    console.log('✅ Repository exists');
  }

  // Get all files to sync
  console.log('\n📂 Scanning files...');
  const files = getAllFiles(CONFIG.SOURCE_DIR)
    .filter(f => !f.path.startsWith('.git/') && !f.path.startsWith('node_modules/'));
  
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  
  console.log(`   Found ${files.length} files (${formatBytes(totalSize)})`);
  console.log(`   Rate limit: ${github.rateLimitRemaining} requests remaining\n`);

  if (DRY_RUN) {
    console.log('📋 Files to sync:');
    files.slice(0, 10).forEach(f => console.log(`   - ${f.path}`));
    if (files.length > 10) console.log(`   ... and ${files.length - 10} more`);
    console.log('\n✅ Dry run complete');
    return;
  }

  // Sync files in batches
  console.log('⬆️  Uploading files...\n');
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < files.length; i += CONFIG.BATCH_SIZE) {
    const batch = files.slice(i, i + CONFIG.BATCH_SIZE);
    const batchNum = Math.floor(i / CONFIG.BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(files.length / CONFIG.BATCH_SIZE);
    
    console.log(`📦 Batch ${batchNum}/${totalBatches} (${batch.length} files)`);

    for (const file of batch) {
      let retries = 0;
      
      while (retries < CONFIG.MAX_RETRIES) {
        try {
          const message = `Update ${file.path} - ${new Date().toISOString().split('T')[0]}`;
          await github.uploadFile(file.path, file.content, message);
          successCount++;
          process.stdout.write('.');
          break;
        } catch (error) {
          retries++;
          if (retries >= CONFIG.MAX_RETRIES) {
            errorCount++;
            errors.push({ file: file.path, error: error.message });
            process.stdout.write('X');
          } else {
            await sleep(CONFIG.RATE_LIMIT_DELAY * retries);
          }
        }
      }
    }
    
    console.log('');
    
    // Progress update
    const percent = Math.round((successCount + errorCount) / files.length * 100);
    console.log(`   Progress: ${percent}% (${successCount} uploaded, ${errorCount} errors)\n`);
    
    // Small delay between batches
    if (i + CONFIG.BATCH_SIZE < files.length) {
      await sleep(2000);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 SYNC SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Successfully uploaded: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📊 Success rate: ${Math.round(successCount / files.length * 100)}%`);
  console.log(`🔗 Repository: https://github.com/${CONFIG.GITHUB_USERNAME}/${CONFIG.REPO_NAME}`);
  console.log('='.repeat(50));

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.slice(0, 5).forEach(e => console.log(`   - ${e.file}: ${e.error.substring(0, 100)}`));
    if (errors.length > 5) console.log(`   ... and ${errors.length - 5} more`);
  }

  // Create sync state file
  const syncState = {
    lastSync: new Date().toISOString(),
    filesSynced: successCount,
    filesFailed: errorCount,
    totalFiles: files.length
  };
  fs.writeFileSync('.sync-state.json', JSON.stringify(syncState, null, 2));
  
  console.log('\n✅ Sync complete!');
}

// Alternative: Use git commands for bulk upload
async function syncWithGit() {
  console.log('🚀 Using Git for bulk upload...\n');
  
  const repoUrl = `https://${process.env.GITHUB_TOKEN}@github.com/${CONFIG.GITHUB_USERNAME}/${CONFIG.REPO_NAME}.git`;
  
  try {
    // Initialize git if needed
    if (!fs.existsSync(path.join(CONFIG.SOURCE_DIR, '.git'))) {
      console.log('📦 Initializing git repository...');
      execSync('git init', { cwd: CONFIG.SOURCE_DIR, stdio: 'inherit' });
      execSync('git branch -M main', { cwd: CONFIG.SOURCE_DIR, stdio: 'inherit' });
    }
    
    // Configure git
    execSync('git config user.email "sync@linkedautomation.org"', { cwd: CONFIG.SOURCE_DIR });
    execSync('git config user.name "LinkedAutomation Bot"', { cwd: CONFIG.SOURCE_DIR });
    
    // Add remote
    try {
      execSync('git remote remove origin', { cwd: CONFIG.SOURCE_DIR });
    } catch (e) {}
    execSync(`git remote add origin ${repoUrl}`, { cwd: CONFIG.SOURCE_DIR });
    
    // Add all files
    console.log('📂 Adding files...');
    execSync('git add -A', { cwd: CONFIG.SOURCE_DIR });
    
    // Commit
    console.log('💾 Creating commit...');
    const commitMsg = `Sync: ${new Date().toISOString().split('T')[0]} - Automated update`;
    try {
      execSync(`git commit -m "${commitMsg}"`, { cwd: CONFIG.SOURCE_DIR });
    } catch (e) {
      console.log('   No changes to commit');
    }
    
    // Push
    console.log('⬆️  Pushing to GitHub...');
    execSync('git push -u origin main --force', { cwd: CONFIG.SOURCE_DIR, stdio: 'inherit' });
    
    console.log('\n✅ Git sync complete!');
    console.log(`🔗 https://github.com/${CONFIG.GITHUB_USERNAME}/${CONFIG.REPO_NAME}`);
    
  } catch (error) {
    console.error('❌ Git sync failed:', error.message);
    process.exit(1);
  }
}

// Main
const useGit = args.includes('--use-git');

if (useGit) {
  syncWithGit().catch(console.error);
} else {
  syncToGitHub().catch(console.error);
}
