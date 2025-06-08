/**
 * Output formatting utilities for Claude Memory
 */

import yaml from 'js-yaml';

export function formatOutput(data, format = 'text') {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'yaml':
      return yaml.dump(data);
    case 'text':
    default:
      return data;
  }
}

export function formatTimestamp(date) {
  if (!date) return 'Never';
  const d = new Date(date);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

export function formatDuration(startTime, endTime) {
  if (!startTime) return 'Unknown duration';
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const duration = end - start;
  const hours = Math.floor(duration / 3600000);
  const minutes = Math.floor((duration % 3600000) / 60000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function formatMemorySize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatList(items, emptyMessage = 'No items found') {
  if (!items || items.length === 0) {
    return emptyMessage;
  }
  return items;
}

export function truncateText(text, maxLength = 80) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}