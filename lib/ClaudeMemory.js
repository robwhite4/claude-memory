/**
 * Claude Memory Core Class
 * Handles all memory operations and data management
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { createHash } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');

// Load package.json for version info
const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));

export class ClaudeMemory {
  constructor(projectRoot, projectName = 'My Project', options = {}) {
    this.projectRoot = projectRoot;
    this.projectName = projectName;
    this.claudeDir = path.join(projectRoot, '.claude');
    this.memoryFile = path.join(this.claudeDir, 'memory.json');
    this.configFile = path.join(this.claudeDir, 'config.json');
    this.claudeFile = path.join(projectRoot, 'CLAUDE.md');
    this.currentSession = null;
    this.options = options;
    this.quietMode = false; // Can be set externally
    this.outputFormat = 'text'; // Can be set externally
    this.verboseMode = false; // Can be set externally

    this.ensureDirectories();
    this.loadConfig();
    this.loadMemory();

    // Auto-session management
    if (this.config.autoSession !== false && !options.noAutoSession) {
      this.checkAutoSession();
    }

    // Auto-backup check
    if (this.config.autoBackup !== false) {
      this.checkAutoBackup();
    }
  }

  // Output helpers for quiet mode
  log(message) {
    if (!this.quietMode) {
      console.log(message);
    }
  }

  // Essential output (always shown)
  output(message) {
    console.log(message);
  }

  // Verbose output (only shown in verbose mode)
  verbose(message) {
    if (this.verboseMode) {
      console.log(`[VERBOSE] ${message}`);
    }
  }

  ensureDirectories() {
    const dirs = [
      this.claudeDir,
      path.join(this.claudeDir, 'backups'),
      path.join(this.claudeDir, 'context'),
      path.join(this.claudeDir, 'summaries')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    if (!fs.existsSync(this.memoryFile)) {
      const initialMemory = {
        sessions: [],
        decisions: [],
        patterns: [],
        actions: [],
        knowledge: {},
        tasks: [],
        created: new Date().toISOString(),
        version: packageJson.version,
        projectName: this.projectName
      };
      fs.writeFileSync(this.memoryFile, JSON.stringify(initialMemory, null, 2));
    }
  }

  loadConfig() {
    const defaultConfig = {
      autoSession: true,
      autoSessionHours: 4,
      autoBackup: true,
      backupInterval: 10, // actions
      maxBackupDays: 7,
      tokenOptimization: true,
      silentMode: false
    };

    try {
      if (fs.existsSync(this.configFile)) {
        const userConfig = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
        this.config = { ...defaultConfig, ...userConfig };
      } else {
        this.config = defaultConfig;
        fs.writeFileSync(this.configFile, JSON.stringify(defaultConfig, null, 2));
      }
    } catch (error) {
      this.config = defaultConfig;
    }
  }

  loadMemory() {
    try {
      const data = JSON.parse(fs.readFileSync(this.memoryFile, 'utf8'));
      this.sessions = data.sessions || [];
      this.decisions = data.decisions || [];
      this.patterns = data.patterns || [];
      this.actions = data.actions || [];
      this.knowledge = data.knowledge || {};
      this.tasks = data.tasks || [];
      this.metadata = {
        created: data.created,
        version: packageJson.version, // Always use current package version
        projectName: data.projectName || this.projectName,
        lastBackup: data.lastBackup,
        actionsSinceBackup: data.actionsSinceBackup || 0
      };

      // Version migration - update if memory file has old version
      if (data.version !== packageJson.version) {
        if (!this.options.silent && !this.config.silentMode) {
          console.log(`🔄 Migrating memory from v${data.version || 'unknown'} to v${packageJson.version}`);
        }
        this.saveMemory(); // Save with updated version
      }

      // Find current active session
      this.currentSession = this.sessions.find(s => s.status === 'active') || null;
    } catch (error) {
      this.sessions = [];
      this.decisions = [];
      this.patterns = [];
      this.actions = [];
      this.knowledge = {};
      this.tasks = [];
      this.metadata = {
        created: new Date().toISOString(),
        version: packageJson.version,
        projectName: this.projectName,
        lastBackup: null,
        actionsSinceBackup: 0
      };
    }
  }

  saveMemory() {
    const data = {
      sessions: this.sessions,
      decisions: this.decisions,
      patterns: this.patterns,
      actions: this.actions,
      knowledge: this.knowledge,
      tasks: this.tasks,
      created: this.metadata.created,
      version: this.metadata.version,
      projectName: this.metadata.projectName,
      lastBackup: this.metadata.lastBackup,
      actionsSinceBackup: this.metadata.actionsSinceBackup,
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(this.memoryFile, JSON.stringify(data, null, 2));
  }

  checkAutoSession() {
    if (!this.currentSession) {
      // Auto-start session based on time of day
      const hour = new Date().getHours();
      let sessionName;
      if (hour < 6) sessionName = 'Late Night Development';
      else if (hour < 12) sessionName = 'Morning Development';
      else if (hour < 17) sessionName = 'Afternoon Development';
      else if (hour < 21) sessionName = 'Evening Development';
      else sessionName = 'Night Development';

      if (!this.options.silent && !this.config.silentMode) {
        console.log(`🤖 Auto-starting session: ${sessionName}`);
      }
      this.startSession(sessionName, { auto: true, startTime: new Date().toISOString() });
    } else {
      // Check if session is too old
      const sessionAge = Date.now() - new Date(this.currentSession.startTime).getTime();
      const maxAge = this.config.autoSessionHours * 60 * 60 * 1000;

      if (sessionAge > maxAge) {
        // Generate summary of session activity
        const sessionActions = this.actions.filter(a => a.sessionId === this.currentSession.id);
        const summary = `Completed ${sessionActions.length} actions`;

        if (!this.options.silent && !this.config.silentMode) {
          console.log(`🔄 Auto-rotating session after ${this.config.autoSessionHours} hours`);
        }

        this.endSession(summary);
        this.checkAutoSession(); // Recursive to start new session
      }
    }
  }

  checkAutoBackup() {
    const shouldBackup = !this.metadata.lastBackup ||
      this.metadata.actionsSinceBackup >= this.config.backupInterval ||
      (Date.now() - new Date(this.metadata.lastBackup).getTime() > 24 * 60 * 60 * 1000);

    if (shouldBackup) {
      this.backup();
      this.cleanOldBackups();
    }
  }

  cleanOldBackups() {
    const backupsDir = path.join(this.claudeDir, 'backups');
    const maxAge = this.config.maxBackupDays * 24 * 60 * 60 * 1000;

    if (fs.existsSync(backupsDir)) {
      const backups = fs.readdirSync(backupsDir);
      const now = Date.now();

      backups.forEach(backup => {
        const backupPath = path.join(backupsDir, backup);
        const stats = fs.statSync(backupPath);

        if (now - stats.mtime.getTime() > maxAge) {
          fs.rmSync(backupPath, { recursive: true, force: true });
        }
      });
    }
  }

  startSession(sessionName, context = {}) {
    const sessionId = this.generateSessionId(sessionName);

    this.currentSession = {
      id: sessionId,
      name: sessionName,
      startTime: new Date().toISOString(),
      context,
      status: 'active'
    };

    this.sessions.push(this.currentSession);
    this.saveMemory();
    this.recordAction('session_started', { sessionName, context });
    return sessionId;
  }

  endSession(outcome = '') {
    if (this.currentSession) {
      this.currentSession.endTime = new Date().toISOString();
      this.currentSession.status = 'completed';
      this.currentSession.outcome = outcome;
      this.currentSession = null; // Clear current session
      this.saveMemory();
      this.recordAction('session_ended', { outcome });
      return true;
    }
    return false;
  }

  endSessionById(sessionId, outcome = '') {
    const session = this.sessions.find(s => s.id === sessionId);
    if (session && session.status === 'active') {
      session.endTime = new Date().toISOString();
      session.status = 'completed';
      session.outcome = outcome;
      if (this.currentSession && this.currentSession.id === sessionId) {
        this.currentSession = null;
      }
      this.saveMemory();
      this.recordAction('session_ended', { sessionId, outcome });
      return true;
    }
    return false;
  }

  cleanupSessions() {
    // End all active sessions
    let cleanedCount = 0;
    this.sessions.forEach(session => {
      if (session.status === 'active') {
        session.endTime = new Date().toISOString();
        session.status = 'completed';
        session.outcome = 'Session cleaned up';
        cleanedCount++;
      }
    });
    this.currentSession = null;
    this.saveMemory();
    return cleanedCount;
  }

  recordDecision(decision, reasoning, alternatives = [], outcome = null) {
    const decisionRecord = {
      id: this.generateId(),
      sessionId: this.currentSession?.id,
      timestamp: new Date().toISOString(),
      decision,
      reasoning,
      alternatives,
      outcome,
      context: this.currentSession?.context || {}
    };

    this.decisions.push(decisionRecord);
    this.saveMemory();
    this.updateClaudeFile();
    this.recordAction('decision_recorded', { decision, decisionId: decisionRecord.id });
    return decisionRecord.id;
  }

  learnPattern(pattern, description, _context = '', frequency = 1, effectiveness = null, priority = 'medium') {
    const existingPattern = this.patterns.find(p => p.pattern === pattern);
    let patternId;

    if (existingPattern) {
      existingPattern.frequency += frequency;
      existingPattern.lastSeen = new Date().toISOString();
      if (effectiveness !== null) {
        existingPattern.effectiveness = effectiveness;
      }
      if (priority) {
        existingPattern.priority = priority;
      }
      patternId = existingPattern.id;
    } else {
      patternId = this.generateId();
      this.patterns.push({
        id: patternId,
        pattern,
        description,
        frequency,
        effectiveness,
        priority: priority || 'medium',
        status: 'open',
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString()
      });
    }

    this.saveMemory();
    this.updateClaudeFile();
    this.recordAction('pattern_learned', { pattern, description, patternId });
    return patternId;
  }

  resolvePattern(patternId, solution) {
    const pattern = this.patterns.find(p => p.id === patternId);
    if (pattern) {
      pattern.status = 'resolved';
      pattern.solution = solution;
      pattern.resolvedAt = new Date().toISOString();
      this.saveMemory();
      this.updateClaudeFile();
      this.recordAction('pattern_resolved', { patternId, solution });
      return true;
    }
    return false;
  }

  storeKnowledge(key, value, category = 'general') {
    if (!this.knowledge[category]) {
      this.knowledge[category] = {};
    }

    this.knowledge[category][key] = {
      value,
      lastUpdated: new Date().toISOString(),
      sessionId: this.currentSession?.id
    };

    this.saveMemory();
    this.updateClaudeFile();
    this.recordAction('knowledge_stored', { key, category, value });
  }

  addTask(description, priority = 'medium', status = 'open', assignee = null, dueDate = null) {
    const task = {
      id: this.generateId(),
      description,
      priority,
      status,
      assignee,
      dueDate,
      createdAt: new Date().toISOString(),
      sessionId: this.currentSession?.id
    };

    this.tasks.push(task);
    this.saveMemory();
    this.updateClaudeFile();
    this.recordAction('task_added', { taskId: task.id, description, priority });
    return task.id;
  }

  completeTask(taskId, outcome = '') {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      task.outcome = outcome;
      this.saveMemory();
      this.updateClaudeFile();
      this.recordAction('task_completed', { taskId, outcome });
      return true;
    }
    return false;
  }

  updateTaskStatus(taskId, status) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = status;
      task.lastUpdated = new Date().toISOString();
      this.saveMemory();
      this.updateClaudeFile();
      this.recordAction('task_updated', { taskId, status });
      return true;
    }
    return false;
  }

  getTasks(status = null) {
    if (status) {
      return this.tasks.filter(t => t.status === status);
    }
    return this.tasks;
  }

  recordAction(actionType, details = {}, result = '') {
    const actionRecord = {
      id: this.generateId(),
      sessionId: this.currentSession?.id,
      timestamp: new Date().toISOString(),
      actionType,
      details,
      result
    };

    this.actions.push(actionRecord);
    this.metadata.actionsSinceBackup = (this.metadata.actionsSinceBackup || 0) + 1;
    this.saveMemory();

    // Check if auto-backup needed
    if (this.config.autoBackup) {
      this.checkAutoBackup();
    }

    return actionRecord.id;
  }

  searchMemory(query) {
    const results = {
      decisions: this.decisions.filter(d =>
        d.decision.toLowerCase().includes(query.toLowerCase()) ||
        d.reasoning.toLowerCase().includes(query.toLowerCase())
      ),
      patterns: this.patterns.filter(p =>
        p.pattern.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase())
      ),
      tasks: this.tasks.filter(t =>
        t.description.toLowerCase().includes(query.toLowerCase()) ||
        (t.assignee && t.assignee.toLowerCase().includes(query.toLowerCase()))
      ),
      knowledge: []
    };

    Object.entries(this.knowledge).forEach(([category, items]) => {
      Object.entries(items).forEach(([key, data]) => {
        if (key.toLowerCase().includes(query.toLowerCase()) ||
            String(data.value).toLowerCase().includes(query.toLowerCase())) {
          results.knowledge.push({ category, key, ...data });
        }
      });
    });

    return results;
  }

  getMemoryStats() {
    return {
      sessions: this.sessions.length,
      decisions: this.decisions.length,
      patterns: this.patterns.length,
      actions: this.actions.length,
      tasks: this.tasks.length,
      knowledgeCategories: Object.keys(this.knowledge).length,
      totalKnowledgeItems: Object.values(this.knowledge).reduce((sum, cat) => sum + Object.keys(cat).length, 0)
    };
  }

  getSessionHistory(limit = 10) {
    return this.sessions
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      .slice(0, limit);
  }

  getRecentDecisions(limit = 5) {
    return this.decisions
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.claudeDir, 'backups', timestamp);

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    fs.copyFileSync(this.memoryFile, path.join(backupDir, 'memory.json'));
    if (fs.existsSync(this.claudeFile)) {
      fs.copyFileSync(this.claudeFile, path.join(backupDir, 'CLAUDE.md'));
    }

    // Update backup metadata
    this.metadata.lastBackup = new Date().toISOString();
    this.metadata.actionsSinceBackup = 0;
    this.saveMemory();

    if (!this.options.silent && !this.config.silentMode) {
      console.log('💾 Auto-backup created');
    }
  }

  exportMemory() {
    return {
      sessions: this.sessions,
      decisions: this.decisions,
      patterns: this.patterns,
      actions: this.actions,
      knowledge: this.knowledge,
      tasks: this.tasks,
      metadata: this.metadata,
      exportedAt: new Date().toISOString()
    };
  }

  updateClaudeFile() {
    const content = this.generateClaudeContent();
    this.updateClaudeFileWithMerge(content);

    // Generate context files for full information
    this.generateContextFiles();
  }

  updateClaudeFileWithMerge(newAutoContent) {
    // Check if file exists and parse manual sections
    let manualSections = {};
    let fileStats = null;

    if (fs.existsSync(this.claudeFile)) {
      fileStats = fs.statSync(this.claudeFile);
      const existingContent = fs.readFileSync(this.claudeFile, 'utf8');
      manualSections = this.parseManualSections(existingContent);

      // Create backup before modifying
      this.createClaudeBackup(existingContent);
    }

    // Generate merged content with manual sections preserved
    const mergedContent = this.mergeManualAndAutoContent(newAutoContent, manualSections);

    // Write the merged content
    fs.writeFileSync(this.claudeFile, mergedContent);

    // Log merge action
    this.recordAction('claude_file_updated', {
      hasManualSections: Object.keys(manualSections).length > 0,
      backupCreated: fileStats !== null,
      preservedSections: Object.keys(manualSections)
    });
  }

  parseManualSections(content) {
    const sections = {};
    const manualSectionRegex = /<!-- BEGIN MANUAL SECTION: ([^>]+) -->([\s\S]*?)<!-- END MANUAL SECTION: \1 -->/g;

    let match;
    while ((match = manualSectionRegex.exec(content)) !== null) {
      const sectionName = match[1].trim();
      const sectionContent = match[2].trim();
      sections[sectionName] = sectionContent;
    }

    return sections;
  }

  mergeManualAndAutoContent(autoContent, manualSections) {
    let mergedContent = autoContent;

    // Insert manual sections at appropriate locations
    if (manualSections['Project Notes']) {
      // Insert project notes after Knowledge Base but before Open Patterns
      const insertPoint = mergedContent.indexOf('### Open Patterns');
      if (insertPoint !== -1) {
        const beforePattern = mergedContent.substring(0, insertPoint);
        const afterPattern = mergedContent.substring(insertPoint);

        const projectNotesSection = '### Project Notes\n' +
          '<!-- BEGIN MANUAL SECTION: Project Notes -->\n' +
          `${manualSections['Project Notes']}\n` +
          '<!-- END MANUAL SECTION: Project Notes -->\n\n';

        mergedContent = beforePattern + projectNotesSection + afterPattern;
      }
    }

    if (manualSections['Custom Commands']) {
      // Insert custom commands after Commands & Workflows
      const insertPoint = mergedContent.indexOf('## Session Continuation');
      if (insertPoint !== -1) {
        const beforeContinuation = mergedContent.substring(0, insertPoint);
        const afterContinuation = mergedContent.substring(insertPoint);

        const customCommandsSection = '### Custom Commands\n' +
          '<!-- BEGIN MANUAL SECTION: Custom Commands -->\n' +
          `${manualSections['Custom Commands']}\n` +
          '<!-- END MANUAL SECTION: Custom Commands -->\n\n';

        mergedContent = beforeContinuation + customCommandsSection + afterContinuation;
      }
    }

    // Add any other manual sections at the end
    const handledSections = ['Project Notes', 'Custom Commands'];
    const otherSections = Object.keys(manualSections).filter(name => !handledSections.includes(name));

    if (otherSections.length > 0) {
      mergedContent += '\n\n## Manual Sections\n';
      otherSections.forEach(sectionName => {
        mergedContent += `\n### ${sectionName}\n` +
          `<!-- BEGIN MANUAL SECTION: ${sectionName} -->\n` +
          `${manualSections[sectionName]}\n` +
          `<!-- END MANUAL SECTION: ${sectionName} -->\n`;
      });
    }

    return mergedContent;
  }

  createClaudeBackup(content) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.claudeDir, 'backups', `CLAUDE-${timestamp}.md`);

    // Ensure backup directory exists
    const backupDir = path.dirname(backupFile);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    fs.writeFileSync(backupFile, content);

    // Clean old CLAUDE.md backups (keep last 5)
    this.cleanClaudeBackups();
  }

  cleanClaudeBackups() {
    const backupsDir = path.join(this.claudeDir, 'backups');
    if (!fs.existsSync(backupsDir)) return;

    const claudeBackups = fs.readdirSync(backupsDir)
      .filter(file => file.startsWith('CLAUDE-') && file.endsWith('.md'))
      .map(file => ({
        name: file,
        path: path.join(backupsDir, file),
        mtime: fs.statSync(path.join(backupsDir, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime);

    // Keep only the 5 most recent CLAUDE.md backups
    if (claudeBackups.length > 5) {
      claudeBackups.slice(5).forEach(backup => {
        fs.unlinkSync(backup.path);
      });
    }
  }

  generateContextFiles() {
    const contextDir = path.join(this.claudeDir, 'context');

    try {
      // Generate knowledge.md
      const knowledgeContent = this.generateKnowledgeContext();
      fs.writeFileSync(path.join(contextDir, 'knowledge.md'), knowledgeContent);

      // Generate patterns.md
      const patternsContent = this.generatePatternsContext();
      fs.writeFileSync(path.join(contextDir, 'patterns.md'), patternsContent);

      // Generate decisions.md
      const decisionsContent = this.generateDecisionsContext();
      fs.writeFileSync(path.join(contextDir, 'decisions.md'), decisionsContent);

      // Generate tasks.md
      const tasksContent = this.generateTasksContext();
      fs.writeFileSync(path.join(contextDir, 'tasks.md'), tasksContent);
    } catch (error) {
      console.error('Error generating context files:', error);
    }
  }

  generateKnowledgeContext() {
    const categories = Object.keys(this.knowledge || {}).sort();
    const totalItems = categories.reduce((sum, cat) => sum + Object.keys(this.knowledge[cat] || {}).length, 0);

    let content = `# Project Knowledge Base
*Generated: ${new Date().toISOString()} | ${totalItems} items across ${categories.length} categories*

## Navigation
${categories.map(cat => `- [${cat}](#${cat}) (${Object.keys(this.knowledge[cat] || {}).length} items)`).join('\n')}

`;

    categories.forEach(category => {
      const items = this.knowledge[category] || {};
      const sortedKeys = Object.keys(items).sort();

      content += `## ${category}\n`;
      sortedKeys.forEach(key => {
        const item = items[key];
        content += `### ${key}\n`;
        content += `**Value**: ${item.value}\n`;
        if (item.context) content += `**Context**: ${item.context}\n`;
        content += `**Updated**: ${item.lastUpdated || 'Unknown'}\n`;
        if (item.references) content += `**References**: ${item.references.join(', ')}\n`;
        content += '\n';
      });
    });

    return content;
  }

  generatePatternsContext() {
    const openPatterns = this.patterns.filter(p => p.status === 'open');
    const resolvedPatterns = this.patterns.filter(p => p.status === 'resolved');

    let content = `# Project Patterns
*Generated: ${new Date().toISOString()} | ${this.patterns.length} total patterns*

## Summary
- Open Patterns: ${openPatterns.length}
- Resolved Patterns: ${resolvedPatterns.length}

## Open Patterns
`;

    const priorityOrder = ['critical', 'high', 'medium', 'low'];
    priorityOrder.forEach(priority => {
      const patterns = openPatterns.filter(p => p.priority === priority);
      if (patterns.length > 0) {
        content += `### ${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority\n`;
        patterns.forEach(p => {
          content += `#### ${p.pattern} (ID: ${p.id})\n`;
          content += `- **Description**: ${p.description}\n`;
          content += `- **Effectiveness**: ${p.effectiveness}\n`;
          content += `- **First Seen**: ${p.firstSeen}\n`;
          content += `- **Last Seen**: ${p.lastSeen}\n`;
          content += `- **Frequency**: ${p.frequency}\n\n`;
        });
      }
    });

    content += '## Resolved Patterns\n';
    resolvedPatterns.slice(-10).reverse().forEach(p => {
      content += `### ${p.pattern} (ID: ${p.id})\n`;
      content += `- **Solution**: ${p.solution || 'No solution recorded'}\n`;
      content += `- **Resolved**: ${p.resolvedAt || 'Unknown'}\n\n`;
    });

    return content;
  }

  generateDecisionsContext() {
    let content = `# Decision Log
*Generated: ${new Date().toISOString()} | ${this.decisions.length} total decisions*

## Recent Decisions
`;

    this.decisions.slice(-50).reverse().forEach(d => {
      content += `### ${new Date(d.timestamp).toLocaleDateString()}: ${d.decision}\n`;
      content += `**ID**: ${d.id}\n`;
      content += `**Reasoning**: ${d.reasoning}\n`;
      content += `**Alternatives Considered**: ${d.alternatives.join(', ')}\n`;
      if (d.outcome) content += `**Outcome**: ${d.outcome}\n`;
      content += `**Session**: ${d.sessionId || 'Unknown'}\n\n`;
    });

    return content;
  }

  generateTasksContext() {
    const openTasks = this.getTasks('open');
    const inProgressTasks = this.getTasks('in-progress');
    const completedTasks = this.getTasks('completed');

    let content = `# Task Management
*Generated: ${new Date().toISOString()} | ${this.tasks.length} total tasks*

## Summary
- Open: ${openTasks.length}
- In Progress: ${inProgressTasks.length}
- Completed: ${completedTasks.length}

## Open Tasks
`;

    ['high', 'medium', 'low'].forEach(priority => {
      const tasks = openTasks.filter(t => t.priority === priority);
      if (tasks.length > 0) {
        content += `### ${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority\n`;
        tasks.forEach(t => {
          content += `- [ ] **${t.description}** (ID: ${t.id})\n`;
          if (t.assignee) content += `  - Assigned: ${t.assignee}\n`;
          content += `  - Created: ${new Date(t.createdAt).toLocaleDateString()}\n`;
        });
        content += '\n';
      }
    });

    content += '## In Progress\n';
    inProgressTasks.forEach(t => {
      content += `- [~] **${t.description}** (ID: ${t.id})\n`;
      content += `  - Priority: ${t.priority}\n`;
      if (t.assignee) content += `  - Assigned: ${t.assignee}\n`;
    });

    content += '\n## Recently Completed\n';
    completedTasks.slice(-20).reverse().forEach(t => {
      content += `- [x] **${t.description}** (ID: ${t.id})\n`;
      content += `  - Completed: ${new Date(t.completedAt).toLocaleDateString()}\n`;
      if (t.outcome) content += `  - Outcome: ${t.outcome}\n`;
    });

    return content;
  }

  generateClaudeContent() {
    // Token optimization: reduce content when enabled
    const isOptimized = this.config.tokenOptimization !== false;

    const recentDecisions = this.getRecentDecisions(isOptimized ? 3 : 5);
    const openPatterns = this.patterns.filter(p => p.status === 'open').slice(0, isOptimized ? 3 : 5);
    const recentlyResolved = this.patterns.filter(p => p.status === 'resolved').slice(isOptimized ? -2 : -3);
    const activeTasks = this.getTasks('open').slice(0, isOptimized ? 5 : 10);
    const inProgressTasks = this.getTasks('in-progress').slice(0, isOptimized ? 3 : 5);
    const recentlyCompleted = this.getTasks('completed').slice(isOptimized ? -2 : -3);

    // Only show high-priority patterns when optimized
    const criticalPatterns = openPatterns.filter(p => p.priority === 'critical');
    const highPatterns = isOptimized ? [] : openPatterns.filter(p => p.priority === 'high');
    const mediumPatterns = isOptimized ? [] : openPatterns.filter(p => p.priority === 'medium');

    return `# Claude Project Memory

## Active Session
- **Current**: ${this.currentSession?.name || 'No active session'}
- **Started**: ${new Date().toISOString().split('T')[0]}
- **Project**: ${this.metadata.projectName}

## Key Project Knowledge

### Critical Information
- **Project Name**: ${this.metadata.projectName}
- **Claude Memory**: v${this.metadata.version}
- **Memory Created**: ${this.metadata.created?.split('T')[0]}

### Knowledge Base
${Object.keys(this.knowledge).length > 0
    ? Object.entries(this.knowledge).map(([category, items]) => {
      const itemCount = Object.keys(items).length;
      const sampleItems = Object.entries(items).slice(0, isOptimized ? 2 : 3);
      return `#### ${category} (${itemCount} items)
${sampleItems.map(([key, data]) => {
    // Show full value unless token optimization is on
    const displayValue = isOptimized && data.value.length > 80
      ? data.value.substring(0, 80) + '...'
      : data.value;
    return `- **${key}**: ${displayValue}`;
  }).join('\n')}${itemCount > sampleItems.length ? `\n- ... and ${itemCount - sampleItems.length} more items` : ''}`;
    }).join('\n\n') + '\n'
    : '- No knowledge stored yet\n'}

### Open Patterns
${criticalPatterns.length
    ? `#### Critical Priority
${criticalPatterns.map(p =>
    `- **${p.pattern}**: ${p.description}${p.effectiveness ? ` (effectiveness: ${p.effectiveness})` : ''}`
  ).join('\n')}\n`
    : ''}${highPatterns.length
  ? `#### High Priority
${highPatterns.map(p =>
    `- **${p.pattern}**: ${p.description}${p.effectiveness ? ` (effectiveness: ${p.effectiveness})` : ''}`
  ).join('\n')}\n`
  : ''}${mediumPatterns.length
  ? `#### Medium Priority
${mediumPatterns.map(p =>
    `- **${p.pattern}**: ${p.description}${p.effectiveness ? ` (effectiveness: ${p.effectiveness})` : ''}`
  ).join('\n')}\n`
  : ''}

${recentlyResolved.length
    ? `### Recently Resolved
${recentlyResolved.map(p =>
    `- **${p.pattern}**: ${p.solution} (${p.resolvedAt?.split('T')[0]})`
  ).join('\n')}\n`
    : ''}
### Project Conventions
<!-- Discovered during development -->

## Task Management

### Active Tasks
${activeTasks.length
    ? activeTasks.map(t =>
      `- [ ] **${t.description}** (${t.priority}${t.dueDate ? `, due: ${t.dueDate}` : ''}${
        t.assignee ? `, assigned: ${t.assignee}` : ''})`
    ).join('\n')
    : '- No active tasks'}

### In Progress
${inProgressTasks.length
    ? inProgressTasks.map(t =>
      `- 🔄 **${t.description}** (${t.priority}${t.assignee ? `, assigned: ${t.assignee}` : ''})`
    ).join('\n')
    : '- No tasks in progress'}

${recentlyCompleted.length
    ? `### Recently Completed
${recentlyCompleted.map(t =>
    `- [x] **${t.description}** (completed: ${t.completedAt?.split('T')[0]})`
  ).join('\n')}\n`
    : ''}
## Recent Decisions Log
${recentDecisions.map(d => `
### ${d.timestamp.split('T')[0]}: ${d.decision}
**Decision**: ${d.decision}
**Reasoning**: ${d.reasoning}
${d.alternatives.length ? `**Alternatives Considered**: ${d.alternatives.join(', ')}` : ''}
`).join('\n')}

## Commands & Workflows

### Claude Memory Commands
\`\`\`bash
# Session management
claude-memory session start "Session Name"
claude-memory session end ["outcome"]
claude-memory session cleanup

# Task management
claude-memory task add "description" [--priority high|medium|low] [--assignee name]
claude-memory task complete <task-id>
claude-memory task list [status]

# Pattern management
claude-memory pattern add "Pattern" "Description" [--effectiveness 0.8] [--priority high]
claude-memory pattern list [--priority high]
claude-memory pattern search "query"
claude-memory pattern resolve <pattern-id> "solution"

# Decision tracking
claude-memory decision "Choice" "Reasoning" "alternatives"

# Knowledge management
claude-memory knowledge add "key" "value" --category category
claude-memory knowledge get "key" [category]
claude-memory knowledge list [category]

# Memory utilities
claude-memory stats
claude-memory search "query"
\`\`\`

## Full Context Files
For complete information without truncation:
- 📚 **Knowledge Base**: \`.claude/context/knowledge.md\` (${
  Object.keys(this.knowledge).reduce((sum, cat) => sum + Object.keys(this.knowledge[cat] || {}).length, 0)
} items)
- 🧩 **All Patterns**: \`.claude/context/patterns.md\` (${this.patterns.length} patterns)
- 🎯 **Decision Log**: \`.claude/context/decisions.md\` (${this.decisions.length} decisions)
- ✅ **Task Details**: \`.claude/context/tasks.md\` (${this.tasks.length} tasks)

## Session Continuation
To resume work, tell Claude:
"Load project memory for ${this.metadata.projectName} and continue development"
`;
  }

  generateSessionId(sessionName) {
    const date = new Date().toISOString().split('T')[0];
    const slug = sessionName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    return `${date}-${slug}`;
  }

  generateId() {
    return createHash('md5').update(Date.now().toString() + Math.random().toString()).digest('hex').substring(0, 8);
  }
}