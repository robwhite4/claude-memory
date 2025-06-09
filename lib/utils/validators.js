/**
 * Input validation utilities for Claude Memory
 */

import path from 'path';

export function validatePath(inputPath) {
  if (!inputPath) return process.cwd();

  // Resolve and normalize the path
  const resolvedPath = path.resolve(inputPath);

  // Ensure it doesn't contain path traversal
  if (resolvedPath.includes('..')) {
    throw new Error('Invalid path: path traversal not allowed');
  }

  return resolvedPath;
}

export function validatePriority(priority) {
  const validPriorities = ['critical', 'high', 'medium', 'low'];
  if (!validPriorities.includes(priority)) {
    throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
  }
  return priority;
}

export function validateStatus(status) {
  const validStatuses = ['open', 'in_progress', 'completed'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }
  return status;
}

export function validateOutputFormat(format) {
  const validFormats = ['text', 'json', 'yaml'];
  if (!validFormats.includes(format)) {
    throw new Error(`Invalid output format. Must be one of: ${validFormats.join(', ')}`);
  }
  return format;
}