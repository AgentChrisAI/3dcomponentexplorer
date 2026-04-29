// Skeleton: add-repo.ts - clones a repo and refreshes manifest
import {execSync} from 'child_process';
import path from 'path';
import fs from 'fs';

const REPOS_BASE = '/home/christopher/.openclaw/workspace/ui-libraries/repos';
const REPO_TARGET = process.argv[2];

async function main(){
  if(!REPO_TARGET){ console.error('Usage: node add-repo.ts <github-url>'); process.exit(1); }
  const repoName = path.basename(REPO_TARGET, '.git');
  const localPath = path.join(REPOS_BASE, repoName);
  if(!fs.existsSync(REPOS_BASE)) fs.mkdirSync(REPOS_BASE, { recursive: true });
  try{ execSync(`git clone --depth 1 ${REPO_TARGET} ${localPath}`, {stdio:'inherit'}); } catch(err){ console.error('Clone failed', err); process.exit(1); }
  console.log('Cloned', repoName, 'to', localPath);
  // placeholder: trigger discovery and manifest update here
}

main();
