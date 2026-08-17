import { describe, expect, it, beforeEach } from 'vitest';
import {
  isWithinProactiveQuietHours,
  normalizeProactiveIntervalMinutes,
  PROACTIVE_MAX_INTERVAL_MINUTES,
  PROACTIVE_MIN_INTERVAL_MINUTES,
} from './proactiveChat';

describe('小雨手机 3.0 本地主动消息规则', () => {
  beforeEach(() => localStorage.clear());

  it('支持跨午夜勿扰时段', () => {
    const quiet = { enabled: true, start: '23:00', end: '08:00' };
    expect(isWithinProactiveQuietHours(new Date(2026, 7, 18, 23, 30), quiet)).toBe(true);
    expect(isWithinProactiveQuietHours(new Date(2026, 7, 19, 7, 59), quiet)).toBe(true);
    expect(isWithinProactiveQuietHours(new Date(2026, 7, 19, 8, 0), quiet)).toBe(false);
    expect(isWithinProactiveQuietHours(new Date(2026, 7, 19, 12, 0), quiet)).toBe(false);
  });

  it('允许 5 分钟起的任意整数分钟，并限制在一年内', () => {
    expect(normalizeProactiveIntervalMinutes(5)).toBe(PROACTIVE_MIN_INTERVAL_MINUTES);
    expect(normalizeProactiveIntervalMinutes(37)).toBe(37);
    expect(normalizeProactiveIntervalMinutes(2)).toBe(PROACTIVE_MIN_INTERVAL_MINUTES);
    expect(normalizeProactiveIntervalMinutes(PROACTIVE_MAX_INTERVAL_MINUTES + 1)).toBe(PROACTIVE_MAX_INTERVAL_MINUTES);
  });

});
