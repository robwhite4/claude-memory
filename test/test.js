#!/usr/bin/env node

/**
 * Claude Memory System Tests
 * Validates core functionality of the memory system
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');
const testDir = path.join(packageRoot, 'test-project');

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
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// Clean up test directory
if (fs.existsSync(testDir)) {
  fs.rmSync(testDir, { recursive: true, force: true });
}

// Create test project
fs.mkdirSync(testDir, { recursive: true });
process.chdir(testDir);

console.log('🧪 Running Claude Memory Tests...\n');

async function runTests() {
  // Test 1: CLI executable exists and is executable
  await test('CLI executable exists', () => {
    const cliPath = path.join(packageRoot, 'bin', 'claude-memory.js');
    assert(fs.existsSync(cliPath), 'CLI file should exist');
    
    const stats = fs.statSync(cliPath);
    assert(stats.mode & parseInt('111', 8), 'CLI should be executable');
  });

  // Test 2: Package.json is valid
  await test('Package.json is valid', () => {
    const pkgPath = path.join(packageRoot, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    
    assert(pkg.name === 'claude-memory', 'Package name should be claude-memory');
    assert(pkg.version, 'Package should have version');
    assert(pkg.bin['claude-memory'], 'Package should define CLI binary');
    assert(pkg.type === 'module', 'Package should use ES modules');
  });

  // Test 3: Initialize memory system
  await test('Memory initialization', async () => {
    const cliPath = path.join(packageRoot, 'bin', 'claude-memory.js');
    const { stdout } = await execAsync(`node "${cliPath}" init "Test Project"`);
    
    assert(stdout.includes('Claude Memory initialized'), 'Should show initialization success');
    assert(fs.existsSync('.claude'), '.claude directory should be created');
    assert(fs.existsSync('.claude/memory.json'), 'memory.json should be created');
    assert(fs.existsSync('CLAUDE.md'), 'CLAUDE.md should be created');
  });

  // Test 4: Memory file structure
  await test('Memory file structure', () => {
    const memoryData = JSON.parse(fs.readFileSync('.claude/memory.json', 'utf8'));
    
    assert(Array.isArray(memoryData.sessions), 'Should have sessions array');
    assert(Array.isArray(memoryData.decisions), 'Should have decisions array');
    assert(Array.isArray(memoryData.patterns), 'Should have patterns array');
    assert(Array.isArray(memoryData.actions), 'Should have actions array');
    assert(typeof memoryData.knowledge === 'object', 'Should have knowledge object');
    assert(memoryData.projectName === 'Test Project', 'Should store project name');
  });

  // Test 5: Stats command
  await test('Stats command', async () => {
    const cliPath = path.join(packageRoot, 'bin', 'claude-memory.js');
    const { stdout } = await execAsync(`node "${cliPath}" stats`);
    
    assert(stdout.includes('Claude Memory Statistics'), 'Should show statistics header');
    assert(stdout.includes('Sessions:'), 'Should show session count');
    assert(stdout.includes('Decisions:'), 'Should show decision count');
  });

  // Test 6: Decision recording
  await test('Decision recording', async () => {
    const cliPath = path.join(packageRoot, 'bin', 'claude-memory.js');
    const { stdout } = await execAsync(`node "${cliPath}" decision "Use React" "Better ecosystem" "Vue,Angular"`);
    
    assert(stdout.includes('Decision recorded'), 'Should confirm decision recording');
    
    const memoryData = JSON.parse(fs.readFileSync('.claude/memory.json', 'utf8'));
    assert(memoryData.decisions.length > 1, 'Should have recorded decision'); // There's already an initial decision from init
    const reactDecision = memoryData.decisions.find(d => d.decision === 'Use React');
    assert(reactDecision, 'Should store decision text');
  });

  // Test 7: Pattern learning
  await test('Pattern learning', async () => {
    const cliPath = path.join(packageRoot, 'bin', 'claude-memory.js');
    const { stdout } = await execAsync(`node "${cliPath}" pattern "Test first" "Prevents bugs" "0.9"`);
    
    assert(stdout.includes('Pattern learned'), 'Should confirm pattern learning');
    
    const memoryData = JSON.parse(fs.readFileSync('.claude/memory.json', 'utf8'));
    assert(memoryData.patterns.length > 0, 'Should have learned pattern');
    const lastPattern = memoryData.patterns[memoryData.patterns.length - 1];
    assert(lastPattern.pattern === 'Test first', 'Should store pattern name');
  });

  // Test 8: Search functionality
  await test('Search functionality', async () => {
    const cliPath = path.join(packageRoot, 'bin', 'claude-memory.js');
    const { stdout } = await execAsync(`node "${cliPath}" search "React"`);
    
    assert(stdout.includes('Search results'), 'Should show search results');
    assert(stdout.includes('Use React'), 'Should find recorded decision');
  });

  // Test 9: CLAUDE.md generation
  await test('CLAUDE.md generation', () => {
    const claudeContent = fs.readFileSync('CLAUDE.md', 'utf8');
    
    assert(claudeContent.includes('Claude Project Memory'), 'Should have header');
    assert(claudeContent.includes('Test Project'), 'Should include project name');
    assert(claudeContent.includes('Use React'), 'Should include recorded decisions');
    assert(claudeContent.includes('Test first'), 'Should include learned patterns');
  });

  // Test 10: Backup functionality
  await test('Backup functionality', async () => {
    const cliPath = path.join(packageRoot, 'bin', 'claude-memory.js');
    const { stdout } = await execAsync(`node "${cliPath}" backup`);
    
    assert(stdout.includes('Memory backed up'), 'Should confirm backup');
    assert(fs.existsSync('.claude/backups'), 'Should create backups directory');
    
    const backupDirs = fs.readdirSync('.claude/backups');
    assert(backupDirs.length > 0, 'Should create backup directory');
  });

  console.log(`\n📊 Test Results: ${passCount}/${testCount} passed`);

  if (passCount === testCount) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

runTests().catch(console.error);