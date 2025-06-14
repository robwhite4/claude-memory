/**
 * JSON Schema definitions for claude-memory import/export operations
 * These schemas are shared between bulk operations and export features
 */

// Task schema for import/export
const taskSchema = {
  type: 'object',
  required: ['description'],
  properties: {
    id: { type: 'string' },
    description: { type: 'string' },
    status: { 
      type: 'string',
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending'
    },
    priority: { 
      type: 'string',
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    assignee: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    completedAt: { type: 'string', format: 'date-time' }
  }
};

// Pattern schema for import/export
const patternSchema = {
  type: 'object',
  required: ['pattern', 'description'],
  properties: {
    id: { type: 'string' },
    pattern: { type: 'string' },
    description: { type: 'string' },
    category: { type: 'string' },
    effectiveness: { type: 'number', minimum: 0, maximum: 1 },
    priority: { 
      type: 'string',
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    status: {
      type: 'string',
      enum: ['active', 'resolved', 'paused'],
      default: 'active'
    },
    solution: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    resolvedAt: { type: 'string', format: 'date-time' }
  }
};

// Decision schema for import/export
const decisionSchema = {
  type: 'object',
  required: ['decision', 'reasoning'],
  properties: {
    id: { type: 'string' },
    decision: { type: 'string' },
    reasoning: { type: 'string' },
    alternatives: { type: 'string' },
    timestamp: { type: 'string', format: 'date-time' }
  }
};

// Knowledge schema for import/export
const knowledgeSchema = {
  type: 'object',
  required: ['key', 'value', 'category'],
  properties: {
    key: { type: 'string' },
    value: { type: 'string' },
    category: { type: 'string' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

// Session schema for import/export
const sessionSchema = {
  type: 'object',
  required: ['name'],
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    startTime: { type: 'string', format: 'date-time' },
    endTime: { type: 'string', format: 'date-time' },
    outcome: { type: 'string' },
    patterns: { type: 'array', items: { type: 'string' } },
    decisions: { type: 'array', items: { type: 'string' } },
    tasks: { type: 'array', items: { type: 'string' } }
  }
};

// Full export schema (all data)
const fullExportSchema = {
  type: 'object',
  required: ['version', 'exportedAt'],
  properties: {
    version: { type: 'string' },
    exportedAt: { type: 'string', format: 'date-time' },
    tasks: { type: 'array', items: taskSchema },
    patterns: { type: 'array', items: patternSchema },
    decisions: { type: 'array', items: decisionSchema },
    knowledge: { type: 'array', items: knowledgeSchema },
    sessions: { type: 'array', items: sessionSchema }
  }
};

// Bulk task import schema
const bulkTaskImportSchema = {
  type: 'object',
  required: ['tasks'],
  properties: {
    tasks: { 
      type: 'array', 
      items: taskSchema,
      minItems: 1
    }
  }
};

// Report configuration schema
const reportConfigSchema = {
  type: 'object',
  properties: {
    type: { 
      type: 'string',
      enum: ['summary', 'detailed', 'tasks', 'patterns', 'timeline'],
      default: 'summary'
    },
    dateRange: {
      type: 'object',
      properties: {
        from: { type: 'string', format: 'date-time' },
        to: { type: 'string', format: 'date-time' }
      }
    },
    includeCompleted: { type: 'boolean', default: true },
    includePending: { type: 'boolean', default: true },
    groupBy: {
      type: 'string',
      enum: ['status', 'priority', 'assignee', 'date']
    }
  }
};

module.exports = {
  taskSchema,
  patternSchema,
  decisionSchema,
  knowledgeSchema,
  sessionSchema,
  fullExportSchema,
  bulkTaskImportSchema,
  reportConfigSchema
};