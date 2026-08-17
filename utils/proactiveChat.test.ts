import { describe, expect, it, beforeEach } from 'vitest';
import {
  getDailyProactiveSendCount,
  isWithinProactiveQuietHours,
  recordDailyProactiveSend,
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

  it('按本地日持久化真正发出的消息次数', () => {
    const morning = new Date(2026, 7, 18, 9, 0);
    recordDailyProactiveSend('char-a', morning);
    recordDailyProactiveSend('char-a', new Date(2026, 7, 18, 10, 0));
    expect(getDailyProactiveSendCount('char-a', morning)).toBe(2);
    expect(getDailyProactiveSendCount('char-a', new Date(2026, 7, 19, 9, 0))).toBe(0);
  });
});
