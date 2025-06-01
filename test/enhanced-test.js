#!/usr/bin/env node

/**
 * Enhanced Claude Memory System Tests
 * Comprehensive test suite with coverage for v1.1.0 features
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');
const testDir = path.join(packageRoot, 'test-enhanced');

let testCount = 0;
let passCount = 0;

async function test(name, fn) {
  testCount++;
  try {
    await fn();
    console.log(`✅ ${name}`);
    passCount++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertIncludes(text, substring, message) {
  assert(text.includes(substring), `${message}: Expected "${text}" to include "${substring}"`);
}

// Clean up test directory
if (fs.existsSync(testDir)) {
  fs.rmSync(testDir, { recursive: true, force: true });
}

// Create test project
fs.mkdirSync(testDir, { recursive: true });
process.chdir(testDir);

console.log('🧪 Running Enhanced Claude Memory Tests...\n');

async function runTests() {
  const cliPath = path.join(packageRoot, 'bin', 'claude-memory.js');

  // Test 1: CLI executable and package validation
  await test('CLI executable exists and package is valid', () => {
    assert(fs.existsSync(cliPath), 'CLI file should exist');
    
    const stats = fs.statSync(cliPath);
    assert(stats.mode & parseInt('111', 8), 'CLI should be executable');
    
    const pkgPath = path.join(packageRoot, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    
    assert(pkg.name === 'claude-memory', 'Package name should be claude-memory');
    assert(pkg.version.match(/^\d+\.\d+\.\d+$/), 'Package should have semver version');
    assert(pkg.bin['claude-memory'], 'Package should define CLI binary');
  });

  // Test 2: System initialization
  await test('Memory system initialization', async () => {
    const { stdout } = await execAsync(`node "${cliPath}" init "Enhanced Test Project"`);
    
    assertIncludes(stdout, 'Claude Memory initialized', 'Should show initialization success');
    assert(fs.existsSync('.claude'), '.claude directory should be created');
    assert(fs.existsSync('.claude/memory.json'), 'memory.json should be created');
    assert(fs.existsSync('CLAUDE.md'), 'CLAUDE.md should be created');
    assert(fs.existsSync('.gitignore'), '.gitignore should be updated');
  });

  // Test 3: Memory data structure validation
  await test('Memory data structure validation', () => {
    const memoryData = JSON.parse(fs.readFileSync('.claude/memory.json', 'utf8'));
    
    // Core arrays
    assert(Array.isArray(memoryData.sessions), 'Should have sessions array');
    assert(Array.isArray(memoryData.decisions), 'Should have decisions array');
    assert(Array.isArray(memoryData.patterns), 'Should have patterns array');
    assert(Array.isArray(memoryData.actions), 'Should have actions array');
    assert(Array.isArray(memoryData.tasks), 'Should have tasks array (v1.1.0)');
    
    // Core objects
    assert(typeof memoryData.knowledge === 'object', 'Should have knowledge object');
    
    // Metadata validation
    assert(memoryData.projectName === 'Enhanced Test Project', 'Should store project name');
    assert(memoryData.version, 'Should have version');
    assert(memoryData.created, 'Should have creation timestamp');
  });

  // Test 4: Task Management System (NEW in v1.1.0)
  await test('Task management - add task', async () => {
    const { stdout } = await execAsync(`node "${cliPath}" task add "Test task management" --priority high`);
    
    assertIncludes(stdout, 'Task added', 'Should confirm task addition');
    assertIncludes(stdout, 'Priority: high', 'Should show priority');
    
    const memoryData = JSON.parse(fs.readFileSync('.claude/memory.json', 'utf8'));
    assert(memoryData.tasks.length > 0, 'Should have added task');
    
    const task = memoryData.tasks[0];
    assert(task.description === 'Test task management', 'Should store task description');
    assert(task.priority === 'high', 'Should store task priority');
    assert(task.status === 'open', 'Should default to open status');
    assert(task.id, 'Should generate task ID');
  });

  // Test 5: Task listing
  await test('Task management - list tasks', async () => {
    const { stdout } = await execAsync(`node "${cliPath}" task list`);
    
    assertIncludes(stdout, 'Tasks:', 'Should show tasks header');
    assertIncludes(stdout, 'Test task management', 'Should list added task');
    assertIncludes(stdout, 'Priority: high', 'Should show task priority');
    assertIncludes(stdout, 'Status: open', 'Should show task status');
  });

  // Test 6: Task completion
  await test('Task management - complete task', async () => {
    // Get task ID
    const memoryData = JSON.parse(fs.readFileSync('.claude/memory.json', 'utf8'));
    const taskId = memoryData.tasks[0].id;
    
    const { stdout } = await execAsync(`node "${cliPath}" task complete ${taskId} "Successfully tested"`);
    
    assertIncludes(stdout, 'Task completed', 'Should confirm task completion');
    
    const updatedMemory = JSON.parse(fs.readFileSync('.claude/memory.json', 'utf8'));
    const completedTask = updatedMemory.tasks.find(t => t.id === taskId);
    assert(completedTask.status === 'completed', 'Should mark task as completed');
    assert(completedTask.outcome === 'Successfully tested', 'Should store outcome');
    assert(completedTask.completedAt, 'Should store completion timestamp');
  });

  // Test 7: Enhanced Pattern System (v1.1.0)
  await test('Enhanced pattern learning with priority', async () => {
    const { stdout } = await execAsync(`node "${cliPath}" pattern "Security First" "Always validate input" "0.9" "high"`);
    
    assertIncludes(stdout, 'Pattern learned', 'Should confirm pattern learning');
    assertIncludes(stdout, 'Priority: high', 'Should show priority');
    
    const memoryData = JSON.parse(fs.readFileSync('.claude/memory.json', 'utf8'));
    const pattern = memoryData.patterns.find(p => p.pattern === 'Security First');
    assert(pattern, 'Should store pattern');
    assert(pattern.priority === 'high', 'Should store priority');
    assert(pattern.status === 'open', 'Should default to open status');
    assert(pattern.effectiveness === 0.9, 'Should store effectiveness');
  });

  // Test 8: Pattern resolution (NEW in v1.1.0)
  await test('Pattern resolution', async () => {
    // Get pattern ID
    const memoryData = JSON.parse(fs.readFileSync('.claude/memory.json', 'utf8'));
    const pattern = memoryData.patterns.find(p => p.pattern === 'Security First');
    const patternId = pattern.id;
    
    const { stdout } = await execAsync(`node "${cliPath}" pattern resolve ${patternId} "Implemented input validation middleware"`);
    
    assertIncludes(stdout, 'Pattern resolved', 'Should confirm pattern resolution');
    
    const updatedMemory = JSON.parse(fs.readFileSync('.claude/memory.json', 'utf8'));
    const resolvedPattern = updatedMemory.patterns.find(p => p.id === patternId);
    assert(resolvedPattern.status === 'resolved', 'Should mark pattern as resolved');
    assert(resolvedPattern.solution === 'Implemented input validation middleware', 'Should store solution');
    assert(resolvedPattern.resolvedAt, 'Should store resolution timestamp');
  });

  // Test 9: Enhanced Session Management (v1.1.0)
  await test('Enhanced session management', async () => {
    // Start session
    const { stdout: startOutput } = await execAsync(`node "${cliPath}" session start "Test Session"`);
    assertIncludes(startOutput, 'Started session', 'Should start session');
    
    // List sessions to verify
    const { stdout: listOutput } = await execAsync(`node "${cliPath}" session list`);
    assertIncludes(listOutput, 'Test Session', 'Should list created session');
    
    // Test cleanup (should clean up active sessions)
    const { stdout: cleanupOutput } = await execAsync(`node "${cliPath}" session cleanup`);
    assertIncludes(cleanupOutput, 'Cleaned up', 'Should cleanup sessions');
    
    // Verify sessions were cleaned up
    const memoryData = JSON.parse(fs.readFileSync('.claude/memory.json', 'utf8'));
    const activeSessions = memoryData.sessions.filter(s => s.status === 'active');
    assert(activeSessions.length === 0, 'Should have no active sessions after cleanup');
  });

  // Test 10: Decision recording with enhanced tracking
  await test('Decision recording with context', async () => {
    const { stdout } = await execAsync(`node "${cliPath}" decision "Use TypeScript" "Better type safety" "JavaScript,Flow"`);
    
    assertIncludes(stdout, 'Decision recorded', 'Should confirm decision recording');
    
    const memoryData = JSON.parse(fs.readFileSync('.claude/memory.json', 'utf8'));
    const decision = memoryData.decisions.find(d => d.decision === 'Use TypeScript');
    assert(decision, 'Should store decision');
    assert(decision.reasoning === 'Better type safety', 'Should store reasoning');
    assert(Array.isArray(decision.alternatives), 'Should store alternatives array');
    assert(decision.alternatives.includes('JavaScript'), 'Should parse alternatives');
  });

  // Test 11: Search functionality across all data types
  await test('Comprehensive search functionality', async () => {
    const { stdout } = await execAsync(`node "${cliPath}" search "Security"`);
    
    assertIncludes(stdout, 'Search results', 'Should show search results header');
    assertIncludes(stdout, 'Security First', 'Should find pattern');
  });

  // Test 12: CLAUDE.md generation with v1.1.0 features
  await test('Enhanced CLAUDE.md generation', () => {
    const claudeContent = fs.readFileSync('CLAUDE.md', 'utf8');
    
    // Header and project info
    assertIncludes(claudeContent, 'Claude Project Memory', 'Should have header');
    assertIncludes(claudeContent, 'Enhanced Test Project', 'Should include project name');
    
    // v1.1.0 features in CLAUDE.md
    assertIncludes(claudeContent, 'Task Management', 'Should include task management section');
    assertIncludes(claudeContent, 'Active Tasks', 'Should have active tasks section');
    assertIncludes(claudeContent, 'Recently Completed', 'Should have completed tasks section');
    assertIncludes(claudeContent, 'Open Patterns', 'Should have patterns section');
    assertIncludes(claudeContent, 'Recently Resolved', 'Should have resolved patterns section');
    
    // Content validation
    assertIncludes(claudeContent, 'Use TypeScript', 'Should include recent decision');
    assertIncludes(claudeContent, 'Test task management', 'Should include completed task');
  });

  // Test 13: Stats command with v1.1.0 data
  await test('Enhanced stats command', async () => {
    const { stdout } = await execAsync(`node "${cliPath}" stats`);
    
    assertIncludes(stdout, 'Claude Memory Statistics', 'Should show statistics header');
    assertIncludes(stdout, 'Sessions:', 'Should show session count');
    assertIncludes(stdout, 'Decisions:', 'Should show decision count');
    assertIncludes(stdout, 'Patterns:', 'Should show pattern count');
    assertIncludes(stdout, 'Tasks:', 'Should show task count (v1.1.0)');
    assertIncludes(stdout, 'Actions:', 'Should show action count');
  });

  // Test 14: Backup and export functionality
  await test('Backup and export functionality', async () => {
    // Test backup
    const { stdout: backupOutput } = await execAsync(`node "${cliPath}" backup`);
    assertIncludes(backupOutput, 'Memory backed up', 'Should confirm backup');
    assert(fs.existsSync('.claude/backups'), 'Should create backups directory');
    
    // Test export
    const { stdout: exportOutput } = await execAsync(`node "${cliPath}" export test-export.json`);
    assertIncludes(exportOutput, 'Memory exported', 'Should confirm export');
    assert(fs.existsSync('test-export.json'), 'Should create export file');
    
    const exportData = JSON.parse(fs.readFileSync('test-export.json', 'utf8'));
    assert(exportData.tasks, 'Export should include tasks');
    assert(exportData.patterns, 'Export should include patterns');
    assert(exportData.decisions, 'Export should include decisions');
  });

  // Test 15: Help command validation
  await test('Help command shows v1.1.0 features', async () => {
    const { stdout } = await execAsync(`node "${cliPath}" help`);
    
    assertIncludes(stdout, 'Claude Memory v', 'Should show version');
    assertIncludes(stdout, 'task add', 'Should document task commands');
    assertIncludes(stdout, 'pattern resolve', 'Should document pattern resolution');
    assertIncludes(stdout, 'session cleanup', 'Should document session cleanup');
  });

  // Summary
  console.log(`\n📊 Enhanced Test Results: ${passCount}/${testCount} passed`);

  if (passCount === testCount) {
    console.log('🎉 All enhanced tests passed!');
    console.log(`✨ v1.1.0 features validated: Task Management, Pattern Resolution, Enhanced Sessions`);
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

runTests().catch(console.error);