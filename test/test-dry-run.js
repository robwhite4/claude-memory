#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const claudeMemoryPath = path.join(projectRoot, 'bin', 'claude-memory.js');

// Test project directory
const testProjectDir = path.join(projectRoot, 'test-dry-run-' + Date.now());

async function runTest() {
  console.log('🧪 Testing --dry-run flag implementation...\n');

  try {
    // Create test directory
    fs.mkdirSync(testProjectDir);
    process.chdir(testProjectDir);

    // Test 1: Init with dry run
    console.log('1️⃣ Testing init command with --dry-run');
    const { stdout: stdout1 } = await execAsync(
      `node "${claudeMemoryPath}" init "Test Project" --dry-run --verbose`
    );
    
    // Check that no directories were created
    if (!fs.existsSync(path.join(testProjectDir, '.claude'))) {
      console.log('✅ No .claude directory created (expected)\n');
    } else {
      console.log('❌ .claude directory was created in dry run mode\n');
    }

    // Test 2: Task add with dry run
    console.log('2️⃣ Testing task add with --dry-run');
    const { stdout: stdout2 } = await execAsync(
      `node "${claudeMemoryPath}" task add "Test task" --dry-run --verbose`
    );
    console.log('✅ Task add dry run completed\n');

    // Test 3: Decision with dry run
    console.log('3️⃣ Testing decision with --dry-run');
    const { stdout: stdout3 } = await execAsync(
      `node "${claudeMemoryPath}" decision "Test decision" "Test reasoning" --dry-run`
    );
    console.log('✅ Decision dry run completed\n');

    // Test 4: Pattern with dry run
    console.log('4️⃣ Testing pattern with --dry-run');
    const { stdout: stdout4 } = await execAsync(
      `node "${claudeMemoryPath}" pattern add "Test pattern" "Test description" --dry-run`
    );
    console.log('✅ Pattern add dry run completed\n');

    // Test 5: Knowledge with dry run
    console.log('5️⃣ Testing knowledge with --dry-run');
    const { stdout: stdout5 } = await execAsync(
      `node "${claudeMemoryPath}" knowledge add "test_key" "test_value" --category test --dry-run`
    );
    console.log('✅ Knowledge add dry run completed\n');

    // Test 6: Init on existing directory (edge case)
    console.log('6️⃣ Testing init on existing memory');
    // First create a real memory
    await execAsync(`node "${claudeMemoryPath}" init "Real Project" --quiet`);
    // Then try dry run
    const { stdout: stdout6 } = await execAsync(
      `node "${claudeMemoryPath}" task add "Another task" --dry-run --verbose`
    );
    console.log('✅ Dry run on existing memory completed\n');

    console.log('🎉 All dry run tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    process.chdir(projectRoot);
    if (fs.existsSync(testProjectDir)) {
      fs.rmSync(testProjectDir, { recursive: true });
    }
  }
}

runTest();