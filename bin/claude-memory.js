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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');

// Load package.json for version info
const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));

// Memory system implementation
class ClaudeMemory {
  constructor(projectRoot, projectName = 'My Project') {
    this.projectRoot = projectRoot;
    this.projectName = projectName;
    this.claudeDir = path.join(projectRoot, '.claude');
    this.memoryFile = path.join(this.claudeDir, 'memory.json');
    this.claudeFile = path.join(projectRoot, 'CLAUDE.md');
    this.currentSession = null;
    
    this.ensureDirectories();
    this.loadMemory();
  }

  ensureDirectories() {
    [this.claudeDir, path.join(this.claudeDir, 'sessions'), path.join(this.claudeDir, 'backups')].forEach(dir => {
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
        created: new Date().toISOString(),
        version: packageJson.version,
        projectName: this.projectName
      };
      fs.writeFileSync(this.memoryFile, JSON.stringify(initialMemory, null, 2));
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
      this.metadata = {
        created: data.created,
        version: data.version,
        projectName: data.projectName || this.projectName
      };
    } catch (error) {
      this.sessions = [];
      this.decisions = [];
      this.patterns = [];
      this.actions = [];
      this.knowledge = {};
      this.metadata = {
        created: new Date().toISOString(),
        version: packageJson.version,
        projectName: this.projectName
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
      created: this.metadata.created,
      version: this.metadata.version,
      projectName: this.metadata.projectName,
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(this.memoryFile, JSON.stringify(data, null, 2));
  }

  startSession(sessionName, context = {}) {
    const sessionId = this.generateSessionId(sessionName);
    
    this.currentSession = {
      id: sessionId,
      name: sessionName,
      startTime: new Date().toISOString(),
      context: context,
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
      this.saveMemory();
      this.recordAction('session_ended', { outcome });
    }
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

  learnPattern(pattern, description, context = '', frequency = 1, effectiveness = null) {
    const existingPattern = this.patterns.find(p => p.pattern === pattern);
    
    if (existingPattern) {
      existingPattern.frequency += frequency;
      existingPattern.lastSeen = new Date().toISOString();
      if (effectiveness !== null) {
        existingPattern.effectiveness = effectiveness;
      }
    } else {
      this.patterns.push({
        id: this.generateId(),
        pattern,
        description,
        frequency,
        effectiveness,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString()
      });
    }

    this.saveMemory();
    this.updateClaudeFile();
    this.recordAction('pattern_learned', { pattern, description });
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
    this.recordAction('knowledge_stored', { key, category, value });
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
    this.saveMemory();
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
  }

  exportMemory() {
    return {
      sessions: this.sessions,
      decisions: this.decisions,
      patterns: this.patterns,
      actions: this.actions,
      knowledge: this.knowledge,
      metadata: this.metadata,
      exportedAt: new Date().toISOString()
    };
  }

  updateClaudeFile() {
    const content = this.generateClaudeContent();
    fs.writeFileSync(this.claudeFile, content);
  }

  generateClaudeContent() {
    const recentDecisions = this.getRecentDecisions(5);
    const topPatterns = this.patterns.slice(0, 5);
    
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

### Learned Patterns
${topPatterns.map(p => `- **${p.pattern}**: ${p.description}${p.effectiveness ? ` (effectiveness: ${p.effectiveness})` : ''}`).join('\n')}

### Project Conventions
<!-- Discovered during development -->

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
# View memory statistics
claude-memory stats

# Search memory
claude-memory search "query"

# Record decision
claude-memory decision "Choice" "Reasoning" "alternatives"

# Learn pattern
claude-memory pattern "Pattern" "Description"
\`\`\`

## Active TODOs
- [x] Install Claude Memory System
- [ ] Define project architecture
- [ ] Set up development workflow

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

  async stats(projectPath = process.cwd()) {
    try {
      const memory = new ClaudeMemory(projectPath);
      const stats = memory.getMemoryStats();
      
      console.log('\n📊 Claude Memory Statistics\n');
      console.log(`Sessions: ${stats.sessions}`);
      console.log(`Decisions: ${stats.decisions}`);
      console.log(`Patterns: ${stats.patterns}`);
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
      console.error('❌ Error reading memory:', error.message);
      console.log('💡 Try running: claude-memory init');
    }
  },

  async search(query, projectPath = process.cwd()) {
    if (!query) {
      console.error('❌ Search query required');
      console.log('Usage: claude-memory search "your query"');
      return;
    }
    
    try {
      const memory = new ClaudeMemory(projectPath);
      const results = memory.searchMemory(query);
      
      console.log(`\n🔍 Search results for: "${query}"\n`);
      
      if (results.decisions.length > 0) {
        console.log('📋 Decisions:');
        results.decisions.forEach(d => {
          console.log(`  • ${d.decision} (${d.timestamp.split('T')[0]})`);
          console.log(`    ${d.reasoning}`);
        });
        console.log();
      }
      
      if (results.patterns.length > 0) {
        console.log('🧩 Patterns:');
        results.patterns.forEach(p => {
          console.log(`  • ${p.pattern}: ${p.description}`);
        });
        console.log();
      }
      
      if (results.knowledge.length > 0) {
        console.log('💡 Knowledge:');
        results.knowledge.forEach(k => {
          console.log(`  • [${k.category}] ${k.key}: ${k.value}`);
        });
        console.log();
      }
      
      if (results.decisions.length === 0 && results.patterns.length === 0 && results.knowledge.length === 0) {
        console.log('No results found.');
      }
    } catch (error) {
      console.error('❌ Error searching memory:', error.message);
    }
  },

  async decision(decision, reasoning, alternatives = '', projectPath = process.cwd()) {
    if (!decision || !reasoning) {
      console.error('❌ Decision and reasoning required');
      console.log('Usage: claude-memory decision "Decision text" "Reasoning" "alt1,alt2"');
      return;
    }
    
    try {
      const memory = new ClaudeMemory(projectPath);
      const alternativesArray = alternatives ? alternatives.split(',').map(s => s.trim()) : [];
      const id = memory.recordDecision(decision, reasoning, alternativesArray);
      
      console.log(`✅ Decision recorded: ${decision}`);
      console.log(`📋 Decision ID: ${id}`);
    } catch (error) {
      console.error('❌ Error recording decision:', error.message);
    }
  },

  async pattern(pattern, description, effectiveness = null, projectPath = process.cwd()) {
    if (!pattern || !description) {
      console.error('❌ Pattern and description required');
      console.log('Usage: claude-memory pattern "Pattern name" "Description" [effectiveness 0-1]');
      return;
    }
    
    try {
      const memory = new ClaudeMemory(projectPath);
      const effectivenessScore = effectiveness ? parseFloat(effectiveness) : null;
      memory.learnPattern(pattern, description, '', 1, effectivenessScore);
      
      console.log(`✅ Pattern learned: ${pattern}`);
      console.log(`📝 Description: ${description}`);
    } catch (error) {
      console.error('❌ Error learning pattern:', error.message);
    }
  },

  async backup(projectPath = process.cwd()) {
    try {
      const memory = new ClaudeMemory(projectPath);
      memory.backup();
      console.log('✅ Memory backed up');
    } catch (error) {
      console.error('❌ Error backing up memory:', error.message);
    }
  },

  async export(filename, projectPath = process.cwd()) {
    try {
      const memory = new ClaudeMemory(projectPath);
      const data = memory.exportMemory();
      const exportFile = filename || `claude-memory-export-${new Date().toISOString().split('T')[0]}.json`;
      
      fs.writeFileSync(exportFile, JSON.stringify(data, null, 2));
      console.log(`✅ Memory exported to: ${exportFile}`);
      console.log(`📊 Exported ${Object.keys(data).length - 1} data categories`);
    } catch (error) {
      console.error('❌ Error exporting memory:', error.message);
    }
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
      const outcome = args[0] || 'Session completed';
      
      try {
        const memory = new ClaudeMemory(projectPath);
        memory.endSession(outcome);
        console.log(`✅ Session ended: ${outcome}`);
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
      
    } else {
      console.error('❌ Session action must be: start, end, or list');
    }
  },

  help() {
    console.log(`
🧠 Claude Memory v${packageJson.version}

INSTALLATION:
  npm install -g claude-memory
  
COMMANDS:
  init ["Project Name"] [path]           Initialize memory in project
  stats [path]                          Show memory statistics
  search "query" [path]                 Search memory
  decision "text" "reasoning" [alts]    Record a decision
  pattern "name" "description" [score]  Learn a pattern
  backup [path]                         Backup memory
  export [filename] [path]              Export memory to JSON
  session start "name" [context]       Start session
  session end ["outcome"]               End session  
  session list                          List sessions
  help                                  Show this help

USAGE PATTERN:
  Tell Claude: "Load project memory and continue [your task]"
  
  Claude will automatically:
  • Read your project context from CLAUDE.md
  • Apply learned patterns
  • Record new decisions and knowledge
  • Update living documentation

EXAMPLES:
  claude-memory init "My Web App"
  claude-memory decision "Use React" "Better ecosystem" "Vue,Angular"
  claude-memory pattern "Test locally first" "Prevents production issues" "0.9"
  claude-memory search "authentication"
  claude-memory session start "Feature Development"

Transform AI conversations from stateless Q&A into persistent project intelligence!

More info: https://github.com/robwhite4/claude-memory
`);
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
        if (!pkg.scripts['memory']) {
          pkg.scripts['memory'] = 'claude-memory';
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

if (!command || !commands[command]) {
  console.error('❌ Unknown command:', command || '(none)');
  commands.help();
  process.exit(1);
}

try {
  await commands[command](...args);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}