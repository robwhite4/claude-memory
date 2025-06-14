#!/usr/bin/env node

/**
 * Test for enhanced export functionality
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const binPath = path.join(__dirname, '..', 'bin', 'claude-memory.js');

// Test directory
const testDir = path.join(__dirname, 'test-export-' + Date.now());

async function runCommand(cmd) {
  try {
    const { stdout, stderr } = await execAsync(cmd, { cwd: testDir });
    return { stdout, stderr, success: true };
  } catch (error) {
    return { stdout: error.stdout, stderr: error.stderr, success: false, error };
  }
}

async function setupTestProject() {
  // Create test directory
  fs.mkdirSync(testDir, { recursive: true });

  // Initialize project
  await runCommand(`node ${binPath} init "Export Test Project"`);

  // Add test data
  await runCommand(`node ${binPath} task add "Test Task 1" --priority high`);
  await runCommand(`node ${binPath} task add "Test Task 2" --priority medium --assignee "John"`);
  await runCommand(`node ${binPath} task add "Test Task 3" --priority low`);

  await runCommand(`node ${binPath} pattern add "Test Pattern 1" "Description of pattern 1" --priority high`);
  await runCommand(`node ${binPath} pattern add "Test Pattern 2" "Description of pattern 2"`);

  const decision = 'Use export feature';
  const reasoning = 'Provides multiple formats';
  const alternatives = 'Manual export,No export';
  await runCommand(`node ${binPath} decision "${decision}" "${reasoning}" "${alternatives}"`);

  await runCommand(`node ${binPath} knowledge add "API_KEY" "test-api-key-123" --category config`);
  await runCommand(`node ${binPath} knowledge add "DB_URL" "postgresql://localhost" --category config`);

  await runCommand(`node ${binPath} session start "Test Session"`);
}

async function testExportFormats() {
  console.log('🧪 Testing Export Formats...\n');

  const tests = [
    {
      name: 'JSON Export (default)',
      command: 'export test-export.json',
      validate: (file) => {
        const content = fs.readFileSync(file, 'utf8');
        const data = JSON.parse(content);
        return data.tasks && data.patterns && data.decisions && data.knowledge;
      }
    },
    {
      name: 'YAML Export',
      command: 'export test-export.yaml --format yaml',
      validate: (file) => {
        const content = fs.readFileSync(file, 'utf8');
        const data = yaml.load(content);
        return data.tasks && data.patterns && data.decisions && data.knowledge;
      }
    },
    {
      name: 'CSV Export',
      command: 'export test-export.csv --format csv',
      validate: (file) => {
        const content = fs.readFileSync(file, 'utf8');
        return content.includes('=== TASKS ===') && content.includes('=== PATTERNS ===');
      }
    },
    {
      name: 'Markdown Export',
      command: 'export test-export.md --format markdown',
      validate: (file) => {
        const content = fs.readFileSync(file, 'utf8');
        return content.includes('# Claude Memory Export') && content.includes('## Tasks');
      }
    }
  ];

  for (const test of tests) {
    const result = await runCommand(`node ${binPath} ${test.command}`);
    const exportFile = path.join(testDir, test.command.split(' ')[1]);

    if (result.success && fs.existsSync(exportFile)) {
      try {
        if (test.validate(exportFile)) {
          console.log(`✅ ${test.name} - PASSED`);
        } else {
          console.log(`❌ ${test.name} - FAILED (invalid content)`);
        }
      } catch (error) {
        console.log(`❌ ${test.name} - FAILED (${error.message})`);
      }
    } else {
      console.log(`❌ ${test.name} - FAILED`);
      if (result.stderr) console.log(`   Error: ${result.stderr}`);
    }
  }
}

async function testTypeFiltering() {
  console.log('\n🧪 Testing Type Filtering...\n');

  const tests = [
    {
      name: 'Tasks only',
      command: 'export tasks-only.json --types tasks',
      validate: (data) => data.tasks && !data.patterns && !data.decisions
    },
    {
      name: 'Multiple types',
      command: 'export multi-type.json --types tasks,patterns',
      validate: (data) => data.tasks && data.patterns && !data.decisions
    }
  ];

  for (const test of tests) {
    const result = await runCommand(`node ${binPath} ${test.command}`);
    const exportFile = path.join(testDir, test.command.split(' ')[1]);

    if (result.success && fs.existsSync(exportFile)) {
      try {
        const content = fs.readFileSync(exportFile, 'utf8');
        const data = JSON.parse(content);
        if (test.validate(data)) {
          console.log(`✅ ${test.name} - PASSED`);
        } else {
          console.log(`❌ ${test.name} - FAILED (unexpected content)`);
        }
      } catch (error) {
        console.log(`❌ ${test.name} - FAILED (${error.message})`);
      }
    } else {
      console.log(`❌ ${test.name} - FAILED`);
    }
  }
}

async function testSanitization() {
  console.log('\n🧪 Testing Sanitization...\n');

  const result = await runCommand(`node ${binPath} export sanitized.json --sanitized`);
  const exportFile = path.join(testDir, 'sanitized.json');

  if (result.success && fs.existsSync(exportFile)) {
    try {
      const content = fs.readFileSync(exportFile, 'utf8');
      const data = JSON.parse(content);

      // Check if assignee is redacted
      const hasRedactedAssignee = data.tasks.some(task => task.assignee === 'REDACTED');
      const hasOriginalAssignee = data.tasks.some(task => task.assignee === 'John');

      if (hasRedactedAssignee && !hasOriginalAssignee) {
        console.log('✅ Sanitization - PASSED');
      } else {
        console.log('❌ Sanitization - FAILED (personal data not removed)');
      }
    } catch (error) {
      console.log(`❌ Sanitization - FAILED (${error.message})`);
    }
  } else {
    console.log('❌ Sanitization - FAILED');
  }
}

async function testHelp() {
  console.log('\n🧪 Testing Export Help...\n');

  const result = await runCommand(`node ${binPath} help export`);

  if (result.success && result.stdout.includes('Export Command') &&
      result.stdout.includes('--format') && result.stdout.includes('--types')) {
    console.log('✅ Export help documentation - PASSED');
  } else {
    console.log('❌ Export help documentation - FAILED');
  }
}

async function cleanup() {
  // Remove test directory
  fs.rmSync(testDir, { recursive: true, force: true });
}

async function runTests() {
  console.log('🚀 Enhanced Export Feature Tests\n');
  console.log(`Test directory: ${testDir}\n`);

  try {
    await setupTestProject();
    await testExportFormats();
    await testTypeFiltering();
    await testSanitization();
    await testHelp();

    console.log('\n✨ All tests completed!');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  } finally {
    await cleanup();
  }
}

// Run tests
runTests();
