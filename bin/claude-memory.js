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

// Helper to create memory instance with global flags
function createMemory(projectPath, projectName = null, options = {}) {
  // Pass dry run mode through options
  if (globalDryRunMode) {
    options.dryRun = true;
  }
  
  const memory = new ClaudeMemory(projectPath, projectName, options);
  memory.quietMode = globalQuietMode;
  memory.outputFormat = globalOutputFormat;
  memory.verboseMode = globalVerboseMode;
  return memory;
}

// Command implementations

const commands = {
  async init(projectName, projectPath = process.cwd()) {
    // Handle various argument patterns
    if (projectName && (projectName.startsWith('/') || projectName.startsWith('.') || projectName.includes('/'))) {
      projectPath = projectName;
      projectName = path.basename(projectPath);
    }

    if (!projectName) {
      projectName = path.basename(projectPath);
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
    } else {
      console.error('❌ Task action must be: add, complete, or list');
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

    // Parse arguments and flags
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === '--sanitized') {
        sanitized = true;
      } else if (arg?.startsWith('--')) {
        console.error(`❌ Unknown flag: ${arg}`);
        console.log('Usage: claude-memory export [filename] [--sanitized] [path]');
        return;
      } else if (!filename && !arg?.startsWith('/') && !arg?.startsWith('.')) {
        // First non-flag, non-path argument is filename
        filename = sanitizeInput(arg, 100);
      } else if (!projectPath) {
        // Path-like argument
        projectPath = arg;
      }
    }

    // Use current directory if no path provided
    const targetPath = validatePath(projectPath || process.cwd());

    try {
      const memory = new ClaudeMemory(targetPath);
      let data = memory.exportMemory();

      // Sanitize data if requested
      if (sanitized) {
        data = this.sanitizeExportData(data);
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const sanitizedSuffix = sanitized ? '-sanitized' : '';
      const exportFile = filename || `claude-memory-export-${dateStr}${sanitizedSuffix}.json`;

      fs.writeFileSync(exportFile, JSON.stringify(data, null, 2));
      console.log(`✅ Memory exported to: ${exportFile}`);
      console.log(`📊 Exported ${Object.keys(data).length - 1} data categories`);
      if (sanitized) {
        console.log('🧹 Data sanitized (sensitive information removed)');
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

  session(action, ...args) {
    const projectPath = process.cwd();

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

  async handoff(format = 'markdown', include = 'all', projectPath) {
    // AI Handoff command - Generate comprehensive context summary for assistant transitions
    const targetPath = projectPath || process.cwd();

    try {
      const memory = new ClaudeMemory(targetPath, null, { silent: true });

      // Parse format option (support --format=json syntax)
      if (format?.startsWith('--format=')) {
        format = format.split('=')[1];
      }
      if (include?.startsWith('--include=')) {
        include = include.split('=')[1];
      }

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

      if (format === 'json') {
        console.log(JSON.stringify(handoffData, null, 2));
        return;
      }

      // Generate markdown handoff summary
      const markdown = this.generateHandoffMarkdown(handoffData, include);
      console.log(markdown);
    } catch (error) {
      if (format === 'json') {
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

  async config(action, key, value) {
    const projectPath = process.cwd();
    const configPath = path.join(projectPath, '.claude', 'config.json');

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
  📄 export [filename] [path]            Export memory to JSON
  🤖 context [path]                      Get AI integration context (JSON)
  🔄 handoff [options] [path]            Generate AI assistant handoff summary
  ❓ help [command]                      Show help (add command name for details)

GLOBAL FLAGS:
  --quiet, -q                            Suppress non-essential output
  --output, -o <format>                  Output format: json, text, yaml (default: text)
  --no-color                             Disable colored output (for CI/CD)
  --verbose                              Show detailed execution information
  --dry-run                              Preview changes without executing them
  --version, -v                          Show version number

GET DETAILED HELP:
  cmem help task                    📝 Task management commands and workflows
  cmem help pattern                 🧩 Pattern management and resolution  
  cmem help knowledge               💡 Knowledge storage and retrieval
  cmem help session                 📚 Session tracking and context management
  cmem help search                  🔍 Advanced search and filtering options
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
          'task update <task-id> [options]': 'Update task properties'
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
          'cmem task list completed'
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
  task, pattern, knowledge, session, search, examples
  
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

// Handle help flags
if (!command || command === 'help' || command === '--help' || command === '-h') {
  commands.help(cleanArgs[0]);
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
  await commands[command](...cleanArgs);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
