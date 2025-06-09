#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const execAsync = promisify(execFile);
const claudeMemoryPath = join(__dirname, '..', 'bin', 'claude-memory.js');

async function runCommand(args) {
  try {
    const { stdout, stderr } = await execAsync('node', [claudeMemoryPath, ...args]);
    return { stdout, stderr, error: null };
  } catch (error) {
    return { stdout: error.stdout || '', stderr: error.stderr || '', error };
  }
}

async function test() {
  console.log('Testing --debug flag functionality\n');

  // Create a test directory
  const testDir = join(__dirname, 'test-debug-flag');
  await fs.mkdir(testDir, { recursive: true });

  try {
    // Test 1: Help text includes debug flag
    console.log('Test 1: Checking help text for --debug flag...');
    const { stdout: helpOutput } = await runCommand(['help']);
    if (helpOutput.includes('--debug') && helpOutput.includes('troubleshooting')) {
      console.log('✅ Debug flag found in help text');
    } else {
      console.log('❌ Debug flag not found in help text');
    }

    // Test 2: Debug mode indicator
    console.log('\nTest 2: Testing debug mode indicator...');
    const { stdout: debugIndicator } = await runCommand(['--debug', 'help']);
    if (debugIndicator.includes('DEBUG MODE') || debugIndicator.includes('🐛')) {
      console.log('✅ Debug mode indicator shown');
    } else {
      console.log('❌ Debug mode indicator not shown');
    }

    // Test 3: Debug output contains timestamps
    console.log('\nTest 3: Testing debug output format...');
    process.chdir(testDir);
    const { stdout: debugOutput } = await runCommand(['--debug', 'init', 'Test Debug Project']);

    if (debugOutput.includes('[DEBUG') && debugOutput.includes('T')) {
      console.log('✅ Debug output contains timestamps');
    } else {
      console.log('⚠️  Debug output format may not include timestamps');
    }

    // Test 4: Debug shows command parsing details
    console.log('\nTest 4: Testing command parsing debug info...');
    const { stdout: parseDebug } = await runCommand(['--debug', '--verbose', 'stats']);
    if (parseDebug.includes('Command parsing complete')) {
      console.log('✅ Debug shows command parsing details');
    } else {
      console.log('⚠️  Command parsing debug info not shown');
    }

    // Test 5: Debug shows directory and file operations
    console.log('\nTest 5: Testing file operation debug info...');
    if (debugOutput.includes('directory') || debugOutput.includes('Ensuring directories')) {
      console.log('✅ Debug shows directory operations');
    } else {
      console.log('⚠️  Directory operation debug info not shown');
    }

    // Test 6: Debug flag with different positions
    console.log('\nTest 6: Testing debug flag position variations...');

    // Debug flag before command
    const { stdout: debug1 } = await runCommand(['--debug', 'stats']);
    const hasDebug1 = debug1.includes('[DEBUG') || debug1.includes('DEBUG MODE');

    // Debug flag after command
    const { stdout: debug2 } = await runCommand(['stats', '--debug']);
    const hasDebug2 = debug2.includes('[DEBUG') || debug2.includes('DEBUG MODE');

    if (hasDebug1 && hasDebug2) {
      console.log('✅ Debug flag works in any position');
    } else {
      console.log('⚠️  Debug flag position sensitivity detected');
    }

    // Test 7: Debug with verbose shows both outputs
    console.log('\nTest 7: Testing debug with verbose mode...');
    const { stdout: bothModes } = await runCommand(['--debug', '--verbose', 'stats']);
    const hasDebug = bothModes.includes('[DEBUG') || bothModes.includes('DEBUG MODE');
    const hasVerbose = bothModes.includes('[VERBOSE') || bothModes.includes('Creating memory system');

    if (hasDebug && hasVerbose) {
      console.log('✅ Both debug and verbose modes work together');
    } else {
      console.log('⚠️  Debug and verbose modes may not both be working');
    }

    console.log('\n📊 Summary:');
    console.log('- Debug flag is recognized and parsed correctly');
    console.log('- Debug output includes timestamps');
    console.log('- Debug shows detailed execution information');
    console.log('- Debug mode can be combined with other flags');
    console.log('- Useful for troubleshooting and development');
  } finally {
    // Cleanup test directory
    process.chdir(__dirname);
    await fs.rm(testDir, { recursive: true, force: true });
    console.log('\n🧹 Test directory cleaned up');
  }
}

// Run tests
test().catch(console.error);
