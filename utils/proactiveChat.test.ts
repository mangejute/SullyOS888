import { describe, expect, it, beforeEach } from 'vitest';
import { isWithinProactiveQuietHours } from './proactiveChat';

describe('小雨手机 3.0 本地主动消息规则', () => {
  beforeEach(() => localStorage.clear());

  it('支持跨午夜勿扰时段', () => {
    const quiet = { enabled: true, start: '23:00', end: '08:00' };
    expect(isWithinProactiveQuietHours(new Date(2026, 7, 18, 23, 30), quiet)).toBe(true);
    expect(isWithinProactiveQuietHours(new Date(2026, 7, 19, 7, 59), quiet)).toBe(true);
    expect(isWithinProactiveQuietHours(new Date(2026, 7, 19, 8, 0), quiet)).toBe(false);
    expect(isWithinProactiveQuietHours(new Date(2026, 7, 19, 12, 0), quiet)).toBe(false);
  });

});
