#!/usr/bin/env node

/**
 * Security Feature Tests for Claude Memory
 * Tests input validation, sanitization, and security features
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const testDir = '/tmp/claude-memory-security-test';
const cliPath = path.resolve('./bin/claude-memory.js');

function runTest(name, testFn) {
  try {
    testFn();
    console.log(`✅ ${name}`);
    return true;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    return false;
  }
}

function setupTestEnv() {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testDir, { recursive: true });
  process.chdir(testDir);

  // Initialize memory
  execSync(`node "${cliPath}" init "Security Test Project"`, { stdio: 'pipe' });
}

function cleanupTestEnv() {
  process.chdir(path.dirname(testDir));
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}

console.log('🔒 Running Security Feature Tests...\n');

let passed = 0;
let total = 0;

setupTestEnv();

// Test XSS Prevention
total++;
passed += runTest('XSS prevention in decisions', () => {
  const xssInput = 'Test <script>alert(\'xss\')</script>';
  const result = execSync(`node "${cliPath}" decision "${xssInput}" "Clean input"`, { encoding: 'utf8' });
  if (result.includes('<script>') || result.includes('</script>')) {
    throw new Error('XSS script tags not properly sanitized');
  }
  // Should contain sanitized version without the dangerous tags
  if (!result.includes('Decision recorded')) {
    throw new Error('Decision not recorded properly');
  }
});

// Test Path Traversal Prevention
total++;
passed += runTest('Path traversal prevention', () => {
  const result = execSync(`node "${cliPath}" decision "../../../etc/passwd" "Path test"`, { encoding: 'utf8' });
  if (result.includes('../')) {
    throw new Error('Path traversal sequences not filtered');
  }
});

// Test Input Length Limits
total++;
passed += runTest('Input length limits', () => {
  const longInput = 'A'.repeat(2000);
  const result = execSync(`node "${cliPath}" decision "${longInput}" "Length test"`, { encoding: 'utf8' });
  // Should not crash and should limit length
  if (!result.includes('Decision recorded')) {
    throw new Error('Long input not handled properly');
  }
});

// Test Task Priority Validation
total++;
passed += runTest('Task priority validation', () => {
  const result = execSync(`node "${cliPath}" task add "Test task" --priority invalid`, { encoding: 'utf8' });
  if (!result.includes('Priority: medium')) {
    throw new Error('Invalid priority not defaulted to medium');
  }
});

// Test Export Sanitized Flag
total++;
passed += runTest('Export sanitized functionality', () => {
  // Add some data first
  execSync(`node "${cliPath}" decision "Test decision" "Test reasoning"`, { stdio: 'pipe' });
  execSync(`node "${cliPath}" task add "Test task" --assignee "John Doe"`, { stdio: 'pipe' });

  const result = execSync(`node "${cliPath}" export --sanitized test-export.json`, { encoding: 'utf8' });
  if (!result.includes('sanitized')) {
    throw new Error('Sanitized flag not recognized');
  }

  // Check if file was created and contains sanitized data
  if (!fs.existsSync('test-export.json')) {
    throw new Error('Sanitized export file not created');
  }

  const exportData = JSON.parse(fs.readFileSync('test-export.json', 'utf8'));
  if (exportData.tasks && exportData.tasks[0] && exportData.tasks[0].assignee === 'John Doe') {
    throw new Error('Personal data not sanitized in export');
  }
});

// Test Handoff Command
total++;
passed += runTest('Handoff command functionality', () => {
  const result = execSync(`node "${cliPath}" handoff`, { encoding: 'utf8' });
  if (!result.includes('AI Handoff Summary')) {
    throw new Error('Handoff command not working');
  }
});

// Test Handoff JSON Format
total++;
passed += runTest('Handoff JSON format', () => {
  const result = execSync(`node "${cliPath}" handoff --format=json`, { encoding: 'utf8' });
  try {
    const parsed = JSON.parse(result);
    if (!parsed.timestamp || !parsed.project) {
      throw new Error('Invalid JSON structure');
    }
  } catch (e) {
    throw new Error('Handoff JSON output invalid');
  }
});

// Test Handoff Task Focus
total++;
passed += runTest('Handoff task focus', () => {
  const result = execSync(`node "${cliPath}" handoff --include=tasks`, { encoding: 'utf8' });
  if (!result.includes('Active Tasks') && !result.includes('No active tasks')) {
    throw new Error('Task focus not working');
  }
});

// Test Input Validation Error Handling
total++;
passed += runTest('Empty input validation', () => {
  // The command should show error message and exit gracefully
  const result = execSync(`node "${cliPath}" decision "" "test" 2>&1 || true`, { encoding: 'utf8' });
  if (!result.includes('Decision and reasoning required')) {
    throw new Error('Should have shown error message for empty decision');
  }
});

// Test Version Migration
total++;
passed += runTest('Version migration functionality', () => {
  // This should trigger the version migration we added
  const result = execSync(`node "${cliPath}" stats`, { encoding: 'utf8' });
  if (!result.includes('Statistics')) {
    throw new Error('Stats command failed after migration');
  }
});

cleanupTestEnv();

console.log(`\n📊 Security Test Results: ${passed}/${total} passed`);

if (passed === total) {
  console.log('🎉 All security tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some security tests failed!');
  process.exit(1);
}
