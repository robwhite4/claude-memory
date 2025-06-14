/**
 * Test for bulk task operations
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDir = path.join(__dirname, 'test-bulk-tasks-' + Date.now());
const cliPath = path.join(__dirname, '..', 'bin', 'claude-memory.js');

console.log('🧪 Testing bulk task operations...\n');

try {
  // Create test directory
  fs.mkdirSync(testDir, { recursive: true });
  process.chdir(testDir);

  // Initialize memory
  execSync(`node "${cliPath}" init "Test Bulk Tasks"`, { stdio: 'pipe' });

  // Create test tasks JSON file
  const testTasks = {
    tasks: [
      { description: 'Setup development environment', priority: 'high', assignee: 'Alice' },
      { description: 'Create database schema', priority: 'high', assignee: 'Bob' },
      { description: 'Implement user authentication', priority: 'high' },
      { description: 'Write unit tests', priority: 'medium', assignee: 'Charlie' },
      { description: 'Setup CI/CD pipeline', priority: 'medium' },
      { description: 'Create API documentation', priority: 'low' }
    ]
  };

  const tasksFile = path.join(testDir, 'test-tasks.json');
  fs.writeFileSync(tasksFile, JSON.stringify(testTasks, null, 2));

  console.log('✅ Test 1: Bulk import tasks');
  const importOutput = execSync(`node "${cliPath}" task add-bulk "${tasksFile}"`, { encoding: 'utf8' });
  console.log(importOutput);

  console.log('✅ Test 2: List imported tasks');
  const listOutput = execSync(`node "${cliPath}" task list`, { encoding: 'utf8' });
  console.log(listOutput);

  console.log('✅ Test 3: Export tasks as JSON');
  const exportOutput = execSync(`node "${cliPath}" task export json`, { encoding: 'utf8' });
  const exportedData = JSON.parse(exportOutput);
  console.log(`Exported ${exportedData.totalTasks} tasks\n`);

  console.log('✅ Test 4: Export tasks for GitHub issues');
  const githubOutput = execSync(`node "${cliPath}" task export github-issues`, { encoding: 'utf8' });
  console.log('GitHub Issues format preview:');
  console.log(githubOutput.split('---')[0] + '...\n');

  console.log('✅ Test 5: Export with status filter');
  // First complete a task
  const tasks = JSON.parse(execSync(`node "${cliPath}" task export json`, { encoding: 'utf8' }));
  if (tasks.tasks.length > 0) {
    const taskId = tasks.tasks[0].id;
    execSync(`node "${cliPath}" task complete ${taskId} "Task completed for testing"`, { stdio: 'pipe' });

    const completedExport = execSync(`node "${cliPath}" task export json completed`, { encoding: 'utf8' });
    const completedData = JSON.parse(completedExport);
    console.log(`Exported ${completedData.totalTasks} completed tasks\n`);
  }

  console.log('✅ All bulk task tests passed!');

  // Cleanup
  process.chdir(__dirname);
  fs.rmSync(testDir, { recursive: true, force: true });
} catch (error) {
  console.error('❌ Test failed:', error.message);
  if (error.stdout) console.error('stdout:', error.stdout.toString());
  if (error.stderr) console.error('stderr:', error.stderr.toString());

  // Cleanup on error
  try {
    process.chdir(__dirname);
    fs.rmSync(testDir, { recursive: true, force: true });
  } catch (cleanupError) {
    // Ignore cleanup errors
  }

  process.exit(1);
}
