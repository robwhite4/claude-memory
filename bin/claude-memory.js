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
import { createHash } from 'crypto';

// Input validation utilities
function sanitizeInput(input, maxLength = 1000) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Remove potential HTML/script tags
    .replace(/\.\./g, '') // Remove path traversal attempts
    .slice(0, maxLength)
    .trim();
}

function validatePath(inputPath) {
  if (!inputPath) return process.cwd();

  // Resolve and normalize the path
  const resolvedPath = path.resolve(inputPath);

  // Ensure it doesn't contain path traversal
  if (resolvedPath.includes('..')) {
    throw new Error('Invalid path: path traversal not allowed');
  }

  return resolvedPath;
}

function sanitizeDescription(description, maxLength = 500) {
  if (!description || typeof description !== 'string') {
    throw new Error('Description is required and must be a string');
  }

  const sanitized = sanitizeInput(description, maxLength);
  if (sanitized.length === 0) {
    throw new Error('Description cannot be empty after sanitization');
  }

  return sanitized;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');

// Load package.json for version info
const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));

// Memory system implementation
class ClaudeMemory {
  constructor(projectRoot, projectName = 'My Project', options = {}) {
    this.projectRoot = projectRoot;
    this.projectName = projectName;
    this.claudeDir = path.join(projectRoot, '.claude');
    this.memoryFile = path.join(this.claudeDir, 'memory.json');
    this.configFile = path.join(this.claudeDir, 'config.json');
    this.claudeFile = path.join(projectRoot, 'CLAUDE.md');
    this.currentSession = null;
    this.options = options;

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
    
    content += `## Resolved Patterns\n`;
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
    
    content += `## In Progress\n`;
    inProgressTasks.forEach(t => {
      content += `- [~] **${t.description}** (ID: ${t.id})\n`;
      content += `  - Priority: ${t.priority}\n`;
      if (t.assignee) content += `  - Assigned: ${t.assignee}\n`;
    });
    
    content += `\n## Recently Completed\n`;
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
- 📚 **Knowledge Base**: \`.claude/context/knowledge.md\` (${Object.keys(this.knowledge).reduce((sum, cat) => sum + Object.keys(this.knowledge[cat] || {}).length, 0)} items)
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

    console.log('🧠 Initializing Claude Memory...');
    console.log(`📁 Project: ${projectName}`);
    console.log(`📂 Path: ${projectPath}`);

    // Ensure project directory exists
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }

    process.chdir(projectPath);

    // Initialize memory system
    const memory = new ClaudeMemory(projectPath, projectName);
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
    this.updateGitignore(projectPath);

    // Update package.json if it exists
    this.updatePackageJson(projectPath);

    console.log('✅ Claude Memory initialized!');
    console.log(`📋 Session ID: ${sessionId}`);
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('1. Tell Claude: "Load project memory and continue development"');
    console.log('2. Start any conversation with memory-aware context');
    console.log('3. Watch Claude learn and remember your project');
    console.log('');
    console.log('📖 See CLAUDE.md for project memory overview');
    console.log('💡 Use "claude-memory stats" to view memory statistics');
  },

  async stats(projectPath) {
    // Use current directory if no path provided
    const targetPath = projectPath || process.cwd();

    try {
      const memory = new ClaudeMemory(targetPath);
      const stats = memory.getMemoryStats();

      console.log('\n📊 Claude Memory Statistics\n');
      console.log(`Sessions: ${stats.sessions}`);
      console.log(`Decisions: ${stats.decisions}`);
      console.log(`Patterns: ${stats.patterns}`);
      console.log(`Tasks: ${stats.tasks}`);
      console.log(`Actions: ${stats.actions}`);
      console.log(`Knowledge Items: ${stats.totalKnowledgeItems} (${stats.knowledgeCategories} categories)`);

      const recentSessions = memory.getSessionHistory(3);
      if (recentSessions.length > 0) {
        console.log('\n🕒 Recent Sessions:');
        recentSessions.forEach(s => {
          console.log(`  • ${s.name} (${s.startTime.split('T')[0]})`);
        });
      }

      const recentDecisions = memory.getRecentDecisions(3);
      if (recentDecisions.length > 0) {
        console.log('\n🤔 Recent Decisions:');
        recentDecisions.forEach(d => {
          console.log(`  • ${d.decision}`);
        });
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
    let outputFormat = 'text';
    let typeFilter = null;
    let limit = null;

    // Parse arguments and flags
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === '--json') {
        outputFormat = 'json';
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

      const memory = new ClaudeMemory(validatedPath);
      const alternativesArray = alternatives
        ? alternatives.split(',').map(s => sanitizeInput(s.trim(), 100)).filter(s => s.length > 0)
        : [];

      const id = memory.recordDecision(sanitizedDecision, sanitizedReasoning, alternativesArray);

      console.log(`✅ Decision recorded: ${sanitizedDecision}`);
      console.log(`📋 Decision ID: ${id}`);
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

QUICK START:
  📁 claude-memory init "My Project"     Initialize memory in current directory
  ✅ claude-memory task add "My task"    Add your first task  
  ❓ claude-memory help <command>        Get detailed help for any command

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

GET DETAILED HELP:
  claude-memory help task               📝 Task management commands and workflows
  claude-memory help pattern            🧩 Pattern management and resolution  
  claude-memory help knowledge          💡 Knowledge storage and retrieval
  claude-memory help session            📚 Session tracking and context management
  claude-memory help search             🔍 Advanced search and filtering options
  claude-memory help examples           📚 Common usage patterns and workflows

SUBCOMMANDS:
  pattern add "name" "desc" [score] [priority]    Learn patterns
  pattern resolve <pattern-id> "solution"         Resolve patterns
  task add "description" [options]                Add new tasks
  session cleanup                                 End all sessions

QUICK EXAMPLES:
  claude-memory task add "Setup CI/CD" --priority high
  claude-memory decision "Use React" "Better ecosystem than Vue"
  claude-memory knowledge add "API_URL" "https://api.myapp.com" --category config
  claude-memory search "authentication" --type decisions

💡 Tip: Use 'claude-memory help <command>' for detailed command-specific help
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
          'claude-memory task add "Implement authentication" --priority high',
          'claude-memory task add "Write tests" --assignee "developer" --due "2024-01-15"',
          'claude-memory task complete abc123 "Successfully implemented with JWT"',
          'claude-memory task list open',
          'claude-memory task list completed'
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
          'claude-memory pattern add "Security First" "Always validate input" 0.9 high',
          'claude-memory pattern add "Test Early" "Write tests before implementation"',
          'claude-memory pattern list --priority high',
          'claude-memory pattern search "security"',
          'claude-memory pattern resolve def456 "Added input validation middleware"'
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
          'claude-memory knowledge add "API_KEY" "sk-abc123..." --category config',
          'claude-memory knowledge add "Database_URL" "postgresql://..." --category config',
          'claude-memory knowledge add "Team_Lead" "Alice Johnson" --category contacts',
          'claude-memory knowledge get "API_KEY"',
          'claude-memory knowledge list config',
          'claude-memory knowledge delete "OLD_API_KEY" config'
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
          'claude-memory session start "Feature Development"',
          'claude-memory session start "Bug Fix" \'{"ticket": "BUG-123"}\'',
          'claude-memory session end "Feature completed successfully"',
          'claude-memory session end 2024-01-01-feature-dev "Paused for review"',
          'claude-memory session list',
          'claude-memory session cleanup'
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
          'claude-memory search "authentication"',
          'claude-memory search "config" --type knowledge',
          'claude-memory search "bug" --json --limit 3',
          'claude-memory search "database" --type decisions --json',
          'claude-memory search "API" --limit 5'
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
            'claude-memory init "My Web App"',
            'claude-memory task add "Setup development environment" --priority high',
            'claude-memory knowledge add "Repository" "https://github.com/user/repo" --category links',
            'claude-memory session start "Initial Setup"'
          ],
          '🔧 Daily Development Workflow': [
            'claude-memory session start "Feature: User Auth"',
            'claude-memory task add "Implement login form" --priority high',
            'claude-memory decision "Use JWT tokens" "Better security and stateless"',
            'claude-memory pattern add "Input Validation" "Always validate on both client and server"',
            'claude-memory task complete abc123 "Login form completed with validation"'
          ],
          '🐛 Bug Fixing Session': [
            'claude-memory session start "Bug Fix: Login Issue"',
            'claude-memory search "login" --type decisions',
            'claude-memory pattern search "auth"',
            'claude-memory decision "Add rate limiting" "Prevents brute force attacks"',
            'claude-memory session end "Fixed login rate limiting issue"'
          ],
          '🤖 AI Assistant Handoff': [
            'claude-memory handoff --include=tasks',
            'claude-memory search "current project" --limit 5',
            'claude-memory stats',
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
  
Usage: claude-memory help <topic>`);
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

    console.log(`For general help: claude-memory help
For other topics: claude-memory help <topic>`);
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
const [,, command, ...args] = process.argv;

// Handle help flags
if (!command || command === 'help' || command === '--help' || command === '-h') {
  commands.help(args[0]);
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
  await commands[command](...args);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
