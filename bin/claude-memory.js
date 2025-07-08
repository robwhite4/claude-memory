#!/usr/bin/env node

/**
 * Claude Memory - Universal AI Memory System
 *
 * Transform AI conversations into persistent project intelligence
 *
 * Usage: claude-memory <command> [args...]
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';

// Import from lib modules
import { ClaudeMemory } from '../lib/ClaudeMemory.js';
import {
  validatePath
} from '../lib/utils/validators.js';
import {
  sanitizeInput,
  sanitizeDescription
} from '../lib/utils/sanitizers.js';
import {
  formatOutput
} from '../lib/utils/formatters.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');

// Load package.json for version info
const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));

// Global quiet mode flag
let globalQuietMode = false;
// Global output format
let globalOutputFormat = 'text';
// Global verbose mode flag
let globalVerboseMode = false;
// Global dry run mode flag
let globalDryRunMode = false;
// Global config path override
let globalConfigPath = null;
// Global force mode flag
let globalForceMode = false;
// Global debug mode flag
let globalDebugMode = false;

// Helper to create memory instance with global flags
function createMemory(projectPath, projectName = null, options = {}) {
  // Pass dry run mode through options
  if (globalDryRunMode) {
    options.dryRun = true;
  }

  // Pass force mode through options
  if (globalForceMode) {
    options.force = true;
  }

  // Check for config path from environment variable or global configPath
  const envConfigPath = process.env.CLAUDE_MEMORY_CONFIG;
  const finalConfigPath = globalConfigPath || envConfigPath;

  if (finalConfigPath) {
    options.configPath = finalConfigPath;
  }

  const memory = new ClaudeMemory(projectPath, projectName, options);
  memory.quietMode = globalQuietMode;
  memory.outputFormat = globalOutputFormat;
  memory.verboseMode = globalVerboseMode;
  memory.debugMode = globalDebugMode;
  return memory;
}

// Command implementations

const commands = {
  async init(projectName, projectPath = process.cwd()) {
    debug('Init command called', { projectName, projectPath });

    // Handle various argument patterns
    if (projectName && (projectName.startsWith('/') || projectName.startsWith('.') || projectName.includes('/'))) {
      projectPath = projectName;
      projectName = path.basename(projectPath);
      debug('Detected path-like project name, extracted name from path', { projectName, projectPath });
    }

    if (!projectName) {
      projectName = path.basename(projectPath);
      debug('No project name provided, using directory name', { projectName });
    }

    log('🧠 Initializing Claude Memory...');
    log(`📁 Project: ${projectName}`);
    log(`📂 Path: ${projectPath}`);

    // Ensure project directory exists
    if (!fs.existsSync(projectPath)) {
      verbose(`Creating project directory: ${projectPath}`);
      fs.mkdirSync(projectPath, { recursive: true });
    }

    process.chdir(projectPath);
    verbose(`Changed to project directory: ${projectPath}`);

    // Initialize memory system
    verbose('Creating memory system instance...');
    const memory = createMemory(projectPath, projectName);
    const sessionId = memory.startSession('Project Setup', {
      project: projectName,
      initialized: new Date().toISOString(),
      tool: 'claude-memory'
    });

    memory.recordDecision(
      'Install Claude Memory',
      'Enable persistent AI memory across sessions for better project intelligence',
      ['Manual documentation', 'External tools', 'No memory system']
    );

    // Update .gitignore
    commands.updateGitignore(projectPath);

    // Update package.json if it exists
    commands.updatePackageJson(projectPath);

    memory.log('✅ Claude Memory initialized!');
    log(`📋 Session ID: ${sessionId}`);
    log('');
    log('🚀 Next Steps:');
    log('1. Tell Claude: "Load project memory and continue development"');
    log('2. Start any conversation with memory-aware context');
    log('3. Watch Claude learn and remember your project');
    log('');
    log('📖 See CLAUDE.md for project memory overview');
    log('💡 Use "cmem stats" to view memory statistics');
  },

  async stats(projectPath) {
    // Use current directory if no path provided
    const targetPath = projectPath || process.cwd();

    try {
      const memory = createMemory(targetPath);
      const stats = memory.getMemoryStats();
      const recentSessions = memory.getSessionHistory(3);
      const recentDecisions = memory.getRecentDecisions(3);

      // Structure data for different output formats
      const statsData = {
        statistics: {
          sessions: stats.sessions,
          decisions: stats.decisions,
          patterns: stats.patterns,
          tasks: stats.tasks,
          actions: stats.actions,
          knowledgeItems: stats.totalKnowledgeItems,
          knowledgeCategories: stats.knowledgeCategories
        },
        recentSessions: recentSessions.map(s => ({
          name: s.name,
          date: s.startTime.split('T')[0]
        })),
        recentDecisions: recentDecisions.map(d => ({
          decision: d.decision,
          timestamp: d.timestamp
        }))
      };

      // Output based on format
      if (globalOutputFormat === 'json') {
        output(formatOutput(statsData, 'json'));
      } else if (globalOutputFormat === 'yaml') {
        output(formatOutput(statsData, 'yaml'));
      } else {
        // Text format (default)
        console.log('\n📊 Claude Memory Statistics\n');
        console.log(`Sessions: ${stats.sessions}`);
        console.log(`Decisions: ${stats.decisions}`);
        console.log(`Patterns: ${stats.patterns}`);
        console.log(`Tasks: ${stats.tasks}`);
        console.log(`Actions: ${stats.actions}`);
        console.log(`Knowledge Items: ${stats.totalKnowledgeItems} (${stats.knowledgeCategories} categories)`);

        if (recentSessions.length > 0) {
          console.log('\n🕒 Recent Sessions:');
          recentSessions.forEach(s => {
            console.log(`  • ${s.name} (${s.startTime.split('T')[0]})`);
          });
        }

        if (recentDecisions.length > 0) {
          console.log('\n🤔 Recent Decisions:');
          recentDecisions.forEach(d => {
            console.log(`  • ${d.decision}`);
          });
        }
      }
    } catch (error) {
      if (error.message.includes('not initialized')) {
        console.error('❌ Claude Memory not initialized in this directory');
        console.log('💡 Run: claude-memory init');
        console.log('   Or specify a path: claude-memory stats /path/to/project');
      } else {
        console.error('❌ Error reading memory:', error.message);
        console.log('💡 Try: claude-memory init');
        console.log('   Or: claude-memory stats /path/to/project');
      }
    }
  },

  async search(...args) {
    let query = null;
    let projectPath = null;
    let outputFormat = globalOutputFormat; // Use global default
    let typeFilter = null;
    let limit = null;

    // Parse arguments and flags
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === '--json') {
        outputFormat = 'json'; // Override global setting
      } else if (arg === '--type' && args[i + 1]) {
        typeFilter = args[i + 1];
        i++;
      } else if (arg === '--limit' && args[i + 1]) {
        limit = parseInt(args[i + 1]);
        i++;
      } else if (arg === '--help' || arg === '-h') {
        commands.showContextualHelp('search');
        process.exit(0);
      } else if (arg?.startsWith('--')) {
        console.error(`❌ Unknown flag: ${arg}`);
        console.log('Usage: claude-memory search "query" [--json] [--type TYPE] [--limit N] [path]');
        return;
      } else if (!query && !arg?.startsWith('/') && !arg?.startsWith('.')) {
        // First non-flag, non-path argument is query
        query = arg;
      } else if (!projectPath) {
        // Path-like argument
        projectPath = arg;
      }
    }

    if (!query) {
      console.error('❌ Search query required');
      console.log('Usage: claude-memory search "query" [--json] [--type TYPE] [--limit N] [path]');
      console.log('');
      console.log('Examples:');
      console.log('  claude-memory search "API"');
      console.log('  claude-memory search "config" --type knowledge');
      console.log('  claude-memory search "bug" --json --limit 5');
      console.log('  claude-memory search "database" --type decisions --json');
      return;
    }

    // Use current directory if no path provided
    const targetPath = projectPath || process.cwd();

    try {
      const memory = new ClaudeMemory(targetPath);
      let results = memory.searchMemory(query);

      // Apply type filter
      if (typeFilter) {
        const validTypes = ['decisions', 'patterns', 'tasks', 'knowledge'];
        if (!validTypes.includes(typeFilter)) {
          console.error(`❌ Invalid type filter: ${typeFilter}`);
          console.log(`Valid types: ${validTypes.join(', ')}`);
          return;
        }

        // Filter to only the specified type
        const filteredResults = { decisions: [], patterns: [], tasks: [], knowledge: [] };
        filteredResults[typeFilter] = results[typeFilter] || [];
        results = filteredResults;
      }

      // Apply limit to each result type
      if (limit && limit > 0) {
        results.decisions = results.decisions.slice(0, limit);
        results.patterns = results.patterns.slice(0, limit);
        results.tasks = results.tasks.slice(0, limit);
        results.knowledge = results.knowledge.slice(0, limit);
      }

      if (outputFormat === 'json') {
        // JSON output
        const jsonOutput = {
          query,
          typeFilter,
          limit,
          totalResults: results.decisions.length + results.patterns.length +
                        results.tasks.length + results.knowledge.length,
          results
        };
        console.log(JSON.stringify(jsonOutput, null, 2));
        return;
      }

      // Text output
      const typeText = typeFilter ? ` (type: ${typeFilter})` : '';
      const limitText = limit ? ` (limit: ${limit})` : '';
      console.log(`\n🔍 Search results for: "${query}"${typeText}${limitText}\n`);

      if (results.decisions.length > 0) {
        console.log('📋 Decisions:');
        results.decisions.forEach(d => {
          console.log(`  • ${d.decision} (${d.timestamp.split('T')[0]})`);
          console.log(`    ${d.reasoning}`);
          if (d.alternatives?.length > 0) {
            console.log(`    Alternatives: ${d.alternatives.join(', ')}`);
          }
        });
        console.log();
      }

      if (results.patterns.length > 0) {
        console.log('🧩 Patterns:');
        results.patterns.forEach(p => {
          const priorityEmoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[p.priority] || '⚪';
          console.log(`  ${priorityEmoji} ${p.pattern}: ${p.description}`);
          if (p.effectiveness !== null && p.effectiveness !== undefined) {
            console.log(`    Effectiveness: ${p.effectiveness}`);
          }
          if (p.status === 'resolved' && p.solution) {
            console.log(`    ✅ Solution: ${p.solution}`);
          }
        });
        console.log();
      }

      if (results.tasks && results.tasks.length > 0) {
        console.log('✅ Tasks:');
        results.tasks.forEach(t => {
          const statusIcon = t.status === 'completed' ? '✅' : t.status === 'in-progress' ? '🔄' : '📝';
          console.log(`  ${statusIcon} ${t.description} (${t.priority})`);
          if (t.assignee) console.log(`    Assigned: ${t.assignee}`);
          if (t.dueDate) console.log(`    Due: ${t.dueDate}`);
          if (t.completedAt) console.log(`    Completed: ${t.completedAt.split('T')[0]}`);
        });
        console.log();
      }

      if (results.knowledge.length > 0) {
        console.log('💡 Knowledge:');
        results.knowledge.forEach(k => {
          console.log(`  • [${k.category}] ${k.key}: ${k.value}`);
          console.log(`    Updated: ${k.lastUpdated.split('T')[0]}`);
        });
        console.log();
      }

      const totalResults = results.decisions.length + results.patterns.length +
                          results.tasks.length + results.knowledge.length;
      if (totalResults === 0) {
        console.log('No results found.');
      } else {
        console.log(`📊 Found ${totalResults} result${totalResults === 1 ? '' : 's'}`);
      }
    } catch (error) {
      if (outputFormat === 'json') {
        console.error(JSON.stringify({ error: error.message }));
      } else {
        console.error('❌ Error searching memory:', error.message);
      }
    }
  },

  async decision(decision, reasoning, alternatives = '', projectPath = process.cwd()) {
    if (!decision || !reasoning) {
      console.error('❌ Decision and reasoning required');
      console.log('Usage: claude-memory decision "Decision text" "Reasoning" "alt1,alt2"');
      return;
    }

    try {
      // Sanitize inputs
      const sanitizedDecision = sanitizeDescription(decision, 200);
      const sanitizedReasoning = sanitizeDescription(reasoning, 1000);
      const validatedPath = validatePath(projectPath);

      const memory = createMemory(validatedPath);
      const alternativesArray = alternatives
        ? alternatives.split(',').map(s => sanitizeInput(s.trim(), 100)).filter(s => s.length > 0)
        : [];

      const id = memory.recordDecision(sanitizedDecision, sanitizedReasoning, alternativesArray);

      memory.log(`✅ Decision recorded: ${sanitizedDecision}`);
      memory.log(`📋 Decision ID: ${id}`);
    } catch (error) {
      console.error('❌ Error recording decision:', error.message);
    }
  },

  async pattern(action, ...args) {
    const projectPath = process.cwd();

    // Handle help flags
    if (action === '--help' || action === '-h') {
      commands.showContextualHelp('pattern');
      process.exit(0);
    }

    if (action === 'add') {
      const pattern = args[0];
      const description = args[1];
      let effectiveness = null;
      let priority = 'medium';

      // Parse optional flags
      for (let i = 2; i < args.length; i++) {
        if (args[i] === '--effectiveness' && args[i + 1]) {
          const val = parseFloat(args[i + 1]);
          if (!isNaN(val) && val >= 0 && val <= 1) {
            effectiveness = val;
          } else {
            console.error('❌ Effectiveness must be a number between 0 and 1');
            return;
          }
          i++;
        } else if (args[i] === '--priority' && args[i + 1]) {
          if (['critical', 'high', 'medium', 'low'].includes(args[i + 1])) {
            priority = args[i + 1];
          } else {
            console.error('❌ Priority must be: critical, high, medium, or low');
            return;
          }
          i++;
        }
      }

      if (!pattern || !description) {
        console.error('❌ Pattern name and description required');
        console.log('Usage: claude-memory pattern add "Pattern name" "Description"');
        console.log('       [--effectiveness 0.8] [--priority high]');
        return;
      }

      try {
        const memory = new ClaudeMemory(projectPath);
        const patternId = memory.learnPattern(pattern, description, '', 1, effectiveness, priority);

        console.log(`✅ Pattern added: ${pattern}`);
        console.log(`📋 Pattern ID: ${patternId}`);
        console.log(`📝 Description: ${description}`);
        console.log(`🎯 Priority: ${priority}`);
        if (effectiveness !== null) {
          console.log(`📊 Effectiveness: ${effectiveness}`);
        }
      } catch (error) {
        console.error('❌ Error adding pattern:', error.message);
      }
    } else if (action === 'list') {
      let priorityFilter = null;

      // Parse optional flags
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '--priority' && args[i + 1]) {
          if (['critical', 'high', 'medium', 'low'].includes(args[i + 1])) {
            priorityFilter = args[i + 1];
          } else {
            console.error('❌ Priority must be: critical, high, medium, or low');
            return;
          }
          i++;
        }
      }

      try {
        const memory = new ClaudeMemory(projectPath);
        let patterns = memory.patterns.filter(p => p.status === 'open');

        if (priorityFilter) {
          patterns = patterns.filter(p => p.priority === priorityFilter);
        }

        if (patterns.length === 0) {
          const filterMsg = priorityFilter ? ` with priority '${priorityFilter}'` : '';
          console.log(`📋 No open patterns found${filterMsg}.`);
          return;
        }

        // Group by priority
        const byPriority = {
          critical: patterns.filter(p => p.priority === 'critical'),
          high: patterns.filter(p => p.priority === 'high'),
          medium: patterns.filter(p => p.priority === 'medium'),
          low: patterns.filter(p => p.priority === 'low')
        };

        const filterMsg = priorityFilter ? ` (${priorityFilter} priority)` : '';
        console.log(`📋 Patterns${filterMsg} (${patterns.length} total)\n`);

        ['critical', 'high', 'medium', 'low'].forEach(priority => {
          if (byPriority[priority].length > 0) {
            byPriority[priority].forEach(p => {
              const priorityEmoji = {
                critical: '🔴',
                high: '🟠',
                medium: '🟡',
                low: '🟢'
              }[priority];

              console.log(`[${p.id}] ${priorityEmoji} ${priority.toUpperCase()}: ${p.pattern}`);
              console.log(`         ${p.description}`);
              if (p.effectiveness !== null && p.effectiveness !== undefined) {
                console.log(`         Effectiveness: ${p.effectiveness}`);
              }
              console.log();
            });
          }
        });
      } catch (error) {
        console.error('❌ Error listing patterns:', error.message);
      }
    } else if (action === 'search') {
      const query = args[0];

      if (!query) {
        console.error('❌ Search query required');
        console.log('Usage: claude-memory pattern search "query"');
        return;
      }

      try {
        const memory = new ClaudeMemory(projectPath);
        const patterns = memory.patterns.filter(p =>
          p.pattern.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase())
        );

        if (patterns.length === 0) {
          console.log(`🔍 No patterns found for: "${query}"`);
          return;
        }

        console.log(`🔍 Pattern search results for: "${query}" (${patterns.length} found)\n`);

        patterns.forEach(p => {
          const status = p.status === 'resolved' ? '✅' : '🟢';
          const priorityEmoji = {
            critical: '🔴',
            high: '🟠',
            medium: '🟡',
            low: '🟢'
          }[p.priority];

          console.log(`${status} [${p.id}] ${priorityEmoji} ${p.pattern}`);
          console.log(`    ${p.description}`);
          if (p.effectiveness !== null && p.effectiveness !== undefined) {
            console.log(`    Effectiveness: ${p.effectiveness} | Priority: ${p.priority}`);
          }
          if (p.status === 'resolved') {
            console.log(`    Solution: ${p.solution}`);
          }
          console.log();
        });
      } catch (error) {
        console.error('❌ Error searching patterns:', error.message);
      }
    } else if (action === 'resolve') {
      const patternId = args[0];
      const solution = args[1];

      if (!patternId || !solution) {
        console.error('❌ Pattern ID and solution required');
        console.log('Usage: claude-memory pattern resolve <pattern-id> "solution"');
        return;
      }

      try {
        const memory = new ClaudeMemory(projectPath);
        const success = memory.resolvePattern(patternId, solution);
        if (success) {
          console.log(`✅ Pattern resolved: ${patternId}`);
          console.log(`💡 Solution: ${solution}`);
        } else {
          console.error(`❌ Pattern not found: ${patternId}`);
        }
      } catch (error) {
        console.error('❌ Error resolving pattern:', error.message);
      }
    } else {
      // Backward compatibility: Traditional pattern learning
      const pattern = action;
      const description = args[0];
      let effectiveness = null;
      let priority = 'medium';

      // Smart argument parsing for backward compatibility
      if (args[1]) {
        const arg1 = args[1];
        const num = parseFloat(arg1);

        // Check if it's a valid effectiveness score (0-1)
        if (!isNaN(num) && num >= 0 && num <= 1) {
          effectiveness = num;
          // Check for priority as third argument
          if (args[2] && ['critical', 'high', 'medium', 'low'].includes(args[2])) {
            priority = args[2];
          }
        } else if (['critical', 'high', 'medium', 'low'].includes(arg1)) {
          // First optional arg is priority
          priority = arg1;
        }
      }

      if (!pattern || !description) {
        console.error('❌ Pattern name and description required');
        console.log('\nUsage:');
        console.log('  claude-memory pattern add "Pattern name" "Description" [--effectiveness 0.8] [--priority high]');
        console.log('  claude-memory pattern list [--priority high]');
        console.log('  claude-memory pattern search "query"');
        console.log('  claude-memory pattern resolve <pattern-id> "solution"');
        console.log('\nBackward compatibility:');
        console.log('  claude-memory pattern "Pattern name" "Description" [effectiveness] [priority]');
        return;
      }

      try {
        const memory = new ClaudeMemory(projectPath);
        const patternId = memory.learnPattern(pattern, description, '', 1, effectiveness, priority);

        console.log(`✅ Pattern learned: ${pattern}`);
        console.log(`📋 Pattern ID: ${patternId}`);
        console.log(`📝 Description: ${description}`);
        console.log(`🎯 Priority: ${priority}`);
        if (effectiveness !== null) {
          console.log(`📊 Effectiveness: ${effectiveness}`);
        }
      } catch (error) {
        console.error('❌ Error learning pattern:', error.message);
      }
    }
  },

  async task(action, ...args) {
    const projectPath = process.cwd();

    // Handle help flags
    if (action === '--help' || action === '-h') {
      commands.showContextualHelp('task');
      process.exit(0);
    }

    if (action === 'add') {
      const description = args[0];
      let priority = 'medium';
      let assignee = null;
      let dueDate = null;

      // Parse optional flags
      for (let i = 1; i < args.length; i++) {
        if (args[i] === '--priority' && args[i + 1]) {
          priority = args[i + 1];
          i++;
        } else if (args[i] === '--assignee' && args[i + 1]) {
          assignee = args[i + 1];
          i++;
        } else if (args[i] === '--due' && args[i + 1]) {
          dueDate = args[i + 1];
          i++;
        }
      }

      if (!description) {
        console.error('❌ Task description required');
        console.log('Usage: claude-memory task add "description" ' +
          '[--priority high|medium|low] [--assignee name] [--due date]');
        return;
      }

      try {
        // Sanitize and validate inputs
        const sanitizedDescription = sanitizeDescription(description, 300);
        const validPriorities = ['high', 'medium', 'low'];
        const validPriority = validPriorities.includes(priority) ? priority : 'medium';
        const sanitizedAssignee = assignee ? sanitizeInput(assignee, 50) : null;

        const memory = new ClaudeMemory(projectPath);
        const taskId = memory.addTask(sanitizedDescription, validPriority, 'open', sanitizedAssignee, dueDate);

        console.log(`✅ Task added: ${sanitizedDescription}`);
        console.log(`📋 Task ID: ${taskId}`);
        console.log(`🎯 Priority: ${validPriority}`);
      } catch (error) {
        console.error('❌ Error adding task:', error.message);
      }
    } else if (action === 'complete') {
      const taskId = args[0];
      const outcome = args[1] || '';

      if (!taskId) {
        console.error('❌ Task ID required');
        console.log('Usage: claude-memory task complete <task-id> ["outcome"]');
        return;
      }

      try {
        const memory = new ClaudeMemory(projectPath);
        const success = memory.completeTask(taskId, outcome);
        if (success) {
          console.log(`✅ Task completed: ${taskId}`);
          if (outcome) console.log(`📝 Outcome: ${outcome}`);
        } else {
          console.error(`❌ Task not found: ${taskId}`);
        }
      } catch (error) {
        console.error('❌ Error completing task:', error.message);
      }
    } else if (action === 'list') {
      const status = args[0];

      try {
        const memory = new ClaudeMemory(projectPath);
        const tasks = memory.getTasks(status);

        console.log(`\n📋 Tasks${status ? ` (${status})` : ''}:\n`);

        if (tasks.length === 0) {
          console.log('No tasks found.');
        } else {
          tasks.forEach(task => {
            const statusIcon = task.status === 'completed'
              ? '✅'
              : task.status === 'in-progress' ? '🔄' : '📝';
            console.log(`${statusIcon} ${task.id}: ${task.description}`);
            console.log(`   Priority: ${task.priority} | Status: ${task.status}`);
            if (task.assignee) console.log(`   Assigned: ${task.assignee}`);
            if (task.dueDate) console.log(`   Due: ${task.dueDate}`);
            if (task.completedAt) console.log(`   Completed: ${task.completedAt.split('T')[0]}`);
            console.log('');
          });
        }
      } catch (error) {
        console.error('❌ Error listing tasks:', error.message);
      }
    } else if (action === 'add-bulk') {
      const filePath = args[0];

      if (!filePath) {
        console.error('❌ JSON file path required');
        console.log('Usage: claude-memory task add-bulk <tasks.json>');
        console.log('\nExample JSON format:');
        console.log(JSON.stringify({
          tasks: [
            { description: 'Task 1', priority: 'high', assignee: 'Alice' },
            { description: 'Task 2', priority: 'medium' }
          ]
        }, null, 2));
        return;
      }

      try {
        // Read and parse the JSON file
        const resolvedPath = path.resolve(filePath);
        if (!fs.existsSync(resolvedPath)) {
          console.error(`❌ File not found: ${filePath}`);
          return;
        }

        const fileContent = fs.readFileSync(resolvedPath, 'utf8');
        const data = JSON.parse(fileContent);

        // Validate against schema (removed for now, will add validation later)

        if (!data.tasks || !Array.isArray(data.tasks)) {
          console.error('❌ Invalid JSON format. Must have a "tasks" array.');
          return;
        }

        const memory = new ClaudeMemory(projectPath);
        let addedCount = 0;
        const taskIds = [];

        // Add each task
        for (const task of data.tasks) {
          if (!task.description) {
            console.warn('⚠️ Skipping task without description');
            continue;
          }

          const sanitizedDescription = sanitizeDescription(task.description, 300);
          const priority = ['high', 'medium', 'low'].includes(task.priority) ? task.priority : 'medium';
          const status = ['pending', 'in-progress', 'completed'].includes(task.status) ? task.status : 'pending';
          const assignee = task.assignee ? sanitizeInput(task.assignee, 50) : null;
          const dueDate = task.dueDate || null;

          const taskId = memory.addTask(sanitizedDescription, priority, status, assignee, dueDate);
          taskIds.push(taskId);
          addedCount++;

          verbose(`Added task ${taskId}: ${sanitizedDescription}`);
        }

        console.log(`✅ Bulk import complete: ${addedCount} tasks added`);
        console.log(`📋 Task IDs: ${taskIds.join(', ')}`);
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.error(`❌ File not found: ${filePath}`);
        } else if (error instanceof SyntaxError) {
          console.error(`❌ Invalid JSON in file: ${error.message}`);
        } else {
          console.error('❌ Error importing tasks:', error.message);
        }
      }
    } else if (action === 'export') {
      const format = args[0] || 'json';
      const status = args[1]; // optional status filter

      try {
        const memory = new ClaudeMemory(projectPath);
        const tasks = memory.getTasks(status);

        // Transform tasks to export format
        const exportData = {
          exportedAt: new Date().toISOString(),
          totalTasks: tasks.length,
          tasks: tasks.map(task => ({
            id: task.id,
            description: task.description,
            priority: task.priority,
            status: task.status,
            assignee: task.assignee,
            dueDate: task.dueDate,
            createdAt: task.createdAt,
            completedAt: task.completedAt,
            outcome: task.outcome
          }))
        };

        if (format === 'json') {
          output(JSON.stringify(exportData, null, 2));
        } else if (format === 'github-issues') {
          // Format for GitHub issue creation
          console.log('# Tasks for GitHub Issues\n');
          tasks.forEach(task => {
            console.log(`## ${task.description}`);
            console.log(`Priority: ${task.priority}`);
            console.log(`Status: ${task.status}`);
            if (task.assignee) console.log(`Assignee: ${task.assignee}`);
            if (task.dueDate) console.log(`Due: ${task.dueDate}`);
            console.log('\n---\n');
          });
        } else {
          console.error(`❌ Unknown export format: ${format}`);
          console.log('Valid formats: json, github-issues');
        }
      } catch (error) {
        console.error('❌ Error exporting tasks:', error.message);
      }
    } else {
      console.error('❌ Task action must be: add, complete, list, add-bulk, or export');
    }
  },

  async backup(projectPath) {
    // Use current directory if no path provided
    const targetPath = projectPath || process.cwd();

    try {
      const memory = new ClaudeMemory(targetPath);
      memory.backup();
      console.log('✅ Memory backed up');
    } catch (error) {
      console.error('❌ Error backing up memory:', error.message);
    }
  },

  async export(...args) {
    let filename = null;
    let projectPath = null;
    let sanitized = false;
    let format = 'json';
    let types = null;
    let dateFrom = null;
    let dateTo = null;
    let includeMetadata = true;

    // Parse arguments and flags
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === '--sanitized') {
        sanitized = true;
      } else if (arg === '--format' && args[i + 1]) {
        format = args[i + 1].toLowerCase();
        i++;
      } else if (arg === '--types' && args[i + 1]) {
        types = args[i + 1].split(',').map(t => t.trim());
        i++;
      } else if (arg === '--from' && args[i + 1]) {
        dateFrom = new Date(args[i + 1]);
        i++;
      } else if (arg === '--to' && args[i + 1]) {
        dateTo = new Date(args[i + 1]);
        i++;
      } else if (arg === '--no-metadata') {
        includeMetadata = false;
      } else if (arg === '--help' || arg === '-h') {
        commands.showContextualHelp('export');
        process.exit(0);
      } else if (arg?.startsWith('--')) {
        console.error(`❌ Unknown flag: ${arg}`);
        console.log('Usage: claude-memory export [filename] [options] [path]');
        console.log('Options:');
        console.log('  --format <type>      Output format: json, yaml, csv, markdown (default: json)');
        console.log('  --types <list>       Comma-separated list of types to export');
        console.log('                       (tasks, patterns, decisions, knowledge, sessions)');
        console.log('  --from <date>        Export items from this date (ISO format)');
        console.log('  --to <date>          Export items up to this date (ISO format)');
        console.log('  --sanitized          Remove sensitive information');
        console.log('  --no-metadata        Exclude metadata from export');
        return;
      } else if (!filename && !arg?.startsWith('/') && !arg?.startsWith('.')) {
        // First non-flag, non-path argument is filename
        filename = sanitizeInput(arg, 100);
      } else if (!projectPath) {
        // Path-like argument
        projectPath = arg;
      }
    }

    // Validate format
    const validFormats = ['json', 'yaml', 'csv', 'markdown'];
    if (!validFormats.includes(format)) {
      console.error(`❌ Invalid format: ${format}`);
      console.log(`Valid formats: ${validFormats.join(', ')}`);
      return;
    }

    // Validate types if specified
    const validTypes = ['tasks', 'patterns', 'decisions', 'knowledge', 'sessions'];
    if (types) {
      const invalidTypes = types.filter(t => !validTypes.includes(t));
      if (invalidTypes.length > 0) {
        console.error(`❌ Invalid types: ${invalidTypes.join(', ')}`);
        console.log(`Valid types: ${validTypes.join(', ')}`);
        return;
      }
    }

    // Use current directory if no path provided
    const targetPath = validatePath(projectPath || process.cwd());

    try {
      const memory = new ClaudeMemory(targetPath);
      let data = memory.exportMemory();

      // Filter by types if specified
      if (types) {
        const filteredData = {
          exportedAt: data.exportedAt,
          metadata: includeMetadata ? data.metadata : undefined
        };
        types.forEach(type => {
          if (data[type]) {
            filteredData[type] = data[type];
          }
        });
        data = filteredData;
      }

      // Apply date filtering
      if (dateFrom || dateTo) {
        data = this.filterByDateRange(data, dateFrom, dateTo);
      }

      // Sanitize data if requested
      if (sanitized) {
        data = this.sanitizeExportData(data);
      }

      // Transform data based on format
      let output;
      let extension;
      switch (format) {
      case 'json':
        output = JSON.stringify(data, null, 2);
        extension = 'json';
        break;
      case 'yaml':
        output = this.convertToYAML(data);
        extension = 'yaml';
        break;
      case 'csv':
        output = this.convertToCSV(data);
        extension = 'csv';
        break;
      case 'markdown':
        output = this.convertToMarkdown(data);
        extension = 'md';
        break;
      }

      // Generate filename if not provided
      const dateStr = new Date().toISOString().split('T')[0];
      const sanitizedSuffix = sanitized ? '-sanitized' : '';
      const typesSuffix = types ? `-${types.join('-')}` : '';
      const exportFile = filename || `claude-memory-export-${dateStr}${typesSuffix}${sanitizedSuffix}.${extension}`;

      // Write the file
      fs.writeFileSync(exportFile, output);

      // Report success
      console.log(`✅ Memory exported to: ${exportFile}`);

      // Count exported items
      let itemCount = 0;
      const exportedTypes = [];
      Object.keys(data).forEach(key => {
        if (Array.isArray(data[key])) {
          itemCount += data[key].length;
          exportedTypes.push(`${key}: ${data[key].length}`);
        }
      });

      console.log(`📊 Exported ${itemCount} items (${exportedTypes.join(', ')})`);
      console.log(`📄 Format: ${format.toUpperCase()}`);

      if (sanitized) {
        console.log('🧹 Data sanitized (sensitive information removed)');
      }
      if (dateFrom || dateTo) {
        const fromStr = dateFrom ? dateFrom.toISOString().split('T')[0] : 'beginning';
        const toStr = dateTo ? dateTo.toISOString().split('T')[0] : 'now';
        console.log(`📅 Date range: ${fromStr} to ${toStr}`);
      }
    } catch (error) {
      console.error('❌ Error exporting memory:', error.message);
    }
  },

  sanitizeExportData(data) {
    // Create a deep copy and remove sensitive information
    const sanitized = JSON.parse(JSON.stringify(data));

    // Remove or anonymize sensitive fields
    if (sanitized.sessions) {
      sanitized.sessions = sanitized.sessions.map(session => ({
        ...session,
        context: sanitized.context ? {} : session.context // Remove context details
      }));
    }

    if (sanitized.decisions) {
      sanitized.decisions = sanitized.decisions.map(decision => ({
        ...decision,
        reasoning: decision.reasoning?.length > 100
          ? decision.reasoning.substring(0, 100) + '...'
          : decision.reasoning
      }));
    }

    // Remove personal identifiers
    if (sanitized.tasks) {
      sanitized.tasks = sanitized.tasks.map(task => ({
        ...task,
        assignee: task.assignee ? 'REDACTED' : null
      }));
    }

    return sanitized;
  },

  filterByDateRange(data, dateFrom, dateTo) {
    const filtered = { ...data };

    // Helper function to check if date is in range
    const isInRange = (dateStr) => {
      const date = new Date(dateStr);
      if (dateFrom && date < dateFrom) return false;
      if (dateTo && date > dateTo) return false;
      return true;
    };

    // Filter tasks
    if (filtered.tasks) {
      filtered.tasks = filtered.tasks.filter(task =>
        isInRange(task.createdAt || task.timestamp)
      );
    }

    // Filter patterns
    if (filtered.patterns) {
      filtered.patterns = filtered.patterns.filter(pattern =>
        isInRange(pattern.createdAt || pattern.timestamp)
      );
    }

    // Filter decisions
    if (filtered.decisions) {
      filtered.decisions = filtered.decisions.filter(decision =>
        isInRange(decision.timestamp)
      );
    }

    // Filter sessions
    if (filtered.sessions) {
      filtered.sessions = filtered.sessions.filter(session =>
        isInRange(session.startTime)
      );
    }

    // Filter knowledge
    if (filtered.knowledge) {
      // Knowledge is structured differently - it's an object of categories
      const filteredKnowledge = {};
      Object.entries(filtered.knowledge).forEach(([category, items]) => {
        const filteredItems = {};
        Object.entries(items).forEach(([key, data]) => {
          if (isInRange(data.lastUpdated || data.timestamp)) {
            filteredItems[key] = data;
          }
        });
        if (Object.keys(filteredItems).length > 0) {
          filteredKnowledge[category] = filteredItems;
        }
      });
      filtered.knowledge = filteredKnowledge;
    }

    return filtered;
  },

  convertToYAML(data) {
    // Use js-yaml library for proper YAML conversion
    return yaml.dump(data, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
      sortKeys: false
    });
  },

  convertToCSV(data) {
    const csvLines = [];

    // Helper to escape CSV values
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Export each data type as a separate CSV section
    if (data.tasks && data.tasks.length > 0) {
      csvLines.push('=== TASKS ===');
      csvLines.push('ID,Description,Priority,Status,Assignee,Due Date,Created At,Completed At');
      data.tasks.forEach(task => {
        csvLines.push([
          escapeCSV(task.id),
          escapeCSV(task.description),
          escapeCSV(task.priority),
          escapeCSV(task.status),
          escapeCSV(task.assignee),
          escapeCSV(task.dueDate),
          escapeCSV(task.createdAt),
          escapeCSV(task.completedAt)
        ].join(','));
      });
      csvLines.push('');
    }

    if (data.patterns && data.patterns.length > 0) {
      csvLines.push('=== PATTERNS ===');
      csvLines.push('ID,Pattern,Description,Priority,Effectiveness,Status,Solution');
      data.patterns.forEach(pattern => {
        csvLines.push([
          escapeCSV(pattern.id),
          escapeCSV(pattern.pattern),
          escapeCSV(pattern.description),
          escapeCSV(pattern.priority),
          escapeCSV(pattern.effectiveness),
          escapeCSV(pattern.status),
          escapeCSV(pattern.solution)
        ].join(','));
      });
      csvLines.push('');
    }

    if (data.decisions && data.decisions.length > 0) {
      csvLines.push('=== DECISIONS ===');
      csvLines.push('ID,Decision,Reasoning,Alternatives,Timestamp');
      data.decisions.forEach(decision => {
        csvLines.push([
          escapeCSV(decision.id),
          escapeCSV(decision.decision),
          escapeCSV(decision.reasoning),
          escapeCSV(decision.alternativesConsidered),
          escapeCSV(decision.timestamp)
        ].join(','));
      });
      csvLines.push('');
    }

    return csvLines.join('\n');
  },

  convertToMarkdown(data) {
    const mdLines = [];

    // Header
    mdLines.push('# Claude Memory Export');
    mdLines.push(`\n**Exported**: ${data.exportedAt || new Date().toISOString()}`);

    if (data.metadata) {
      mdLines.push(`\n**Project**: ${data.metadata.projectName || 'Unknown'}`);
      mdLines.push(`**Version**: ${data.metadata.version || 'Unknown'}`);
    }

    // Tasks
    if (data.tasks && data.tasks.length > 0) {
      mdLines.push('\n## Tasks\n');

      // Group by status
      const tasksByStatus = {};
      data.tasks.forEach(task => {
        const status = task.status || 'pending';
        if (!tasksByStatus[status]) tasksByStatus[status] = [];
        tasksByStatus[status].push(task);
      });

      Object.entries(tasksByStatus).forEach(([status, tasks]) => {
        mdLines.push(`### ${status.charAt(0).toUpperCase() + status.slice(1)}\n`);
        tasks.forEach(task => {
          const checkbox = task.status === 'completed' ? '[x]' : '[ ]';
          mdLines.push(`- ${checkbox} **${task.description}** (${task.priority})`);
          if (task.assignee) mdLines.push(`  - Assigned to: ${task.assignee}`);
          if (task.dueDate) mdLines.push(`  - Due: ${task.dueDate}`);
          if (task.completedAt) mdLines.push(`  - Completed: ${task.completedAt}`);
        });
        mdLines.push('');
      });
    }

    // Patterns
    if (data.patterns && data.patterns.length > 0) {
      mdLines.push('\n## Patterns\n');

      // Group by priority
      const patternsByPriority = {};
      data.patterns.forEach(pattern => {
        const priority = pattern.priority || 'medium';
        if (!patternsByPriority[priority]) patternsByPriority[priority] = [];
        patternsByPriority[priority].push(pattern);
      });

      ['critical', 'high', 'medium', 'low'].forEach(priority => {
        if (patternsByPriority[priority]) {
          mdLines.push(`### ${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority\n`);
          patternsByPriority[priority].forEach(pattern => {
            mdLines.push(`#### ${pattern.pattern}`);
            mdLines.push(`\n${pattern.description}`);
            if (pattern.effectiveness !== null && pattern.effectiveness !== undefined) {
              mdLines.push(`\n- **Effectiveness**: ${pattern.effectiveness}`);
            }
            if (pattern.status === 'resolved' && pattern.solution) {
              mdLines.push(`- **Solution**: ${pattern.solution}`);
            }
            mdLines.push('');
          });
        }
      });
    }

    // Decisions
    if (data.decisions && data.decisions.length > 0) {
      mdLines.push('\n## Decisions\n');
      data.decisions.forEach(decision => {
        mdLines.push(`### ${decision.decision}`);
        mdLines.push(`\n**Reasoning**: ${decision.reasoning}`);
        if (decision.alternativesConsidered) {
          mdLines.push(`\n**Alternatives Considered**: ${decision.alternativesConsidered}`);
        }
        mdLines.push(`\n*${new Date(decision.timestamp).toLocaleDateString()}*\n`);
      });
    }

    // Knowledge
    if (data.knowledge && Object.keys(data.knowledge).length > 0) {
      mdLines.push('\n## Knowledge Base\n');
      Object.entries(data.knowledge).forEach(([category, items]) => {
        mdLines.push(`### ${category}\n`);
        Object.entries(items).forEach(([key, data]) => {
          mdLines.push(`- **${key}**: ${data.value}`);
          mdLines.push(`  - Updated: ${data.lastUpdated}`);
        });
        mdLines.push('');
      });
    }

    // Sessions
    if (data.sessions && data.sessions.length > 0) {
      mdLines.push('\n## Sessions\n');
      data.sessions.forEach(session => {
        const status = session.status || (session.endTime ? 'completed' : 'active');
        mdLines.push(`### ${session.name}`);
        mdLines.push(`- **Status**: ${status}`);
        mdLines.push(`- **Started**: ${session.startTime}`);
        if (session.endTime) {
          mdLines.push(`- **Ended**: ${session.endTime}`);
        }
        if (session.outcome) {
          mdLines.push(`- **Outcome**: ${session.outcome}`);
        }
        mdLines.push('');
      });
    }

    return mdLines.join('\n');
  },

  session(action, ...args) {
    const projectPath = process.cwd();

    // Handle help flags
    if (action === '--help' || action === '-h') {
      commands.showContextualHelp('session');
      process.exit(0);
    }

    if (action === 'start') {
      const sessionName = args[0];
      const context = args[1] || '{}';

      if (!sessionName) {
        console.error('❌ Session name required');
        console.log('Usage: claude-memory session start "Session Name" [context]');
        return;
      }

      try {
        const memory = new ClaudeMemory(projectPath);
        let contextObj = {};
        try {
          contextObj = JSON.parse(context);
        } catch (e) {
          console.warn('⚠️  Invalid context JSON, using empty context');
        }

        const sessionId = memory.startSession(sessionName, contextObj);
        console.log(`🚀 Started session: ${sessionName}`);
        console.log(`📋 Session ID: ${sessionId}`);
      } catch (error) {
        console.error('❌ Error starting session:', error.message);
      }
    } else if (action === 'end') {
      const sessionIdOrOutcome = args[0];
      const outcome = args[1] || 'Session completed';

      try {
        const memory = new ClaudeMemory(projectPath);

        // Check if first arg is a session ID
        if (sessionIdOrOutcome && sessionIdOrOutcome.match(/^\d{4}-\d{2}-\d{2}-/)) {
          const success = memory.endSessionById(sessionIdOrOutcome, outcome);
          if (success) {
            console.log(`✅ Session ${sessionIdOrOutcome} ended: ${outcome}`);
          } else {
            console.error(`❌ Session not found or already ended: ${sessionIdOrOutcome}`);
          }
        } else {
          // End current session
          const success = memory.endSession(sessionIdOrOutcome || outcome);
          if (success) {
            console.log(`✅ Current session ended: ${sessionIdOrOutcome || outcome}`);
          } else {
            console.log('ℹ️  No active session to end');
          }
        }
      } catch (error) {
        console.error('❌ Error ending session:', error.message);
      }
    } else if (action === 'list') {
      try {
        const memory = new ClaudeMemory(projectPath);
        const sessions = memory.getSessionHistory(10);
        console.log('\n📚 Recent Sessions:');
        sessions.forEach(session => {
          console.log(`  ${session.id} - ${session.name} (${session.status})`);
        });
      } catch (error) {
        console.error('❌ Error listing sessions:', error.message);
      }
    } else if (action === 'cleanup') {
      try {
        const memory = new ClaudeMemory(projectPath);
        const cleanedCount = memory.cleanupSessions();
        console.log(`✅ Cleaned up ${cleanedCount} active sessions`);
      } catch (error) {
        console.error('❌ Error cleaning up sessions:', error.message);
      }
    } else {
      console.error('❌ Session action must be: start, end, list, or cleanup');
    }
  },

  async import(...args) {
    let filename = null;
    let projectPath = null;
    let mode = 'merge'; // merge or replace
    let types = null;
    let dryRun = globalDryRunMode;

    // Parse arguments and flags
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      const nextArg = args[i + 1];

      if (arg === '--mode' && nextArg) {
        if (!['merge', 'replace'].includes(nextArg)) {
          console.error(`❌ Invalid mode: ${nextArg}. Valid options: merge, replace`);
          process.exit(1);
        }
        mode = nextArg;
        i++;
      } else if (arg === '--types' && nextArg) {
        types = nextArg.split(',').map(t => t.trim());
        i++;
      } else if (arg === '--dry-run') {
        dryRun = true;
      } else if (arg === '--help' || arg === '-h') {
        commands.showContextualHelp('import');
        process.exit(0);
      } else if (arg?.startsWith('--')) {
        console.error(`❌ Unknown flag: ${arg}`);
        console.log('Usage: claude-memory import <filename> [options] [path]');
        console.log('Options:');
        console.log('  --mode <mode>        Import mode: merge (default) or replace');
        console.log('  --types <list>       Comma-separated list of types to import');
        console.log('                       (tasks, patterns, decisions, knowledge, sessions)');
        console.log('  --dry-run            Preview import without making changes');
        process.exit(1);
      } else if (!filename) {
        filename = arg;
      } else if (!projectPath) {
        projectPath = arg;
      }
    }

    if (!filename) {
      console.error('❌ Filename required');
      console.log('Usage: claude-memory import <filename> [options] [path]');
      process.exit(1);
    }

    // Validate types if specified
    const validTypes = ['tasks', 'patterns', 'decisions', 'knowledge', 'sessions'];
    if (types) {
      const invalidTypes = types.filter(t => !validTypes.includes(t));
      if (invalidTypes.length > 0) {
        console.error(`❌ Invalid types: ${invalidTypes.join(', ')}`);
        console.log(`Valid types: ${validTypes.join(', ')}`);
        process.exit(1);
      }
    }

    // Use current directory if no path provided
    const targetPath = validatePath(projectPath || process.cwd());

    try {
      // Check if file exists
      if (!fs.existsSync(filename)) {
        console.error(`❌ File not found: ${filename}`);
        process.exit(1);
      }

      // Read and parse the file
      const fileContent = fs.readFileSync(filename, 'utf8');
      let importData;

      // Detect format and parse accordingly
      const extension = path.extname(filename).toLowerCase();
      if (extension === '.json') {
        importData = JSON.parse(fileContent);
      } else if (extension === '.yaml' || extension === '.yml') {
        importData = yaml.load(fileContent);
      } else {
        // Try to auto-detect format
        try {
          importData = JSON.parse(fileContent);
        } catch (e) {
          try {
            importData = yaml.load(fileContent);
          } catch (e2) {
            console.error('❌ Unable to parse file. Please use JSON or YAML format.');
            process.exit(1);
          }
        }
      }

      // Validate import data structure
      const validationErrors = commands.validateImportData(importData);
      if (validationErrors.length > 0) {
        console.error('❌ Import validation failed:');
        validationErrors.forEach(error => console.error(`  - ${error}`));
        process.exit(1);
      }

      // Filter by types if specified
      if (types) {
        const filteredData = {};
        types.forEach(type => {
          if (importData[type]) {
            filteredData[type] = importData[type];
          }
        });
        importData = filteredData;
      }

      // Initialize memory
      const memory = createMemory(targetPath);

      // Preview mode
      if (dryRun) {
        log('🔍 DRY RUN MODE - No changes will be made\n');

        // Show what would be imported
        const importSummary = commands.getImportSummary(importData);
        log('📊 Import Summary:');
        Object.entries(importSummary).forEach(([type, count]) => {
          if (count > 0) {
            log(`  - ${type}: ${count} items`);
          }
        });

        if (mode === 'replace') {
          log('\n⚠️  REPLACE MODE: Existing data will be replaced');
          const currentSummary = commands.getImportSummary(memory.exportMemory());
          log('\n📊 Current Data (will be replaced):');
          Object.entries(currentSummary).forEach(([type, count]) => {
            if (count > 0) {
              log(`  - ${type}: ${count} items`);
            }
          });
        } else {
          log('\n🔄 MERGE MODE: New data will be added to existing data');
        }

        log('\n✅ Dry run complete. Use without --dry-run to perform import.');
        return;
      }

      // Perform the import
      let imported = 0;
      let skipped = 0;
      const errors = [];

      // Import based on mode
      if (mode === 'replace') {
        // Replace mode - clear existing data first
        if (importData.tasks) {
          memory.tasks = [];
        }
        if (importData.patterns) {
          memory.patterns = [];
        }
        if (importData.decisions) {
          memory.decisions = [];
        }
        if (importData.knowledge) {
          memory.knowledge = {};
        }
        if (importData.sessions) {
          memory.sessions = [];
        }
      }

      // Import tasks
      if (importData.tasks) {
        importData.tasks.forEach(task => {
          try {
            // In merge mode, check for duplicates
            if (mode === 'merge' && memory.tasks.some(t => t.id === task.id)) {
              skipped++;
              return;
            }

            // Add task with proper structure
            memory.tasks.push({
              id: task.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              description: task.description,
              priority: task.priority || 'medium',
              status: task.status || 'pending',
              assignee: task.assignee || null,
              dueDate: task.dueDate || null,
              createdAt: task.createdAt || new Date().toISOString(),
              completedAt: task.completedAt || null,
              outcome: task.outcome || null
            });
            imported++;
          } catch (error) {
            errors.push(`Task import error: ${error.message}`);
          }
        });
      }

      // Import patterns
      if (importData.patterns) {
        importData.patterns.forEach(pattern => {
          try {
            if (mode === 'merge' && memory.patterns.some(p => p.id === pattern.id)) {
              skipped++;
              return;
            }

            memory.patterns.push({
              id: pattern.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              pattern: pattern.pattern || pattern.name,
              description: pattern.description,
              priority: pattern.priority || 'medium',
              effectiveness: pattern.effectiveness || 0.5,
              status: pattern.status || 'active',
              solution: pattern.solution || null,
              createdAt: pattern.createdAt || new Date().toISOString(),
              timestamp: pattern.timestamp || new Date().toISOString()
            });
            imported++;
          } catch (error) {
            errors.push(`Pattern import error: ${error.message}`);
          }
        });
      }

      // Import decisions
      if (importData.decisions) {
        importData.decisions.forEach(decision => {
          try {
            if (mode === 'merge' && memory.decisions.some(d => d.id === decision.id)) {
              skipped++;
              return;
            }

            memory.recordDecision(
              decision.decision,
              decision.reasoning,
              decision.alternativesConsidered || ''
            );
            imported++;
          } catch (error) {
            errors.push(`Decision import error: ${error.message}`);
          }
        });
      }

      // Import knowledge
      if (importData.knowledge) {
        Object.entries(importData.knowledge).forEach(([category, items]) => {
          Object.entries(items).forEach(([key, data]) => {
            try {
              memory.storeKnowledge(key, data.value || data, category);
              imported++;
            } catch (error) {
              errors.push(`Knowledge import error: ${error.message}`);
            }
          });
        });
      }

      // Import sessions
      if (importData.sessions) {
        importData.sessions.forEach(session => {
          try {
            if (mode === 'merge' && memory.sessions.some(s => s.id === session.id)) {
              skipped++;
              return;
            }

            memory.sessions.push({
              id: session.id,
              name: session.name,
              startTime: session.startTime,
              endTime: session.endTime || null,
              status: session.status || (session.endTime ? 'completed' : 'active'),
              outcome: session.outcome || null,
              context: session.context || {}
            });
            imported++;
          } catch (error) {
            errors.push(`Session import error: ${error.message}`);
          }
        });
      }

      // Save the imported data
      memory.saveMemory();

      // Report results
      log('✅ Import completed successfully!');
      log('📊 Results:');
      log(`  - Imported: ${imported} items`);
      if (skipped > 0) {
        log(`  - Skipped: ${skipped} items (duplicates)`);
      }
      if (errors.length > 0) {
        log(`  - Errors: ${errors.length}`);
        errors.forEach(error => log(`    - ${error}`));
      }
      log(`  - Mode: ${mode}`);
      log(`  - File: ${filename}`);
    } catch (error) {
      console.error('❌ Import failed:', error.message);
      if (globalDebugMode) {
        console.error('\n[DEBUG] Full error details:');
        console.error(error.stack);
      }
      process.exit(1);
    }
  },

  validateImportData(data) {
    const errors = [];

    // Check basic structure
    if (!data || typeof data !== 'object') {
      errors.push('Import data must be a valid object');
      return errors;
    }

    // Validate tasks
    if (data.tasks && !Array.isArray(data.tasks)) {
      errors.push('Tasks must be an array');
    } else if (data.tasks) {
      data.tasks.forEach((task, index) => {
        if (!task.description) {
          errors.push(`Task at index ${index} missing required field: description`);
        }
        if (task.priority && !['low', 'medium', 'high'].includes(task.priority)) {
          errors.push(`Task at index ${index} has invalid priority: ${task.priority}`);
        }
        if (task.status && !['pending', 'in_progress', 'completed'].includes(task.status)) {
          errors.push(`Task at index ${index} has invalid status: ${task.status}`);
        }
      });
    }

    // Validate patterns
    if (data.patterns && !Array.isArray(data.patterns)) {
      errors.push('Patterns must be an array');
    } else if (data.patterns) {
      data.patterns.forEach((pattern, index) => {
        if (!pattern.pattern && !pattern.name) {
          errors.push(`Pattern at index ${index} missing required field: pattern or name`);
        }
        if (!pattern.description) {
          errors.push(`Pattern at index ${index} missing required field: description`);
        }
        if (pattern.priority && !['low', 'medium', 'high', 'critical'].includes(pattern.priority)) {
          errors.push(`Pattern at index ${index} has invalid priority: ${pattern.priority}`);
        }
      });
    }

    // Validate decisions
    if (data.decisions && !Array.isArray(data.decisions)) {
      errors.push('Decisions must be an array');
    } else if (data.decisions) {
      data.decisions.forEach((decision, index) => {
        if (!decision.decision) {
          errors.push(`Decision at index ${index} missing required field: decision`);
        }
        if (!decision.reasoning) {
          errors.push(`Decision at index ${index} missing required field: reasoning`);
        }
      });
    }

    // Validate knowledge
    if (data.knowledge && typeof data.knowledge !== 'object') {
      errors.push('Knowledge must be an object with categories');
    }

    // Validate sessions
    if (data.sessions && !Array.isArray(data.sessions)) {
      errors.push('Sessions must be an array');
    } else if (data.sessions) {
      data.sessions.forEach((session, index) => {
        if (!session.name) {
          errors.push(`Session at index ${index} missing required field: name`);
        }
        if (!session.startTime) {
          errors.push(`Session at index ${index} missing required field: startTime`);
        }
      });
    }

    return errors;
  },

  getImportSummary(data) {
    return {
      tasks: data.tasks?.length || 0,
      patterns: data.patterns?.length || 0,
      decisions: data.decisions?.length || 0,
      knowledge: data.knowledge
        ? Object.values(data.knowledge).reduce((sum, cat) => sum + Object.keys(cat).length, 0)
        : 0,
      sessions: data.sessions?.length || 0
    };
  },

  async report(type = 'summary', ...args) {
    debug('Report command called', { type, args });

    // Check for help flag first
    if (type === '--help' || type === '-h' || args.includes('--help') || args.includes('-h')) {
      commands.showContextualHelp('report');
      return;
    }

    // Handle case where --type flag is used as positional argument
    if (type === '--type') {
      // When called as 'report --type progress', we get:
      // type = '--type' and args = ['progress']
      // So we need to extract the actual type from args[0]
      if (args.length > 0 && !args[0].startsWith('--')) {
        type = args[0];
        args = args.slice(1); // Remove the type from args
      } else {
        type = 'summary'; // Default if no type specified after --type
      }
    }

    let projectPath = null;
    let outputFile = null;
    let format = 'markdown';
    let dateFrom = null;
    let dateTo = null;
    let autoSave = false;
    let saveDir = null;

    // Parse arguments
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      const nextArg = args[i + 1];

      if (arg === '--type' && nextArg) {
        type = nextArg;
        i++;
      } else if (arg === '--format' && nextArg) {
        format = nextArg;
        i++;
      } else if (arg === '--from' && nextArg) {
        dateFrom = new Date(nextArg);
        if (isNaN(dateFrom)) {
          console.error('❌ Invalid from date format. Use YYYY-MM-DD');
          process.exit(1);
        }
        i++;
      } else if (arg === '--to' && nextArg) {
        dateTo = new Date(nextArg);
        if (isNaN(dateTo)) {
          console.error('❌ Invalid to date format. Use YYYY-MM-DD');
          process.exit(1);
        }
        i++;
      } else if (arg === '--save') {
        autoSave = true;
      } else if (arg === '--save-dir' && nextArg) {
        saveDir = nextArg;
        autoSave = true;
        i++;
      } else if (!arg.startsWith('--')) {
        if (!outputFile && arg !== type) {
          outputFile = arg;
        } else if (!projectPath) {
          projectPath = arg;
        }
      }
    }

    const targetPath = projectPath || process.cwd();
    debug('Report generation', { targetPath, type, format, outputFile, dateFrom, dateTo });

    try {
      const memory = createMemory(targetPath, null, { silent: globalQuietMode });

      // Get all data for report
      const allData = memory.exportMemory();

      // Apply date filtering if specified
      let filteredData = allData;
      if (dateFrom || dateTo) {
        filteredData = commands.filterByDateRange(allData, dateFrom, dateTo);
      }

      let reportContent = '';

      // Generate report based on type
      switch (type) {
      case 'summary':
        reportContent = commands.generateSummaryReport(filteredData, format);
        break;
      case 'tasks':
        reportContent = commands.generateTaskReport(filteredData, format);
        break;
      case 'patterns':
        reportContent = commands.generatePatternReport(filteredData, format);
        break;
      case 'decisions':
        reportContent = commands.generateDecisionReport(filteredData, format);
        break;
      case 'progress':
        reportContent = commands.generateProgressReport(filteredData, format);
        break;
      case 'sprint':
        reportContent = commands.generateSprintReport(filteredData, format);
        break;
      default:
        console.error(`❌ Unknown report type: ${type}`);
        console.log('Available types: summary, tasks, patterns, decisions, progress, sprint');
        process.exit(1);
      }

      // Output report
      if (outputFile) {
        if (!globalDryRunMode) {
          fs.writeFileSync(outputFile, reportContent);
        }
        log(`✅ Report saved to: ${outputFile}`);
      } else if (autoSave) {
        // Auto-save with timestamp
        const timestamp = new Date().toISOString()
          .replace(/[:.]/g, '-')
          .replace('T', '-')
          .split('-')
          .slice(0, -1)
          .join('');
        const extension = format === 'json' ? 'json' : 'md';
        const fileName = `${type}-${timestamp}.${extension}`;

        // Determine save directory
        const reportDir = saveDir || path.join(targetPath, '.claude', 'reports');

        if (!globalDryRunMode) {
          // Create directory if it doesn't exist
          if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
          }

          const filePath = path.join(reportDir, fileName);
          fs.writeFileSync(filePath, reportContent);
          log(`✅ Report saved to: ${filePath}`);
        } else {
          log(`Would save report to: ${path.join(reportDir, fileName)}`);
        }
      } else {
        output(reportContent);
      }

      if (globalDryRunMode && (outputFile || autoSave)) {
        log('\n🏃 DRY RUN - No files were written');
      }
    } catch (error) {
      console.error('❌ Failed to generate report:', error.message);
      debug('Report error details', error);
      process.exit(1);
    }
  },

  generateSummaryReport(data, format) {
    if (format === 'json') {
      return JSON.stringify({
        summary: {
          project: data.metadata?.projectName || 'Unknown',
          generated: new Date().toISOString(),
          statistics: {
            tasks: {
              total: data.tasks?.length || 0,
              completed: data.tasks?.filter(t => t.status === 'completed').length || 0,
              inProgress: data.tasks?.filter(t => t.status === 'in_progress').length || 0,
              pending: data.tasks?.filter(t => t.status === 'pending').length || 0
            },
            patterns: {
              total: data.patterns?.length || 0,
              resolved: data.patterns?.filter(p => p.status === 'resolved').length || 0,
              active: data.patterns?.filter(p => p.status === 'active').length || 0
            },
            decisions: data.decisions?.length || 0,
            knowledge: Object.values(data.knowledge || {}).reduce((sum, cat) => sum + Object.keys(cat).length, 0),
            sessions: data.sessions?.length || 0
          }
        }
      }, null, 2);
    }

    // Default to markdown
    const lines = [];
    lines.push('# Project Summary Report');
    lines.push(`\n**Project**: ${data.metadata?.projectName || 'Unknown'}`);
    lines.push(`**Generated**: ${new Date().toLocaleString()}\n`);

    // Statistics
    lines.push('## 📊 Project Statistics\n');

    // Tasks
    const tasks = data.tasks || [];
    const taskStats = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      pending: tasks.filter(t => t.status === 'pending').length
    };

    lines.push('### Tasks');
    lines.push(`- Total: ${taskStats.total}`);
    const completionPercent = taskStats.total
      ? Math.round(taskStats.completed / taskStats.total * 100)
      : 0;
    lines.push(`- Completed: ${taskStats.completed} (${completionPercent}%)`);
    lines.push(`- In Progress: ${taskStats.inProgress}`);
    lines.push(`- Pending: ${taskStats.pending}\n`);

    // Patterns
    const patterns = data.patterns || [];
    lines.push('### Patterns');
    lines.push(`- Total: ${patterns.length}`);
    lines.push(`- Resolved: ${patterns.filter(p => p.status === 'resolved').length}`);
    lines.push(`- Active: ${patterns.filter(p => p.status === 'active').length}\n`);

    // Other stats
    lines.push('### Other Metrics');
    lines.push(`- Decisions: ${data.decisions?.length || 0}`);
    const knowledgeCount = Object.values(data.knowledge || {})
      .reduce((sum, cat) => sum + Object.keys(cat).length, 0);
    lines.push(`- Knowledge Items: ${knowledgeCount}`);
    lines.push(`- Sessions: ${data.sessions?.length || 0}\n`);

    // Recent Activity
    lines.push('## 🔄 Recent Activity\n');

    // Recent tasks
    const recentTasks = tasks
      .filter(t => t.status === 'completed')
      .sort((a, b) => new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt))
      .slice(0, 5);

    if (recentTasks.length > 0) {
      lines.push('### Recently Completed Tasks');
      recentTasks.forEach(task => {
        lines.push(`- ✅ ${task.description}`);
      });
      lines.push('');
    }

    // Recent decisions
    const recentDecisions = (data.decisions || [])
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 3);

    if (recentDecisions.length > 0) {
      lines.push('### Recent Decisions');
      recentDecisions.forEach(decision => {
        lines.push(`- **${decision.decision}** - ${decision.reasoning}`);
      });
    }

    return lines.join('\n');
  },

  generateTaskReport(data, format) {
    const tasks = data.tasks || [];

    if (format === 'json') {
      return JSON.stringify({ tasks }, null, 2);
    }

    const lines = [];
    lines.push('# Task Report');
    lines.push(`\n**Generated**: ${new Date().toLocaleString()}`);
    lines.push(`**Total Tasks**: ${tasks.length}\n`);

    // Group by status
    const tasksByStatus = {};
    tasks.forEach(task => {
      const status = task.status || 'pending';
      if (!tasksByStatus[status]) tasksByStatus[status] = [];
      tasksByStatus[status].push(task);
    });

    ['in_progress', 'pending', 'completed'].forEach(status => {
      if (tasksByStatus[status] && tasksByStatus[status].length > 0) {
        lines.push(`## ${status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}\n`);

        tasksByStatus[status].forEach(task => {
          const checkbox = status === 'completed' ? '[x]' : '[ ]';
          lines.push(`- ${checkbox} **${task.description}**`);
          lines.push(`  - ID: ${task.id.slice(0, 8)}`);
          lines.push(`  - Priority: ${task.priority}`);
          if (task.assignee) lines.push(`  - Assignee: ${task.assignee}`);
          if (task.dueDate) lines.push(`  - Due: ${task.dueDate}`);
          if (task.tags && task.tags.length > 0) lines.push(`  - Tags: ${task.tags.join(', ')}`);
          if (status === 'completed' && task.completedAt) {
            lines.push(`  - Completed: ${new Date(task.completedAt).toLocaleDateString()}`);
          }
          lines.push('');
        });
      }
    });

    return lines.join('\n');
  },

  generatePatternReport(data, format) {
    const patterns = data.patterns || [];

    if (format === 'json') {
      return JSON.stringify({ patterns }, null, 2);
    }

    const lines = [];
    lines.push('# Pattern Report');
    lines.push(`\n**Generated**: ${new Date().toLocaleString()}`);
    lines.push(`**Total Patterns**: ${patterns.length}\n`);

    // Group by priority
    const patternsByPriority = {};
    patterns.forEach(pattern => {
      const priority = pattern.priority || 'medium';
      if (!patternsByPriority[priority]) patternsByPriority[priority] = [];
      patternsByPriority[priority].push(pattern);
    });

    ['critical', 'high', 'medium', 'low'].forEach(priority => {
      if (patternsByPriority[priority] && patternsByPriority[priority].length > 0) {
        lines.push(`## ${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority\n`);

        patternsByPriority[priority].forEach(pattern => {
          lines.push(`### ${pattern.pattern}`);
          lines.push(`\n${pattern.description}`);
          lines.push(`\n- **Status**: ${pattern.status}`);
          if (pattern.effectiveness !== null && pattern.effectiveness !== undefined) {
            lines.push(`- **Effectiveness**: ${pattern.effectiveness}`);
          }
          if (pattern.status === 'resolved' && pattern.solution) {
            lines.push(`- **Solution**: ${pattern.solution}`);
          }
          lines.push('');
        });
      }
    });

    return lines.join('\n');
  },

  generateDecisionReport(data, format) {
    const decisions = data.decisions || [];

    if (format === 'json') {
      return JSON.stringify({ decisions }, null, 2);
    }

    const lines = [];
    lines.push('# Decision Log');
    lines.push(`\n**Generated**: ${new Date().toLocaleString()}`);
    lines.push(`**Total Decisions**: ${decisions.length}\n`);

    decisions.forEach((decision, index) => {
      lines.push(`## ${index + 1}. ${decision.decision}`);
      lines.push(`\n**Date**: ${new Date(decision.timestamp).toLocaleDateString()}`);
      lines.push(`\n**Reasoning**: ${decision.reasoning}`);
      if (decision.alternativesConsidered) {
        lines.push(`\n**Alternatives Considered**: ${decision.alternativesConsidered}`);
      }
      lines.push('\n---\n');
    });

    return lines.join('\n');
  },

  generateProgressReport(data, format) {
    const tasks = data.tasks || [];
    const sessions = data.sessions || [];
    const decisions = data.decisions || [];

    if (format === 'json') {
      const timeline = [];

      // Add tasks to timeline
      tasks.forEach(task => {
        timeline.push({
          type: 'task',
          date: task.createdAt,
          description: task.description,
          status: task.status
        });
        if (task.completedAt) {
          timeline.push({
            type: 'task_completed',
            date: task.completedAt,
            description: `Completed: ${task.description}`
          });
        }
      });

      // Add decisions
      decisions.forEach(decision => {
        timeline.push({
          type: 'decision',
          date: decision.timestamp,
          description: decision.decision
        });
      });

      // Sort by date
      timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

      return JSON.stringify({ timeline }, null, 2);
    }

    const lines = [];
    lines.push('# Progress Report');
    lines.push(`\n**Generated**: ${new Date().toLocaleString()}\n`);

    // Calculate progress metrics
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const completionRate = tasks.length ? Math.round(completedTasks.length / tasks.length * 100) : 0;

    lines.push('## 📈 Progress Overview\n');
    lines.push(`- **Task Completion Rate**: ${completionRate}%`);
    lines.push(`- **Tasks Completed**: ${completedTasks.length}`);
    lines.push(`- **Tasks Remaining**: ${tasks.filter(t => t.status !== 'completed').length}`);
    lines.push(`- **Total Sessions**: ${sessions.length}\n`);

    // Timeline of activities
    lines.push('## 📅 Activity Timeline\n');

    const timeline = [];

    // Add tasks
    tasks.forEach(task => {
      timeline.push({
        date: new Date(task.createdAt),
        type: 'task_created',
        description: `📝 Created task: ${task.description}`
      });
      if (task.completedAt) {
        timeline.push({
          date: new Date(task.completedAt),
          type: 'task_completed',
          description: `✅ Completed: ${task.description}`
        });
      }
    });

    // Add decisions
    decisions.forEach(decision => {
      timeline.push({
        date: new Date(decision.timestamp),
        type: 'decision',
        description: `🎯 Decision: ${decision.decision}`
      });
    });

    // Sort and display
    timeline.sort((a, b) => b.date - a.date);
    timeline.slice(0, 20).forEach(event => {
      lines.push(`- **${event.date.toLocaleDateString()}** - ${event.description}`);
    });

    if (timeline.length > 20) {
      lines.push(`\n*... and ${timeline.length - 20} more events*`);
    }

    return lines.join('\n');
  },

  generateSprintReport(data, format) {
    const tasks = data.tasks || [];
    const decisions = data.decisions || [];

    // Calculate sprint period (last 2 weeks)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // Filter sprint data
    const sprintTasks = tasks.filter(t =>
      new Date(t.createdAt) >= twoWeeksAgo ||
      (t.completedAt && new Date(t.completedAt) >= twoWeeksAgo)
    );

    const sprintDecisions = decisions.filter(d =>
      new Date(d.timestamp) >= twoWeeksAgo
    );

    if (format === 'json') {
      return JSON.stringify({
        sprint: {
          period: {
            start: twoWeeksAgo.toISOString(),
            end: new Date().toISOString()
          },
          tasks: sprintTasks,
          decisions: sprintDecisions
        }
      }, null, 2);
    }

    const lines = [];
    lines.push('# Sprint Report');
    lines.push(`\n**Period**: ${twoWeeksAgo.toLocaleDateString()} - ${new Date().toLocaleDateString()}`);
    lines.push(`**Generated**: ${new Date().toLocaleString()}\n`);

    // Sprint Summary
    const completedInSprint = sprintTasks.filter(t =>
      t.status === 'completed' &&
      t.completedAt &&
      new Date(t.completedAt) >= twoWeeksAgo
    );

    lines.push('## 🏃 Sprint Summary\n');
    lines.push(`- **Tasks Completed**: ${completedInSprint.length}`);
    lines.push(`- **Tasks In Progress**: ${sprintTasks.filter(t => t.status === 'in_progress').length}`);
    lines.push(`- **Tasks Added**: ${sprintTasks.filter(t => new Date(t.createdAt) >= twoWeeksAgo).length}`);
    lines.push(`- **Decisions Made**: ${sprintDecisions.length}\n`);

    // Completed Tasks
    if (completedInSprint.length > 0) {
      lines.push('## ✅ Completed Tasks\n');
      completedInSprint.forEach(task => {
        lines.push(`- **${task.description}**`);
        lines.push(`  - Priority: ${task.priority}`);
        lines.push(`  - Completed: ${new Date(task.completedAt).toLocaleDateString()}`);
        if (task.outcome) lines.push(`  - Outcome: ${task.outcome}`);
        lines.push('');
      });
    }

    // In Progress
    const inProgress = sprintTasks.filter(t => t.status === 'in_progress');
    if (inProgress.length > 0) {
      lines.push('## 🔄 In Progress\n');
      inProgress.forEach(task => {
        lines.push(`- **${task.description}** (${task.priority})`);
        if (task.assignee) lines.push(`  - Assignee: ${task.assignee}`);
      });
      lines.push('');
    }

    // Key Decisions
    if (sprintDecisions.length > 0) {
      lines.push('## 🎯 Key Decisions\n');
      sprintDecisions.forEach(decision => {
        lines.push(`- **${decision.decision}**`);
        lines.push(`  - ${decision.reasoning}`);
        lines.push('');
      });
    }

    return lines.join('\n');
  },

  async context(projectPath) {
    // Integration command for claude-code
    const targetPath = projectPath || process.cwd();

    try {
      const memory = new ClaudeMemory(targetPath, null, { silent: true });

      // Return structured data for integration
      const context = {
        session: memory.currentSession,
        recentDecisions: memory.getRecentDecisions(3),
        activeTasks: memory.getTasks('open').slice(0, 5),
        openPatterns: memory.patterns.filter(p => p.status === 'open' && p.priority !== 'low').slice(0, 3),
        projectName: memory.metadata.projectName,
        stats: memory.getMemoryStats()
      };

      // Output as JSON for integration
      console.log(JSON.stringify(context, null, 2));
    } catch (error) {
      console.error(JSON.stringify({ error: error.message }));
      process.exit(1);
    }
  },

  async handoff(...args) {
    // AI Handoff command - Generate comprehensive context summary for assistant transitions
    let format = 'markdown';
    let include = 'all';
    let projectPath = null;
    let outputToStdout = false;
    let outputFormat = format; // Track the actual format to use

    // Parse arguments
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg === '--stdout') {
        outputToStdout = true;
      } else if (arg.startsWith('--format=')) {
        outputFormat = arg.split('=')[1];
      } else if (arg === '--format' && i + 1 < args.length) {
        outputFormat = args[++i];
      } else if (arg.startsWith('--include=')) {
        include = arg.split('=')[1];
      } else if (arg === '--include' && i + 1 < args.length) {
        include = args[++i];
      } else if (!arg.startsWith('-')) {
        // First non-flag argument is the project path
        if (!projectPath) {
          projectPath = arg;
        }
      }
    }

    const targetPath = projectPath || process.cwd();

    try {
      const memory = new ClaudeMemory(targetPath, null, { silent: true });

      // Gather comprehensive context
      const handoffData = {
        timestamp: new Date().toISOString(),
        project: {
          name: memory.metadata.projectName || 'Unknown Project',
          path: targetPath,
          lastActivity: memory.metadata.lastUpdated
        },
        session: memory.currentSession
          ? {
            name: memory.currentSession.name,
            id: memory.currentSession.id,
            duration: memory.currentSession.startTime
              ? `${((Date.now() - new Date(memory.currentSession.startTime).getTime()) / (1000 * 60 * 60)).toFixed(1)}h`
              : 'Unknown',
            status: memory.currentSession.status || 'active'
          }
          : null,
        tasks: {
          total: memory.tasks.length,
          open: memory.getTasks('open').slice(0, 10),
          inProgress: memory.getTasks('in-progress'),
          recentlyCompleted: memory.getTasks('completed').slice(-5)
        },
        decisions: {
          total: memory.decisions.length,
          recent: memory.getRecentDecisions(5)
        },
        patterns: {
          total: memory.patterns.length,
          critical: memory.patterns.filter(p => p.priority === 'critical'),
          high: memory.patterns.filter(p => p.priority === 'high'),
          unresolved: memory.patterns.filter(p => p.status === 'open')
        },
        stats: memory.getMemoryStats(),
        keyContext: memory.generateOptimizedContext ? memory.generateOptimizedContext() : null
      };

      if (outputFormat === 'json') {
        console.log(JSON.stringify(handoffData, null, 2));
        return;
      }

      // Generate markdown handoff summary
      const markdown = this.generateHandoffMarkdown(handoffData, include);

      // Output handling - write to file by default, stdout if requested
      if (outputToStdout) {
        console.log(markdown);
      } else {
        // Write to HANDOFF.md instead of outputting to console to prevent accidental CLAUDE.md overwrites
        const handoffPath = path.join(targetPath, 'HANDOFF.md');
        try {
          fs.writeFileSync(handoffPath, markdown, 'utf8');
          console.log(`✅ Handoff summary written to: ${handoffPath}`);
          console.log('📋 Use this file for AI assistant transitions');
          console.log('💡 Tip: To output to console instead, use: claude-memory handoff --stdout');
        } catch (writeError) {
          console.error('❌ Error writing handoff file:', writeError.message);
          console.log('\n--- Handoff Summary ---');
          console.log(markdown);
        }
      }
    } catch (error) {
      if (outputFormat === 'json') {
        console.error(JSON.stringify({ error: error.message }));
      } else {
        console.error('❌ Error generating handoff summary:', error.message);
      }
      process.exit(1);
    }
  },

  generateHandoffMarkdown(data, include) {
    const sections = [];

    // Header
    sections.push('# 🤖 AI Handoff Summary');
    sections.push(`**Project**: ${data.project.name}`);
    sections.push(`**Generated**: ${new Date(data.timestamp).toLocaleString()}`);
    sections.push('');

    // Current Session
    if (data.session) {
      sections.push('## 📍 Current Session');
      sections.push(`- **Name**: ${data.session.name}`);
      sections.push(`- **Duration**: ${data.session.duration} active`);
      sections.push(`- **Status**: ${data.session.status}`);
      sections.push('');
    }

    // Active Tasks (always included)
    if (include === 'all' || include === 'tasks') {
      sections.push(`## ✅ Active Tasks (${data.tasks.open.length} open, ${data.tasks.inProgress.length} in-progress)`);

      if (data.tasks.inProgress.length > 0) {
        sections.push('### In Progress:');
        data.tasks.inProgress.forEach(task => {
          sections.push(`- **[${task.id.slice(0, 8)}]** ${task.description} (${task.priority})`);
          if (task.assignee) sections.push(`  - Assignee: ${task.assignee}`);
        });
        sections.push('');
      }

      if (data.tasks.open.length > 0) {
        sections.push('### Open Tasks:');
        data.tasks.open.slice(0, 8).forEach(task => {
          sections.push(`- **[${task.id.slice(0, 8)}]** ${task.description} (${task.priority})`);
        });
        if (data.tasks.open.length > 8) {
          sections.push(`- ... and ${data.tasks.open.length - 8} more`);
        }
        sections.push('');
      }

      if (data.tasks.recentlyCompleted.length > 0) {
        sections.push('### Recently Completed:');
        data.tasks.recentlyCompleted.forEach(task => {
          sections.push(`- ✅ ${task.description}`);
        });
        sections.push('');
      }
    }

    // Recent Decisions (always included)
    if (include === 'all' || include === 'decisions') {
      sections.push('## 🎯 Recent Decisions');
      if (data.decisions.recent.length > 0) {
        data.decisions.recent.forEach(decision => {
          sections.push(`### ${decision.decision}`);
          sections.push(`**Reasoning**: ${decision.reasoning}`);
          if (decision.alternativesConsidered) {
            sections.push(`**Alternatives**: ${decision.alternativesConsidered}`);
          }
          sections.push(`*${new Date(decision.timestamp).toLocaleDateString()}*`);
          sections.push('');
        });
      } else {
        sections.push('No recent decisions recorded.');
        sections.push('');
      }
    }

    // Critical Patterns
    if (include === 'all') {
      const criticalPatterns = [...data.patterns.critical, ...data.patterns.high.slice(0, 3)];
      if (criticalPatterns.length > 0) {
        sections.push('## ⚡ Key Patterns & Learnings');
        criticalPatterns.forEach(pattern => {
          sections.push(`### ${pattern.name} (${pattern.priority})`);
          sections.push(`${pattern.description}`);
          if (pattern.status === 'resolved' && pattern.solution) {
            sections.push(`**Solution**: ${pattern.solution}`);
          }
          sections.push('');
        });
      }
    }

    // Project Statistics
    sections.push('## 📊 Project Intelligence');
    sections.push(`- **Total Decisions**: ${data.decisions.total}`);
    sections.push(`- **Total Tasks**: ${data.tasks.total}`);
    sections.push(`- **Total Patterns**: ${data.patterns.total}`);
    sections.push(`- **Memory Health**: ${data.stats.tokensUsed || 'Unknown'} tokens used`);
    sections.push('');

    // Handoff Notes
    sections.push('## 🔄 Handoff Context');
    sections.push('This summary provides essential context for AI assistant transitions.');
    sections.push('- Focus on in-progress tasks and recent decisions');
    sections.push('- Apply critical/high priority patterns to new work');
    sections.push('- Continue the current session or start appropriately');
    if (data.session) {
      sections.push(`- Current session "${data.session.name}" has been active for ${data.session.duration}`);
    }
    sections.push('');
    sections.push('*Use `claude-memory context` for JSON integration data*');

    return sections.join('\n');
  },

  async summary(action, ...args) {
    const projectPath = process.cwd();
    const memory = new ClaudeMemory(projectPath);
    const summariesDir = path.join(projectPath, '.claude', 'summaries');

    // Handle help flags
    if (action === '--help' || action === '-h') {
      commands.showContextualHelp('summary');
      process.exit(0);
    }

    if (!action) {
      console.error('❌ Summary action required');
      console.log('Usage: claude-memory summary <generate|list|view> [options]');
      return;
    }

    switch (action) {
    case 'generate': {
      // Parse options
      let sessionId = null;
      let summaryType = 'manual';
      let title = null;

      for (let i = 0; i < args.length; i++) {
        if (args[i] === '--session' && args[i + 1]) {
          sessionId = args[i + 1];
          i++;
        } else if (args[i] === '--type' && args[i + 1]) {
          summaryType = args[i + 1];
          i++;
        } else if (!title) {
          title = args[i];
        }
      }

      if (!title) {
        console.error('❌ Summary title required');
        console.log('Usage: claude-memory summary generate "Title" [--session <id>] [--type <type>]');
        return;
      }

      try {
        // Generate summary content
        const timestamp = new Date().toISOString();
        const dateStr = timestamp.split('T')[0];
        const filename = `${dateStr}-${title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.md`;
        const filepath = path.join(summariesDir, filename);

        // Create summary content
        let content = `# ${title}\n\n`;
        content += `**Date**: ${dateStr}\n`;
        content += `**Type**: ${summaryType}\n`;

        if (sessionId) {
          const session = memory.sessions.find(s => s.id === sessionId);
          if (session) {
            content += `**Session**: ${session.name} (${session.id})\n`;
          }
        } else if (memory.currentSession) {
          content += `**Session**: ${memory.currentSession.name} (${memory.currentSession.id})\n`;
        }

        content += '\n## Summary\n\n';
        content += '*Please add your summary content here...*\n\n';

        // Add context sections
        content += '## Context\n\n';
        content += '### Active Tasks\n';
        const activeTasks = memory.getTasks('open').slice(0, 5);
        if (activeTasks.length > 0) {
          activeTasks.forEach(task => {
            content += `- ${task.description} (${task.priority})\n`;
          });
        } else {
          content += '- No active tasks\n';
        }

        content += '\n### Recent Decisions\n';
        const recentDecisions = memory.getRecentDecisions(3);
        if (recentDecisions.length > 0) {
          recentDecisions.forEach(decision => {
            content += `- ${decision.decision}\n`;
          });
        } else {
          content += '- No recent decisions\n';
        }

        content += '\n### Key Patterns\n';
        const openPatterns = memory.patterns.filter(p => p.status === 'open' && p.priority === 'high').slice(0, 3);
        if (openPatterns.length > 0) {
          openPatterns.forEach(pattern => {
            content += `- ${pattern.pattern} (${pattern.frequency} occurrences)\n`;
          });
        } else {
          content += '- No high-priority patterns\n';
        }

        // Ensure summaries directory exists
        if (!fs.existsSync(summariesDir)) {
          fs.mkdirSync(summariesDir, { recursive: true });
        }

        // Write summary file
        fs.writeFileSync(filepath, content, 'utf8');

        // Record summary in memory
        if (!memory.summaries) {
          memory.summaries = [];
        }
        memory.summaries.push({
          id: `sum_${Date.now()}`,
          filename,
          title,
          type: summaryType,
          sessionId: sessionId || memory.currentSession?.id,
          created: timestamp,
          path: filepath
        });
        memory.saveMemory();

        console.log(`✅ Summary created: ${filename}`);
        console.log(`📝 Path: ${filepath}`);
        console.log('💡 Edit the file to add your summary content');
      } catch (error) {
        console.error('❌ Error creating summary:', error.message);
      }
      break;
    }

    case 'list': {
      try {
        // Ensure summaries directory exists
        if (!fs.existsSync(summariesDir)) {
          console.log('📂 No summaries found (directory does not exist)');
          return;
        }

        // List all summary files
        const files = fs.readdirSync(summariesDir)
          .filter(f => f.endsWith('.md'))
          .sort()
          .reverse(); // Most recent first

        if (files.length === 0) {
          console.log('📂 No summaries found');
          console.log('💡 Create one with: claude-memory summary generate "Title"');
          return;
        }

        console.log(`📚 Found ${files.length} summaries:\n`);

        files.forEach(file => {
          const filepath = path.join(summariesDir, file);
          const stats = fs.statSync(filepath);
          const content = fs.readFileSync(filepath, 'utf8');
          const titleMatch = content.match(/^# (.+)$/m);
          const title = titleMatch ? titleMatch[1] : 'Untitled';
          const dateStr = new Date(stats.mtime).toISOString().split('T')[0];

          console.log(`📄 ${file}`);
          console.log(`   Title: ${title}`);
          console.log(`   Modified: ${dateStr}`);
          console.log(`   Size: ${(stats.size / 1024).toFixed(1)} KB`);
          console.log('');
        });
      } catch (error) {
        console.error('❌ Error listing summaries:', error.message);
      }
      break;
    }

    case 'view': {
      const filename = args[0];

      if (!filename) {
        console.error('❌ Summary filename required');
        console.log('Usage: claude-memory summary view <filename>');
        console.log('Use "claude-memory summary list" to see available summaries');
        return;
      }

      try {
        // Add .md extension if not provided
        const file = filename.endsWith('.md') ? filename : `${filename}.md`;
        const filepath = path.join(summariesDir, file);

        if (!fs.existsSync(filepath)) {
          console.error(`❌ Summary not found: ${file}`);
          console.log('Use "claude-memory summary list" to see available summaries');
          return;
        }

        const content = fs.readFileSync(filepath, 'utf8');
        console.log(content);
      } catch (error) {
        console.error('❌ Error viewing summary:', error.message);
      }
      break;
    }

    default:
      console.error(`❌ Unknown summary action: ${action}`);
      console.log('Available actions: generate, list, view');
      console.log('Use "claude-memory summary --help" for more information');
    }
  },

  async config(action, key, value) {
    const projectPath = process.cwd();
    const configPath = path.join(projectPath, '.claude', 'config.json');

    // Handle help flags
    if (action === '--help' || action === '-h') {
      commands.showContextualHelp('config');
      process.exit(0);
    }

    if (action === 'get') {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (key) {
          console.log(`${key}: ${config[key]}`);
        } else {
          console.log(JSON.stringify(config, null, 2));
        }
      } catch (error) {
        console.error('❌ Error reading config:', error.message);
      }
    } else if (action === 'set' && key && value !== undefined) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        // Parse boolean values
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (!isNaN(value)) value = parseFloat(value);

        config[key] = value;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log(`✅ Config updated: ${key} = ${value}`);
      } catch (error) {
        console.error('❌ Error setting config:', error.message);
      }
    } else {
      console.error('❌ Usage: claude-memory config get [key] | claude-memory config set <key> <value>');
    }
  },

  async knowledge(action, ...args) {
    const projectPath = process.cwd();

    // Handle help flags
    if (action === '--help' || action === '-h') {
      commands.showContextualHelp('knowledge');
      process.exit(0);
    }

    if (action === 'add') {
      const key = args[0];
      const value = args[1];
      let category = 'general';

      // Parse optional category flag
      for (let i = 2; i < args.length; i++) {
        if (args[i] === '--category' && args[i + 1]) {
          category = args[i + 1];
          break;
        }
      }

      if (!key || !value) {
        console.error('❌ Key and value required');
        console.log('Usage: claude-memory knowledge add <key> <value> [--category category]');
        return;
      }

      try {
        const sanitizedKey = sanitizeInput(key, 100);
        const sanitizedValue = sanitizeInput(value, 1000);
        const sanitizedCategory = sanitizeInput(category, 50);

        const memory = new ClaudeMemory(projectPath);
        memory.storeKnowledge(sanitizedKey, sanitizedValue, sanitizedCategory);

        console.log(`✅ Knowledge stored: ${sanitizedKey}`);
        console.log(`📂 Category: ${sanitizedCategory}`);
        console.log(`📝 Value: ${sanitizedValue}`);
      } catch (error) {
        console.error('❌ Error storing knowledge:', error.message);
      }
    } else if (action === 'get') {
      const key = args[0];
      const category = args[1] || null;

      if (!key) {
        console.error('❌ Key required');
        console.log('Usage: claude-memory knowledge get <key> [category]');
        return;
      }

      try {
        const memory = new ClaudeMemory(projectPath);

        if (category) {
          // Get from specific category
          const categoryData = memory.knowledge[category];
          if (categoryData && categoryData[key]) {
            console.log(`📂 [${category}] ${key}:`);
            console.log(`   ${categoryData[key].value}`);
            console.log(`   Last updated: ${categoryData[key].lastUpdated.split('T')[0]}`);
          } else {
            console.log(`❌ Knowledge not found: ${key} in category ${category}`);
          }
        } else {
          // Search across all categories
          let found = false;
          Object.entries(memory.knowledge).forEach(([cat, items]) => {
            if (items[key]) {
              console.log(`📂 [${cat}] ${key}:`);
              console.log(`   ${items[key].value}`);
              console.log(`   Last updated: ${items[key].lastUpdated.split('T')[0]}`);
              found = true;
            }
          });
          if (!found) {
            console.log(`❌ Knowledge not found: ${key}`);
          }
        }
      } catch (error) {
        console.error('❌ Error retrieving knowledge:', error.message);
      }
    } else if (action === 'list') {
      const category = args[0] || null;

      try {
        const memory = new ClaudeMemory(projectPath);

        if (category) {
          // List specific category
          const categoryData = memory.knowledge[category];
          if (categoryData && Object.keys(categoryData).length > 0) {
            console.log(`\n📂 Knowledge: ${category}\n`);
            Object.entries(categoryData).forEach(([key, data]) => {
              console.log(`• ${key}: ${data.value}`);
              console.log(`  Updated: ${data.lastUpdated.split('T')[0]}`);
              console.log('');
            });
          } else {
            console.log(`📂 No knowledge found in category: ${category}`);
          }
        } else {
          // List all categories
          const categories = Object.keys(memory.knowledge);
          if (categories.length === 0) {
            console.log('📂 No knowledge stored yet');
            return;
          }

          console.log(`\n📚 Knowledge Base (${categories.length} categories)\n`);
          categories.forEach(cat => {
            const items = Object.keys(memory.knowledge[cat]);
            console.log(`📂 ${cat} (${items.length} items)`);
            items.slice(0, 3).forEach(key => {
              const data = memory.knowledge[cat][key];
              console.log(`  • ${key}: ${data.value.length > 50 ? data.value.substring(0, 50) + '...' : data.value}`);
            });
            if (items.length > 3) {
              console.log(`  ... and ${items.length - 3} more`);
            }
            console.log('');
          });
        }
      } catch (error) {
        console.error('❌ Error listing knowledge:', error.message);
      }
    } else if (action === 'delete') {
      const key = args[0];
      const category = args[1];

      if (!key || !category) {
        console.error('❌ Key and category required');
        console.log('Usage: claude-memory knowledge delete <key> <category>');
        return;
      }

      try {
        const memory = new ClaudeMemory(projectPath);

        if (memory.knowledge[category] && memory.knowledge[category][key]) {
          delete memory.knowledge[category][key];

          // Remove empty category
          if (Object.keys(memory.knowledge[category]).length === 0) {
            delete memory.knowledge[category];
          }

          memory.saveMemory();
          memory.updateClaudeFile();
          console.log(`✅ Knowledge deleted: ${key} from ${category}`);
        } else {
          console.log(`❌ Knowledge not found: ${key} in category ${category}`);
        }
      } catch (error) {
        console.error('❌ Error deleting knowledge:', error.message);
      }
    } else {
      console.error('❌ Knowledge action must be: add, get, list, or delete');
      console.log('Examples:');
      console.log('  claude-memory knowledge add "API_URL" "https://api.example.com" --category config');
      console.log('  claude-memory knowledge get "API_URL"');
      console.log('  claude-memory knowledge list config');
      console.log('  claude-memory knowledge delete "API_URL" config');
    }
  },

  help(subcommand = null) {
    if (subcommand) {
      this.showContextualHelp(subcommand);
      return;
    }

    console.log(`
🧠 Claude Memory v${packageJson.version} - Transform AI conversations into persistent project intelligence

USAGE: claude-memory (or cmem) [command] [options]

QUICK START:
  📁 cmem init "My Project"        Initialize memory in current directory
  ✅ cmem task add "My task"       Add your first task  
  ❓ cmem help <command>           Get detailed help for any command

CORE COMMANDS:
  📁 init ["Project Name"] [path]        Initialize memory system in project
  📊 stats [path]                        Show memory statistics and project overview
  🔍 search "query" [options]            Search across all project memory
  
MEMORY MANAGEMENT:
  📋 decision "choice" "reasoning"       Record important project decisions
  🧩 pattern <action> [options]          Manage reusable patterns and learnings
  ✅ task <action> [options]             Manage project tasks and todos
  📚 session <action> [options]          Track work sessions and context
  💡 knowledge <action> [options]        Store and retrieve project knowledge

UTILITIES:
  🔧 config <action> [options]           View and update configuration
  📤 backup [path]                       Create memory backup
  📄 export [filename] [options]         Export memory with advanced options
  📥 import <filename> [options]         Import memory data with merge/replace options
  📊 report [type] [options]             Generate project reports and analytics
  🤖 context [path]                      Get AI integration context (JSON)
  🔄 handoff [options] [path]            Generate AI handoff summary (saves to HANDOFF.md)
  📝 summary <action> [options]          Manage project summaries (generate, list, view)
  ❓ help [command]                      Show help (add command name for details)

GLOBAL FLAGS:
  --quiet, -q                            Suppress non-essential output
  --output, -o <format>                  Output format: json, text, yaml (default: text)
  --no-color                             Disable colored output (for CI/CD)
  --verbose                              Show detailed execution information
  --dry-run                              Preview changes without executing them
  --config, -c <path>                    Use custom config file path
  --force, -f                            Skip confirmation prompts
  --debug                                Show debug information for troubleshooting
  --version, -v                          Show version number
  --help, -h                             Show this help message

ENVIRONMENT VARIABLES:
  CLAUDE_MEMORY_CONFIG                   Path to custom config file

GET DETAILED HELP:
  cmem help task                    📝 Task management commands and workflows
  cmem help pattern                 🧩 Pattern management and resolution  
  cmem help knowledge               💡 Knowledge storage and retrieval
  cmem help session                 📚 Session tracking and context management
  cmem help search                  🔍 Advanced search and filtering options
  cmem help export                  📄 Advanced export options and formats
  cmem help import                  📥 Import options and merge strategies
  cmem help report                  📊 Report generation and analytics
  cmem help examples                📚 Common usage patterns and workflows

SUBCOMMANDS:
  pattern add "name" "desc" [score] [priority]    Learn patterns
  pattern resolve <pattern-id> "solution"         Resolve patterns
  task add "description" [options]                Add new tasks
  session cleanup                                 End all sessions

QUICK EXAMPLES:
  cmem task add "Setup CI/CD" --priority high
  cmem decision "Use React" "Better ecosystem than Vue"
  cmem knowledge add "API_URL" "https://api.myapp.com" --category config
  cmem search "authentication" --type decisions

💡 Tip: Use 'cmem help <command>' for detailed command-specific help
📚 Documentation: https://github.com/robwhite4/claude-memory
`);
  },

  showContextualHelp(command) {
    const helpSections = {
      task: {
        title: '✅ Task Management',
        description: 'Manage project tasks, todos, and work tracking',
        commands: {
          'task add "description" [options]': 'Add a new task with optional priority and assignee',
          'task complete <task-id> ["outcome"]': 'Mark task as completed with optional outcome note',
          'task list [status]': 'List tasks (all, open, completed, in-progress)',
          'task add-bulk <tasks.json>': 'Import multiple tasks from JSON file',
          'task export [format] [status]': 'Export tasks to JSON or GitHub issue format'
        },
        options: {
          '--priority <level>': 'Set priority: critical, high, medium, low (default: medium)',
          '--assignee <name>': 'Assign task to team member',
          '--due <date>': 'Set due date (YYYY-MM-DD format)'
        },
        examples: [
          'cmem task add "Implement authentication" --priority high',
          'cmem task add "Write tests" --assignee "developer" --due "2024-01-15"',
          'cmem task complete abc123 "Successfully implemented with JWT"',
          'cmem task list open',
          'cmem task list completed',
          'cmem task add-bulk ./project-tasks.json',
          'cmem task export json > tasks-backup.json',
          'cmem task export github-issues completed'
        ],
        tips: [
          '💡 Task IDs are auto-generated short codes (e.g., abc123)',
          '💡 Use descriptive task names for better project tracking',
          '💡 Set priorities to help focus on important work first'
        ]
      },

      pattern: {
        title: '🧩 Pattern Management',
        description: 'Capture, manage, and resolve recurring patterns and learnings',
        commands: {
          'pattern add "name" "description" [effectiveness] [priority]': 'Learn a new pattern from experience',
          'pattern list [--priority <level>]': 'List patterns, optionally filtered by priority',
          'pattern search "query"': 'Search patterns by name or description',
          'pattern resolve <pattern-id> "solution"': 'Mark pattern as resolved with solution'
        },
        options: {
          '[effectiveness]': 'Effectiveness score 0.0-1.0 (default: 0.8)',
          '[priority]': 'Priority level: critical, high, medium, low (default: medium)',
          '--priority <level>': 'Filter by priority level'
        },
        examples: [
          'cmem pattern add "Security First" "Always validate input" 0.9 high',
          'cmem pattern add "Test Early" "Write tests before implementation"',
          'cmem pattern list --priority high',
          'cmem pattern search "security"',
          'cmem pattern resolve def456 "Added input validation middleware"'
        ],
        tips: [
          '💡 Use patterns to capture lessons learned and best practices',
          '💡 High-priority patterns appear in AI handoff summaries',
          '💡 Resolve patterns when you implement permanent solutions'
        ]
      },

      knowledge: {
        title: '💡 Knowledge Management',
        description: 'Store and retrieve project-specific information and configuration',
        commands: {
          'knowledge add <key> <value> [--category <cat>]': 'Store a piece of knowledge',
          'knowledge get <key> [category]': 'Retrieve knowledge by key',
          'knowledge list [category]': 'List all knowledge or by category',
          'knowledge delete <key> <category>': 'Delete specific knowledge entry'
        },
        options: {
          '--category <name>': 'Organize knowledge by category (default: general)',
          '[category]': 'Optional category filter for get/list commands'
        },
        examples: [
          'cmem knowledge add "API_KEY" "sk-abc123..." --category config',
          'cmem knowledge add "Database_URL" "postgresql://..." --category config',
          'cmem knowledge add "Team_Lead" "Alice Johnson" --category contacts',
          'cmem knowledge get "API_KEY"',
          'cmem knowledge list config',
          'cmem knowledge delete "OLD_API_KEY" config'
        ],
        tips: [
          '💡 Use categories to organize knowledge (config, urls, contacts, etc.)',
          '💡 Store non-sensitive configuration and reference information',
          '💡 Search works across all knowledge using the main search command'
        ]
      },

      session: {
        title: '📚 Session Management',
        description: 'Track work sessions and maintain context across activities',
        commands: {
          'session start "name" [context]': 'Start a new work session',
          'session end [session-id] ["outcome"]': 'End current or specific session',
          'session list': 'List recent sessions',
          'session cleanup': 'End all active sessions'
        },
        options: {
          '[context]': 'Optional JSON context object for session',
          '[session-id]': 'Specific session ID (format: YYYY-MM-DD-name)',
          '["outcome"]': 'Optional outcome description when ending session'
        },
        examples: [
          'cmem session start "Feature Development"',
          'cmem session start "Bug Fix" \'{"ticket": "BUG-123"}\'',
          'cmem session end "Feature completed successfully"',
          'cmem session end 2024-01-01-feature-dev "Paused for review"',
          'cmem session list',
          'cmem session cleanup'
        ],
        tips: [
          '💡 Sessions help track work context and time allocation',
          '💡 Session data appears in stats and handoff summaries',
          '💡 Use descriptive session names for better organization'
        ]
      },

      search: {
        title: '🔍 Advanced Search',
        description: 'Search across all project memory with filtering and output options',
        commands: {
          'search "query" [options] [path]': 'Search all memory types with advanced filtering'
        },
        options: {
          '--type <type>': 'Filter by type: decisions, patterns, tasks, knowledge',
          '--json': 'Output results in JSON format for integration',
          '--limit <n>': 'Limit number of results per type (default: unlimited)',
          '[path]': 'Search in specific project path (default: current directory)'
        },
        examples: [
          'cmem search "authentication"',
          'cmem search "config" --type knowledge',
          'cmem search "bug" --json --limit 3',
          'cmem search "database" --type decisions --json',
          'cmem search "API" --limit 5'
        ],
        tips: [
          '💡 Search works across decisions, patterns, tasks, and knowledge',
          '💡 Use --json for integration with other tools',
          '💡 Combine --type and --limit for focused results'
        ]
      },

      export: {
        title: '📄 Export Command',
        description: 'Export memory data with multiple formats and filtering options',
        commands: {
          'export [filename] [options] [path]': 'Export memory with advanced filtering and formatting'
        },
        options: {
          '--format <type>': 'Output format: json, yaml, csv, markdown (default: json)',
          '--types <list>': 'Comma-separated types: tasks, patterns, decisions, knowledge, sessions',
          '--from <date>': 'Export items from this date (ISO format: YYYY-MM-DD)',
          '--to <date>': 'Export items up to this date (ISO format: YYYY-MM-DD)',
          '--sanitized': 'Remove sensitive information from export',
          '--no-metadata': 'Exclude metadata from export'
        },
        examples: [
          'cmem export',
          'cmem export my-project.json',
          'cmem export --format markdown',
          'cmem export report.md --format markdown --types tasks,decisions',
          'cmem export --types tasks --format csv',
          'cmem export backup.yaml --format yaml --sanitized',
          'cmem export --from 2024-01-01 --to 2024-12-31',
          'cmem export tasks.json --types tasks --from 2024-01-01'
        ],
        tips: [
          '💡 JSON format preserves all data structures for re-import',
          '💡 Markdown format is great for documentation and reports',
          '💡 CSV format works well for spreadsheet analysis',
          '💡 Use --sanitized to remove personal information before sharing',
          '💡 Combine --types and date filters for focused exports'
        ]
      },

      import: {
        title: '📥 Import Command',
        description: 'Import memory data from exported files with merge or replace options',
        commands: {
          'import <filename> [options] [path]': 'Import memory data from JSON or YAML files'
        },
        options: {
          '--mode <mode>': 'Import mode: merge (default) or replace',
          '--types <list>': 'Comma-separated types: tasks, patterns, decisions, knowledge, sessions',
          '--dry-run': 'Preview import without making changes'
        },
        examples: [
          'cmem import backup.json',
          'cmem import tasks.json --types tasks',
          'cmem import project-data.yaml --mode replace',
          'cmem import data.json --dry-run',
          'cmem import archive.json --types tasks,decisions --mode merge'
        ],
        tips: [
          '💡 Merge mode adds new items and skips duplicates',
          '💡 Replace mode clears existing data before importing',
          '💡 Use --dry-run to preview what will be imported',
          '💡 Supports both JSON and YAML formats',
          '💡 Import validates data structure before processing'
        ]
      },

      report: {
        title: '📊 Report Generation',
        description: 'Generate project reports and analytics in various formats',
        commands: {
          'report [type] [filename] [options] [path]': 'Generate project reports'
        },
        options: {
          '--type <type>': 'Report type: summary, tasks, patterns, decisions, progress, sprint',
          '--format <format>': 'Output format: markdown, json (default: markdown)',
          '--from <date>': 'Include data from this date (ISO format: YYYY-MM-DD)',
          '--to <date>': 'Include data up to this date (ISO format: YYYY-MM-DD)',
          '--save': 'Auto-save report with timestamp in .claude/reports/',
          '--save-dir <path>': 'Custom directory for auto-saved reports'
        },
        examples: [
          'cmem report',
          'cmem report summary',
          'cmem report tasks report.md',
          'cmem report --type sprint --format json',
          'cmem report progress weekly.md --from 2024-01-01 --to 2024-01-07',
          'cmem report decisions --format json > decisions.json',
          'cmem report summary --save',
          'cmem report sprint --save --format json',
          'cmem report tasks --save --save-dir ./my-reports'
        ],
        tips: [
          '💡 Summary report provides a high-level project overview',
          '💡 Sprint report shows activity from the last 2 weeks',
          '💡 Progress report includes a timeline of activities',
          '💡 Use date filters to generate reports for specific periods',
          '💡 JSON format is useful for further processing or integration',
          '💡 --save creates timestamped files for historical tracking',
          '💡 Reports directory can be tracked in git or ignored as needed'
        ]
      },

      summary: {
        title: '📝 Summary Management',
        description: 'Create and manage project summaries in the .claude/summaries directory',
        commands: {
          'summary generate <title> [options]': 'Create a new summary with template',
          'summary list': 'List all available summaries',
          'summary view <filename>': 'View a specific summary'
        },
        options: {
          '--session <id>': 'Link summary to specific session (generate)',
          '--type <type>': 'Summary type: manual, session, daily, weekly (default: manual)'
        },
        examples: [
          'cmem summary generate "Sprint 1 Retrospective"',
          'cmem summary generate "Feature Complete" --session 2025-01-15-morning',
          'cmem summary generate "Weekly Review" --type weekly',
          'cmem summary list',
          'cmem summary view 2025-01-15-sprint-1-retrospective',
          'cmem summary view 2025-01-15-sprint-1-retrospective.md'
        ],
        tips: [
          '💡 Summaries provide narrative context alongside structured data',
          '💡 Generated summaries include context from current session',
          '💡 Edit generated files to add your own insights and notes',
          '💡 Use summaries for sprint retrospectives and milestone documentation',
          '💡 Summary files are markdown format for easy editing and reading',
          '💡 Summaries complement the automated handoff and report features'
        ]
      },

      examples: {
        title: '📚 Common Usage Patterns',
        description: 'Real-world workflows and usage examples',
        workflows: {
          '🚀 Starting a New Project': [
            'cmem init "My Web App"',
            'cmem task add "Setup development environment" --priority high',
            'cmem knowledge add "Repository" "https://github.com/user/repo" --category links',
            'cmem session start "Initial Setup"'
          ],
          '🔧 Daily Development Workflow': [
            'cmem session start "Feature: User Auth"',
            'cmem task add "Implement login form" --priority high',
            'cmem decision "Use JWT tokens" "Better security and stateless"',
            'cmem pattern add "Input Validation" "Always validate on both client and server"',
            'cmem task complete abc123 "Login form completed with validation"'
          ],
          '🐛 Bug Fixing Session': [
            'cmem session start "Bug Fix: Login Issue"',
            'cmem search "login" --type decisions',
            'cmem pattern search "auth"',
            'cmem decision "Add rate limiting" "Prevents brute force attacks"',
            'cmem session end "Fixed login rate limiting issue"'
          ],
          '🤖 AI Assistant Handoff': [
            'cmem handoff --include=tasks',
            'cmem search "current project" --limit 5',
            'cmem stats',
            '// Then tell AI: "Load project memory and continue development"'
          ]
        }
      }
    };

    const section = helpSections[command.toLowerCase()];
    if (!section) {
      console.log(`❌ No detailed help available for: ${command}
      
Available help topics:
  task, pattern, knowledge, session, search, export, import, report, examples
  
Usage: cmem help <topic>`);
      return;
    }

    console.log(`
${section.title}
${section.description}

`);

    if (section.commands) {
      console.log('COMMANDS:');
      Object.entries(section.commands).forEach(([cmd, desc]) => {
        console.log(`  claude-memory ${cmd.padEnd(45)} ${desc}`);
      });
      console.log();
    }

    if (section.options) {
      console.log('OPTIONS:');
      Object.entries(section.options).forEach(([opt, desc]) => {
        console.log(`  ${opt.padEnd(25)} ${desc}`);
      });
      console.log();
    }

    if (section.examples) {
      console.log('EXAMPLES:');
      section.examples.forEach(example => {
        console.log(`  ${example}`);
      });
      console.log();
    }

    if (section.workflows) {
      console.log('COMMON WORKFLOWS:');
      Object.entries(section.workflows).forEach(([workflow, commands]) => {
        console.log(`\n${workflow}:`);
        commands.forEach(cmd => {
          console.log(`  ${cmd}`);
        });
      });
      console.log();
    }

    if (section.tips) {
      console.log('TIPS:');
      section.tips.forEach(tip => {
        console.log(`  ${tip}`);
      });
      console.log();
    }

    console.log(`For general help: cmem help
For other topics: cmem help <topic>`);
  },

  updateGitignore(projectPath) {
    const gitignorePath = path.join(projectPath, '.gitignore');
    let gitignoreContent = '';

    if (fs.existsSync(gitignorePath)) {
      gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    }

    if (!gitignoreContent.includes('# Claude Memory')) {
      const claudeIgnore = `
# Claude Memory - Include core files, exclude private data
.claude/sessions/
.claude/backups/
.claude/memory.json

# But include the core system
!CLAUDE.md
`;
      gitignoreContent += claudeIgnore;
      fs.writeFileSync(gitignorePath, gitignoreContent);
    }
  },

  updatePackageJson(projectPath) {
    const packagePath = path.join(projectPath, 'package.json');

    if (fs.existsSync(packagePath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

        if (!pkg.scripts) pkg.scripts = {};
        if (!pkg.scripts.memory) {
          pkg.scripts.memory = 'claude-memory';
          pkg.scripts['memory:stats'] = 'claude-memory stats';
          pkg.scripts['memory:search'] = 'claude-memory search';

          fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
          console.log('✅ Added memory scripts to package.json');
        }
      } catch (error) {
        // Ignore JSON parse errors
      }
    }
  }
};

// Parse command line arguments
const allArgs = process.argv.slice(2);

// Check for global flags first
const cleanArgs = [];
let command = null;
let outputFormat = 'text'; // default format
let noColor = false;

// Check for early exit flags first
if (allArgs.includes('--version') || allArgs.includes('-v')) {
  console.log(`claude-memory v${packageJson.version}`);
  process.exit(0);
}

// Process all arguments for global flags
for (let i = 0; i < allArgs.length; i++) {
  const arg = allArgs[i];

  if (arg === '--quiet' || arg === '-q') {
    globalQuietMode = true;
  } else if (arg === '--output' || arg === '-o') {
    // Next argument should be the format
    if (i + 1 < allArgs.length && !allArgs[i + 1].startsWith('-')) {
      outputFormat = allArgs[i + 1].toLowerCase();
      i++; // Skip the format value
      if (!['json', 'text', 'yaml'].includes(outputFormat)) {
        console.error(`❌ Invalid output format: ${outputFormat}. Valid options: json, text, yaml`);
        process.exit(1);
      }
      globalOutputFormat = outputFormat;
    } else {
      console.error('❌ --output flag requires a format: json, text, or yaml');
      process.exit(1);
    }
  } else if (arg === '--no-color') {
    noColor = true;
  } else if (arg === '--verbose') {
    globalVerboseMode = true;
  } else if (arg === '--dry-run') {
    globalDryRunMode = true;
  } else if (arg === '--debug') {
    globalDebugMode = true;
  } else if (arg === '--config' || arg === '-c') {
    // Next argument should be the config path
    if (i + 1 < allArgs.length && !allArgs[i + 1].startsWith('-')) {
      globalConfigPath = allArgs[i + 1];
      i++; // Skip the config path value
    } else {
      console.error('❌ --config flag requires a path to config file');
      process.exit(1);
    }
  } else if (arg === '--force' || arg === '-f') {
    globalForceMode = true;
  } else if (!command && !arg.startsWith('-')) {
    // First non-flag argument is the command
    command = arg;
  } else {
    // Remaining arguments for the command
    cleanArgs.push(arg);
  }
}

// Show dry run mode indicator
if (globalDryRunMode && !globalQuietMode) {
  console.log('🔍 DRY RUN MODE - No changes will be made');
}

// Show debug mode indicator
if (globalDebugMode && !globalQuietMode) {
  console.log('🐛 DEBUG MODE - Detailed execution information will be shown');
}

// Color stripping utility
const stripColors = (str) => {
  // Remove ANSI color codes and emojis
  return str
    // eslint-disable-next-line no-control-regex
    .replace(/\u001b\[[0-9;]*m/g, '') // ANSI codes
    .replace(
      /[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
      ''
    ); // Common emoji ranges
};

// Helper function for quiet mode
const log = (message) => {
  if (!globalQuietMode) {
    console.log(noColor ? stripColors(message) : message);
  }
};

// Helper function for essential output (always shown)
const output = (message) => {
  console.log(noColor ? stripColors(message) : message);
};

// Helper function for verbose output
const verbose = (message) => {
  if (globalVerboseMode) {
    console.log(noColor ? stripColors(`[VERBOSE] ${message}`) : `[VERBOSE] ${message}`);
  }
};

// Helper function for debug output
const debug = (message, data = null) => {
  if (globalDebugMode) {
    const timestamp = new Date().toISOString();
    const debugMsg = `[DEBUG ${timestamp}] ${message}`;
    console.log(noColor ? stripColors(debugMsg) : debugMsg);
    if (data !== null) {
      console.log(noColor ? stripColors(JSON.stringify(data, null, 2)) : JSON.stringify(data, null, 2));
    }
  }
};

// Override console methods if no-color is enabled
if (noColor) {
  const originalLog = console.log;
  const originalError = console.error;

  console.log = (...args) => {
    originalLog(...args.map(arg => typeof arg === 'string' ? stripColors(arg) : arg));
  };

  console.error = (...args) => {
    originalError(...args.map(arg => typeof arg === 'string' ? stripColors(arg) : arg));
  };
}

// Version flag is handled above in early exit checks

// Debug command parsing
debug('Command parsing complete', {
  command,
  args: cleanArgs,
  flags: {
    quiet: globalQuietMode,
    output: globalOutputFormat,
    verbose: globalVerboseMode,
    dryRun: globalDryRunMode,
    force: globalForceMode,
    debug: globalDebugMode,
    config: globalConfigPath,
    noColor
  }
});

// Handle help flags
if (!command || command === 'help' || command === '--help' || command === '-h') {
  // For --help and -h flags, show general help, not help for a specific command
  const helpTopic = (command === 'help') ? cleanArgs[0] : null;
  commands.help(helpTopic);
  process.exit(0);
}

if (!commands[command]) {
  console.error(`❌ Unknown command: '${command}'`);

  // Suggest similar commands
  const availableCommands = Object.keys(commands);
  const suggestions = availableCommands.filter(cmd =>
    cmd.includes(command) || command.includes(cmd) ||
    cmd.toLowerCase().includes(command.toLowerCase())
  );

  if (suggestions.length > 0) {
    console.log(`\n💡 Did you mean: ${suggestions.join(', ')}?`);
  }

  console.log(`\n📚 Available commands: ${availableCommands.join(', ')}`);
  console.log('💡 Use "claude-memory help" for full command list');
  console.log('💡 Use "claude-memory help <command>" for detailed help');
  process.exit(1);
}

try {
  // Pass quiet mode to memory system for commands that use it
  if (commands[command].memory) {
    commands[command].memory.quietMode = globalQuietMode;
  }
  debug(`Executing command: ${command}`, { args: cleanArgs });
  await commands[command](...cleanArgs);
} catch (error) {
  console.error('❌ Error:', error.message);
  if (globalDebugMode) {
    console.error('\n[DEBUG] Full error details:');
    console.error(error.stack);
  }
  process.exit(1);
}
