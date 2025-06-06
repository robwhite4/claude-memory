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

    // Skip executable check on Windows
    if (process.platform !== 'win32') {
      const stats = fs.statSync(cliPath);
      assert(stats.mode & parseInt('111', 8), 'CLI should be executable');
    }
  });

  // Test 2: Version flag
  await test('Version flag', async() => {
    const cliPath = path.join(packageRoot, 'bin', 'claude-memory.js');

    // Test --version
    const { stdout: versionLong } = await execAsync(`node "${cliPath}" --version`);
    assert(versionLong.includes('claude-memory v'), 'Should show version with --version');

    // Test -v
    const { stdout: versionShort } = await execAsync(`node "${cliPath}" -v`);
    assert(versionShort.includes('claude-memory v'), 'Should show version with -v');

    // Verify version matches package.json
    const pkg = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
    assert(versionLong.includes(pkg.version), 'Version should match package.json');
  });

  // Test 3: Package.json is valid
  await test('Package.json is valid', () => {
    const pkgPath = path.join(packageRoot, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    assert(pkg.name === 'claude-memory', 'Package name should be claude-memory');
    assert(pkg.version, 'Package should have version');
    assert(pkg.bin['claude-memory'], 'Package should define CLI binary');
    assert(pkg.type === 'module', 'Package should use ES modules');
  });

  // Test 3: Initialize memory system
  await test('Memory initialization', async() => {
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
  await test('Stats command', async() => {
    const cliPath = path.join(packageRoot, 'bin', 'claude-memory.js');
    const { stdout } = await execAsync(`node "${cliPath}" stats`);

    assert(stdout.includes('Claude Memory Statistics'), 'Should show statistics header');
    assert(stdout.includes('Sessions:'), 'Should show session count');
    assert(stdout.includes('Decisions:'), 'Should show decision count');
  });

  // Test 6: Decision recording
  await test('Decision recording', async() => {
    const cliPath = path.join(packageRoot, 'bin', 'claude-memory.js');
    const { stdout } = await execAsync(`node "${cliPath}" decision "Use React" "Better ecosystem" "Vue,Angular"`);

    assert(stdout.includes('Decision recorded'), 'Should confirm decision recording');

    const memoryData = JSON.parse(fs.readFileSync('.claude/memory.json', 'utf8'));
    // There's already an initial decision from init
    assert(memoryData.decisions.length > 1, 'Should have recorded decision');
    const reactDecision = memoryData.decisions.find(d => d.decision === 'Use React');
    assert(reactDecision, 'Should store decision text');
  });

  // Test 7: Pattern learning
  await test('Pattern learning', async() => {
    const cliPath = path.join(packageRoot, 'bin', 'claude-memory.js');
    const { stdout } = await execAsync(`node "${cliPath}" pattern "Test first" "Prevents bugs" "0.9"`);

    assert(stdout.includes('Pattern learned'), 'Should confirm pattern learning');

    const memoryData = JSON.parse(fs.readFileSync('.claude/memory.json', 'utf8'));
    assert(memoryData.patterns.length > 0, 'Should have learned pattern');
    const lastPattern = memoryData.patterns[memoryData.patterns.length - 1];
    assert(lastPattern.pattern === 'Test first', 'Should store pattern name');
  });

  // Test 8: Search functionality
  await test('Search functionality', async() => {
    const cliPath = path.join(packageRoot, 'bin', 'claude-memory.js');
    const { stdout } = await execAsync(`node "${cliPath}" search "React"`);

    assert(stdout.includes('Search results'), 'Should show search results');
    assert(stdout.includes('Use React'), 'Should find recorded decision');
  });

  // Test 9: CLAUDE.md generation
  await test('CLAUDE.md generation', async() => {
    // Disable token optimization to ensure all patterns show
    if (fs.existsSync('.claude/config.json')) {
      const config = JSON.parse(fs.readFileSync('.claude/config.json', 'utf8'));
      config.tokenOptimization = false;
      fs.writeFileSync('.claude/config.json', JSON.stringify(config, null, 2));
    }

    // Force CLAUDE.md regeneration by adding another pattern
    const cliPath = path.join(packageRoot, 'bin', 'claude-memory.js');
    await execAsync(`node "${cliPath}" pattern "Dummy" "Force update" 0.5`);

    const claudeContent = fs.readFileSync('CLAUDE.md', 'utf8');

    assert(claudeContent.includes('Claude Project Memory'), 'Should have header');
    assert(claudeContent.includes('Test Project'), 'Should include project name');
    assert(claudeContent.includes('Use React'), 'Should include recorded decisions');
    assert(claudeContent.includes('Test first'), 'Should include learned patterns');
  });

  // Test 10: Backup functionality
  await test('Backup functionality', async() => {
    const cliPath = path.join(packageRoot, 'bin', 'claude-memory.js');
    const { stdout } = await execAsync(`node "${cliPath}" backup`);

    assert(stdout.includes('Memory backed up'), 'Should confirm backup');
    assert(fs.existsSync('.claude/backups'), 'Should create backups directory');

    const backupDirs = fs.readdirSync('.claude/backups');
    assert(backupDirs.length > 0, 'Should create backup directory');
  });

  // Test 11: Context files generation
  await test('Context files generation', async() => {
    const cliPath = path.join(packageRoot, 'bin', 'claude-memory.js');

    // Add some knowledge to trigger context file generation
    await execAsync(`node "${cliPath}" knowledge add "test_key" "test_value" --category testing`);

    // Check context directory exists
    assert(fs.existsSync('.claude/context'), 'Should create context directory');

    // Check all context files exist
    const contextFiles = ['knowledge.md', 'patterns.md', 'decisions.md', 'tasks.md'];
    for (const file of contextFiles) {
      const filePath = path.join('.claude/context', file);
      assert(fs.existsSync(filePath), `Should create ${file}`);
    }

    // Verify knowledge.md contains our test entry
    const knowledgeContent = fs.readFileSync('.claude/context/knowledge.md', 'utf8');
    assert(knowledgeContent.includes('test_key'), 'Knowledge file should contain test key');
    assert(knowledgeContent.includes('test_value'), 'Knowledge file should contain test value');
    assert(knowledgeContent.includes('## testing'), 'Knowledge file should have category section');
  });

  // Test 12: Context files update on changes
  await test('Context files update on changes', async() => {
    const cliPath = path.join(packageRoot, 'bin', 'claude-memory.js');

    // Add a task
    await execAsync(`node "${cliPath}" task add "Test context update" --priority high`);

    // Check tasks.md was updated
    const tasksContent = fs.readFileSync('.claude/context/tasks.md', 'utf8');
    assert(tasksContent.includes('Test context update'), 'Tasks file should contain new task');
    assert(tasksContent.includes('High Priority'), 'Tasks file should show priority section');

    // Add a pattern
    await execAsync(`node "${cliPath}" pattern add "Test pattern" "For testing context files" 0.9 high`);

    // Check patterns.md was updated
    const patternsContent = fs.readFileSync('.claude/context/patterns.md', 'utf8');
    assert(patternsContent.includes('Test pattern'), 'Patterns file should contain new pattern');
    assert(patternsContent.includes('For testing context files'), 'Patterns file should contain description');
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
