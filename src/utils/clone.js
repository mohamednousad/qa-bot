const simpleGit = require('simple-git');
const fs = require('fs-extra');
const path = require('path');

async function cloneRepo(repoUrl, branch, prNumber) {
  // Create a unique folder for this PR: temp/123
  const dir = path.join(process.cwd(), 'temp', String(prNumber));
  
  // Clean start
  await fs.remove(dir);
  await fs.ensureDir(dir);

  console.log(`Cloning ${repoUrl} to ${dir}...`);
  const git = simpleGit(dir);
  
  // Clone and switch to the PR branch
  await git.clone(repoUrl, '.');
  await git.checkout(branch);
  
  return dir;
}

module.exports = cloneRepo;