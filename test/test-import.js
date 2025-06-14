#!/usr/bin/env node

/**
 * Claude Memory Import Tests
 * Tests the import command functionality including merge/replace modes
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');
const testDir = path.join(packageRoot, 'test-import-project');

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

console.log('🧪 Running Claude Memory Import Tests...\n');

// Create test data files
const testData = {
  tasks: [
    {
      id: 'test-task-1',
      description: 'Test task 1',
      priority: 'high',
      status: 'pending',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'test-task-2',
      description: 'Test task 2',
      priority: 'medium',
      status: 'completed',
      createdAt: '2024-01-02T00:00:00Z',
      completedAt: '2024-01-03T00:00:00Z'
    }
  ],
  patterns: [
    {
      id: 'test-pattern-1',
      pattern: 'Test Pattern',
      description: 'A test pattern for import',
      priority: 'high',
      effectiveness: 0.8,
      status: 'active'
    }
  ],
  decisions: [
    {
      decision: 'Use test framework',
      reasoning: 'Better testing capabilities',
      alternativesConsidered: 'Manual testing',
      timestamp: '2024-01-01T00:00:00Z'
    }
  ],
  knowledge: {
    config: {
      api_url: { value: 'https://api.test.com', lastUpdated: '2024-01-01T00:00:00Z' },
      api_key: { value: 'test-key-123', lastUpdated: '2024-01-01T00:00:00Z' }
    }
  },
  sessions: [
    {
      id: 'test-session-1',
      name: 'Test Session',
      startTime: '2024-01-01T00:00:00Z',
      endTime: '2024-01-01T02:00:00Z',
      status: 'completed',
      outcome: 'Session completed successfully'
    }
  ]
};

async function runTests() {
  const cliPath = path.join(packageRoot, 'bin', 'claude-memory.js');

  // Initialize memory system first
  await test('Initialize memory system', async() => {
    const { stdout } = await execAsync(`node "${cliPath}" init "Import Test Project"`);
    assert(stdout.includes('Claude Memory initialized'), 'Should initialize memory');
    assert(fs.existsSync('.claude'), 'Should create .claude directory');
  });

  // Test 1: Import JSON file
  await test('Import JSON file', async() => {
    // Create test JSON file
    const jsonFile = 'test-import.json';
    fs.writeFileSync(jsonFile, JSON.stringify(testData, null, 2));

    const { stdout } = await execAsync(`node "${cliPath}" import ${jsonFile}`);
    assert(stdout.includes('Import completed successfully'), 'Should complete import');
    assert(stdout.includes('Imported:'), 'Should show import count');
  });

  // Test 2: Verify imported data
  await test('Verify imported data', async() => {
    const memoryData = JSON.parse(fs.readFileSync('.claude/memory.json', 'utf8'));

    // Check tasks
    assert(memoryData.tasks.some(t => t.id === 'test-task-1'), 'Should import task 1');
    assert(memoryData.tasks.some(t => t.id === 'test-task-2'), 'Should import task 2');

    // Check patterns
    assert(memoryData.patterns.some(p => p.pattern === 'Test Pattern'), 'Should import pattern');

    // Check decisions
    assert(memoryData.decisions.some(d => d.decision === 'Use test framework'), 'Should import decision');

    // Check knowledge
    assert(memoryData.knowledge.config?.api_url?.value === 'https://api.test.com', 'Should import knowledge');

    // Check sessions
    assert(memoryData.sessions.some(s => s.id === 'test-session-1'), 'Should import session');
  });

  // Test 3: Import with --dry-run
  await test('Import with dry-run', async() => {
    const modifiedData = {
      ...testData,
      tasks: [...testData.tasks, {
        id: 'test-task-3',
        description: 'New task for dry run',
        priority: 'low',
        status: 'pending'
      }]
    };

    const dryRunFile = 'test-dry-run.json';
    fs.writeFileSync(dryRunFile, JSON.stringify(modifiedData, null, 2));

    const { stdout } = await execAsync(`node "${cliPath}" import ${dryRunFile} --dry-run`);
    assert(stdout.includes('DRY RUN MODE'), 'Should indicate dry run mode');
    assert(stdout.includes('Import Summary'), 'Should show import summary');
    assert(stdout.includes('No changes will be made'), 'Should indicate no changes');

    // Verify no changes were made
    const memoryData = JSON.parse(fs.readFileSync('.claude/memory.json', 'utf8'));
    assert(!memoryData.tasks.some(t => t.id === 'test-task-3'), 'Should not import in dry run');
  });

  // Test 4: Import with merge mode (duplicate handling)
  await test('Import with merge mode - duplicates', async() => {
    const duplicateData = {
      tasks: [
        testData.tasks[0], // Duplicate
        {
          id: 'test-task-4',
          description: 'New task for merge',
          priority: 'medium',
          status: 'pending'
        }
      ]
    };

    const mergeFile = 'test-merge.json';
    fs.writeFileSync(mergeFile, JSON.stringify(duplicateData, null, 2));

    const { stdout } = await execAsync(`node "${cliPath}" import ${mergeFile} --mode merge`);
    assert(stdout.includes('Skipped:'), 'Should show skipped count');
    assert(stdout.includes('(duplicates)'), 'Should indicate duplicates');

    const memoryData = JSON.parse(fs.readFileSync('.claude/memory.json', 'utf8'));
    assert(memoryData.tasks.some(t => t.id === 'test-task-4'), 'Should import new task');
    assert(memoryData.tasks.filter(t => t.id === 'test-task-1').length === 1, 'Should not duplicate task');
  });

  // Test 5: Import with replace mode
  await test('Import with replace mode', async() => {
    const replaceData = {
      tasks: [{
        id: 'replaced-task-1',
        description: 'Replaced task',
        priority: 'high',
        status: 'pending'
      }]
    };

    const replaceFile = 'test-replace.json';
    fs.writeFileSync(replaceFile, JSON.stringify(replaceData, null, 2));

    const { stdout } = await execAsync(`node "${cliPath}" import ${replaceFile} --mode replace --types tasks`);
    assert(stdout.includes('Mode: replace'), 'Should indicate replace mode');

    const memoryData = JSON.parse(fs.readFileSync('.claude/memory.json', 'utf8'));
    assert(memoryData.tasks.length === 1, 'Should have only replaced tasks');
    assert(memoryData.tasks[0].id === 'replaced-task-1', 'Should have replaced task');
    assert(memoryData.patterns.length > 0, 'Should preserve other data types');
  });

  // Test 6: Import with --types filter
  await test('Import with types filter', async() => {
    const filterData = {
      tasks: [{
        id: 'filtered-task',
        description: 'Task to import',
        priority: 'high',
        status: 'pending'
      }],
      patterns: [{
        id: 'filtered-pattern',
        pattern: 'Should not import',
        description: 'This pattern should be filtered out',
        priority: 'low'
      }]
    };

    const filterFile = 'test-filter.json';
    fs.writeFileSync(filterFile, JSON.stringify(filterData, null, 2));

    await execAsync(`node "${cliPath}" import ${filterFile} --types tasks`);

    const memoryData = JSON.parse(fs.readFileSync('.claude/memory.json', 'utf8'));
    assert(memoryData.tasks.some(t => t.id === 'filtered-task'), 'Should import filtered task');
    assert(!memoryData.patterns.some(p => p.id === 'filtered-pattern'), 'Should not import filtered pattern');
  });

  // Test 7: Import YAML file
  await test('Import YAML file', async() => {
    const yamlContent = `tasks:
  - id: yaml-task-1
    description: Task from YAML
    priority: medium
    status: pending
patterns:
  - pattern: YAML Pattern
    description: Pattern from YAML file
    priority: high
    effectiveness: 0.7`;

    const yamlFile = 'test-import.yaml';
    fs.writeFileSync(yamlFile, yamlContent);

    const { stdout } = await execAsync(`node "${cliPath}" import ${yamlFile}`);
    assert(stdout.includes('Import completed successfully'), 'Should import YAML file');

    const memoryData = JSON.parse(fs.readFileSync('.claude/memory.json', 'utf8'));
    assert(memoryData.tasks.some(t => t.id === 'yaml-task-1'), 'Should import YAML task');
    assert(memoryData.patterns.some(p => p.pattern === 'YAML Pattern'), 'Should import YAML pattern');
  });

  // Test 8: Import validation - missing required fields
  await test('Import validation - missing fields', async() => {
    const invalidData = {
      tasks: [{
        // Missing description (required)
        priority: 'high',
        status: 'pending'
      }]
    };

    const invalidFile = 'test-invalid.json';
    fs.writeFileSync(invalidFile, JSON.stringify(invalidData, null, 2));

    try {
      await execAsync(`node "${cliPath}" import ${invalidFile}`);
      assert(false, 'Should fail validation');
    } catch (error) {
      assert(error.stderr.includes('Import validation failed'), 'Should show validation error');
      assert(error.stderr.includes('missing required field: description'), 'Should specify missing field');
    }
  });

  // Test 9: Import validation - invalid enum values
  await test('Import validation - invalid enums', async() => {
    const invalidData = {
      tasks: [{
        description: 'Test task',
        priority: 'ultra-high', // Invalid priority
        status: 'pending'
      }]
    };

    const invalidFile = 'test-invalid-enum.json';
    fs.writeFileSync(invalidFile, JSON.stringify(invalidData, null, 2));

    try {
      await execAsync(`node "${cliPath}" import ${invalidFile}`);
      assert(false, 'Should fail validation');
    } catch (error) {
      assert(error.stderr.includes('Import validation failed'), 'Should show validation error');
      assert(error.stderr.includes('invalid priority'), 'Should specify invalid enum');
    }
  });

  // Test 10: Import non-existent file
  await test('Import non-existent file', async() => {
    try {
      await execAsync(`node "${cliPath}" import non-existent.json`);
      assert(false, 'Should fail for non-existent file');
    } catch (error) {
      assert(error.stderr.includes('File not found'), 'Should show file not found error');
    }
  });

  // Test 11: Import with multiple types
  await test('Import multiple types filter', async() => {
    // Create new data to avoid duplicates
    const multiTypeData = {
      tasks: [{
        id: 'multi-task-1',
        description: 'Multi-type test task',
        priority: 'high',
        status: 'pending'
      }],
      patterns: [{
        id: 'multi-pattern-1',
        pattern: 'Multi-type test pattern',
        description: 'Testing multiple type filter',
        priority: 'medium'
      }],
      decisions: [{
        decision: 'Should not import this',
        reasoning: 'This is filtered out',
        timestamp: '2024-01-01T00:00:00Z'
      }]
    };

    const multiTypeFile = 'test-multi-type.json';
    fs.writeFileSync(multiTypeFile, JSON.stringify(multiTypeData, null, 2));

    const { stdout } = await execAsync(`node "${cliPath}" import ${multiTypeFile} --types tasks,patterns`);

    assert(stdout.includes('Import completed successfully'), 'Should complete import');
    assert(stdout.includes('Imported:'), 'Should show import count');

    // Verify the filtered types were imported
    const memoryData = JSON.parse(fs.readFileSync('.claude/memory.json', 'utf8'));
    assert(memoryData.tasks.some(t => t.id === 'multi-task-1'), 'Should import filtered task');
    assert(memoryData.patterns.some(p => p.id === 'multi-pattern-1'), 'Should import filtered pattern');
    assert(
      !memoryData.decisions.some(d => d.decision === 'Should not import this'),
      'Should not import filtered decision'
    );
  });

  // Test 12: Import auto-generates IDs
  await test('Import auto-generates IDs', async() => {
    const noIdData = {
      tasks: [{
        description: 'Task without ID',
        priority: 'low',
        status: 'pending'
      }],
      patterns: [{
        pattern: 'Pattern without ID',
        description: 'Should get auto ID',
        priority: 'medium'
      }]
    };

    const noIdFile = 'test-no-id.json';
    fs.writeFileSync(noIdFile, JSON.stringify(noIdData, null, 2));

    const { stdout } = await execAsync(`node "${cliPath}" import ${noIdFile}`);
    assert(stdout.includes('Import completed successfully'), 'Should import without IDs');

    const memoryData = JSON.parse(fs.readFileSync('.claude/memory.json', 'utf8'));
    const taskWithoutId = memoryData.tasks.find(t => t.description === 'Task without ID');
    assert(taskWithoutId?.id, 'Should generate task ID');
    assert(taskWithoutId.id.length > 10, 'Should have valid generated ID');
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
