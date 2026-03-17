import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getInitials, formatRelativeTime } from './utils';

// ─── Case 1: getInitials ───────────────────────────────────────────────────────

describe('getInitials', () => {
  it('returns "?" for null or undefined', () => {
    expect(getInitials(null)).toBe('?');
    expect(getInitials(undefined)).toBe('?');
  });

  it('returns "?" for empty string', () => {
    expect(getInitials('')).toBe('?');
  });

  it('returns single uppercase letter for one-word name', () => {
    expect(getInitials('Alice')).toBe('A');
  });

  it('returns two initials for a full name', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('truncates to 2 chars for names with 3+ words', () => {
    expect(getInitials('Anna Maria Ivanova')).toBe('AM');
  });

  it('uppercases lowercase input', () => {
    expect(getInitials('jane doe')).toBe('JD');
  });
});

// ─── Case 2: formatRelativeTime ───────────────────────────────────────────────

describe('formatRelativeTime', () => {
  const NOW = new Date('2026-03-17T12:00:00.000Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for timestamps less than 1 minute ago', () => {
    const date = new Date(NOW.getTime() - 30_000); // 30 seconds ago
    expect(formatRelativeTime(date)).toBe('just now');
  });

  it('returns minutes for timestamps under 1 hour ago', () => {
    const date = new Date(NOW.getTime() - 45 * 60_000); // 45 minutes ago
    expect(formatRelativeTime(date)).toBe('45m ago');
  });

  it('returns hours for timestamps under 24 hours ago', () => {
    const date = new Date(NOW.getTime() - 5 * 3_600_000); // 5 hours ago
    expect(formatRelativeTime(date)).toBe('5h ago');
  });

  it('returns days for timestamps under 7 days ago', () => {
    const date = new Date(NOW.getTime() - 3 * 86_400_000); // 3 days ago
    expect(formatRelativeTime(date)).toBe('3d ago');
  });

  it('returns a formatted date for timestamps older than 7 days', () => {
    const date = new Date('2026-03-01T09:00:00.000Z'); // 16 days ago
    const result = formatRelativeTime(date);
    expect(result).toMatch(/Mar/);
    expect(result).toMatch(/2026/);
  });
});
