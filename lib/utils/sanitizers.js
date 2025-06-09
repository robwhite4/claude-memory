/**
 * Input sanitization utilities for Claude Memory
 */

export function sanitizeInput(input, maxLength = 1000) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Remove potential HTML/script tags
    .replace(/\.\./g, '') // Remove path traversal attempts
    .slice(0, maxLength)
    .trim();
}

export function sanitizeDescription(description, maxLength = 500) {
  if (!description || typeof description !== 'string') {
    throw new Error('Description is required and must be a string');
  }

  const sanitized = sanitizeInput(description, maxLength);
  if (sanitized.length === 0) {
    throw new Error('Description cannot be empty after sanitization');
  }

  return sanitized;
}

export function sanitizeMultiline(text, maxLength = 5000) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/[<>]/g, '') // Remove potential HTML/script tags
    .slice(0, maxLength)
    .trim();
}