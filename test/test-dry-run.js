#!/usr/bin/env node

/**
 * Test for --dry-run flag functionality
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.join(__dirname, '..', 'bin', 'claude-memory.js');

// Create a temporary test directory
const testDir = path.join(os.tmpdir(), `claude-memory-dry-run-test-${Date.now()}`);
fs.mkdirSync(testDir, { recursive: true });

// Test counter
let testsPassed = 0;
let testsFailed = 0;

function runTest(name, fn) {
  process.stdout.write(`Testing ${name}... `);
  try {
    fn();
    console.log('✅ PASSED');
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
}

// Test 1: Init with dry run should not create files
runTest('init with --dry-run', () => {
  const projectDir = path.join(testDir, 'dry-run-init');
  const output = execSync(`node ${cliPath} init "Test Project" "${projectDir}" --dry-run`, { encoding: 'utf8' });

  // Check that output contains dry run indicator
  if (!output.includes('DRY RUN MODE')) {
    throw new Error('No dry run mode indicator in output');
  }

  // Check that .claude directory was NOT created
  if (fs.existsSync(path.join(projectDir, '.claude'))) {
    throw new Error('.claude directory was created in dry run mode');
  }

  // Check that CLAUDE.md was NOT created
  if (fs.existsSync(path.join(projectDir, 'CLAUDE.md'))) {
    throw new Error('CLAUDE.md was created in dry run mode');
  }
});

// Test 2: Task add with dry run should not save
runTest('task add with --dry-run', () => {
  const projectDir = path.join(testDir, 'dry-run-task');
  fs.mkdirSync(projectDir, { recursive: true });

  // First init normally
  execSync(`node ${cliPath} init "Test Project" "${projectDir}"`, { encoding: 'utf8' });

  // Then try to add task with dry run
  execSync(`node ${cliPath} task add "Test task" --dry-run`, {
    encoding: 'utf8',
    cwd: projectDir
  });

  // Check memory file to ensure task wasn't added
  const memoryPath = path.join(projectDir, '.claude', 'memory.json');
  const memory = JSON.parse(fs.readFileSync(memoryPath, 'utf8'));

  if (memory.tasks.length > 0) {
    throw new Error('Task was added in dry run mode');
  }
});

// Test 3: Dry run with verbose should show what would happen
runTest('--dry-run with --verbose', () => {
  const projectDir = path.join(testDir, 'dry-run-verbose');
  const output = execSync(`node ${cliPath} init "Test Project" "${projectDir}" --dry-run --verbose`, {
    encoding: 'utf8'
  });

  // Check for verbose dry run messages
  if (!output.includes('[DRY RUN]')) {
    throw new Error('No [DRY RUN] messages in verbose output');
  }

  if (!output.includes('Would create')) {
    throw new Error('No "Would create" messages in verbose output');
  }
});

// Test 4: Pattern resolution with dry run
runTest('pattern resolve with --dry-run', () => {
  const projectDir = path.join(testDir, 'dry-run-pattern');
  fs.mkdirSync(projectDir, { recursive: true });

  // First init and add a pattern normally
  execSync(`node ${cliPath} init "Test Project" "${projectDir}"`, { encoding: 'utf8' });
  execSync(`node ${cliPath} pattern add "Test Pattern" "Test Description"`, {
    encoding: 'utf8',
    cwd: projectDir
  });

  // Get the pattern ID
  const memoryPath = path.join(projectDir, '.claude', 'memory.json');
  const memory = JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
  const patternId = memory.patterns[0].id;

  // Try to resolve with dry run
  execSync(`node ${cliPath} pattern resolve ${patternId} "Solution" --dry-run`, {
    encoding: 'utf8',
    cwd: projectDir
  });

  // Check that pattern is still unresolved
  const memoryAfter = JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
  if (memoryAfter.patterns[0].resolved) {
    throw new Error('Pattern was resolved in dry run mode');
  }
});

// Test 5: Session end with dry run
runTest('session end with --dry-run', () => {
  const projectDir = path.join(testDir, 'dry-run-session');
  fs.mkdirSync(projectDir, { recursive: true });

  // First init normally (creates a session)
  execSync(`node ${cliPath} init "Test Project" "${projectDir}"`, { encoding: 'utf8' });

  // Try to end session with dry run
  execSync(`node ${cliPath} session end "Test outcome" --dry-run`, {
    encoding: 'utf8',
    cwd: projectDir
  });

  // Check that session is still active
  const memoryPath = path.join(projectDir, '.claude', 'memory.json');
  const memory = JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
  const activeSession = memory.sessions.find(s => s.status === 'active');

  if (!activeSession) {
    throw new Error('Session was ended in dry run mode');
  }
});

// Test 6: Config set with dry run
runTest('config set with --dry-run', () => {
  const projectDir = path.join(testDir, 'dry-run-config');
  fs.mkdirSync(projectDir, { recursive: true });

  // First init normally
  execSync(`node ${cliPath} init "Test Project" "${projectDir}"`, { encoding: 'utf8' });

  // Try to change config with dry run
  execSync(`node ${cliPath} config set autoSessionHours 8 --dry-run`, {
    encoding: 'utf8',
    cwd: projectDir
  });

  // Check that config wasn't changed
  const configPath = path.join(projectDir, '.claude', 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  if (config.autoSessionHours === 8) {
    throw new Error('Config was changed in dry run mode');
  }
});

// Clean up test directory
fs.rmSync(testDir, { recursive: true, force: true });

// Report results
console.log('\n📊 Test Results:');
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);

process.exit(testsFailed > 0 ? 1 : 0);
