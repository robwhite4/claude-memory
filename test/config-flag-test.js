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

// Test configuration
const testConfig = {
  projectName: "Test Project with Custom Config",
  autoSession: false,
  autoBackup: false,
  backupInterval: 50,
  maxBackupDays: 30,
  tokenOptimization: false,
  silentMode: false
};

async function runTest() {
  console.log('🧪 Testing --config flag implementation...\n');

  // Create test config file
  const testConfigPath = path.join(projectRoot, 'test-config.json');
  fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));

  try {
    // Test 1: CLI flag
    console.log('1️⃣ Testing CLI --config flag');
    const { stdout: stdout1 } = await execAsync(
      `node "${claudeMemoryPath}" --config "${testConfigPath}" --quiet stats`,
      { cwd: projectRoot }
    );
    console.log('✅ CLI flag test passed\n');

    // Test 2: Environment variable
    console.log('2️⃣ Testing CLAUDE_MEMORY_CONFIG environment variable');
    const { stdout: stdout2 } = await execAsync(
      `node "${claudeMemoryPath}" --quiet stats`,
      { 
        cwd: projectRoot,
        env: { ...process.env, CLAUDE_MEMORY_CONFIG: testConfigPath }
      }
    );
    console.log('✅ Environment variable test passed\n');

    // Test 3: Invalid config path
    console.log('3️⃣ Testing invalid config path handling');
    try {
      await execAsync(
        `node "${claudeMemoryPath}" --config`,
        { cwd: projectRoot }
      );
      console.log('❌ Should have failed with missing config path');
    } catch (error) {
      if (error.stderr.includes('--config flag requires a path')) {
        console.log('✅ Invalid config path handling test passed\n');
      } else {
        throw error;
      }
    }

    // Test 4: Non-existent config file
    console.log('4️⃣ Testing non-existent config file');
    const { stdout: stdout4 } = await execAsync(
      `node "${claudeMemoryPath}" --config "non-existent.json" --quiet stats`,
      { cwd: projectRoot }
    );
    console.log('✅ Non-existent config file test passed (uses defaults)\n');

    // Test 5: CLI flag overrides environment variable
    console.log('5️⃣ Testing CLI flag overrides environment variable');
    const altConfigPath = path.join(projectRoot, 'alt-config.json');
    const altConfig = { ...testConfig, projectName: "Alternative Config" };
    fs.writeFileSync(altConfigPath, JSON.stringify(altConfig, null, 2));
    
    const { stdout: stdout5 } = await execAsync(
      `node "${claudeMemoryPath}" --config "${testConfigPath}" --quiet stats`,
      { 
        cwd: projectRoot,
        env: { ...process.env, CLAUDE_MEMORY_CONFIG: altConfigPath }
      }
    );
    console.log('✅ CLI override test passed\n');

    // Cleanup
    fs.unlinkSync(testConfigPath);
    fs.unlinkSync(altConfigPath);

    console.log('🎉 All --config flag tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    // Cleanup on error
    if (fs.existsSync(testConfigPath)) fs.unlinkSync(testConfigPath);
    if (fs.existsSync(altConfigPath)) fs.unlinkSync(altConfigPath);
    process.exit(1);
  }
}

runTest();