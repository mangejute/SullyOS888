import { describe, expect, it } from 'vitest';
import { CHAT_TIMESTAMP_MERGE_WINDOW_MS, isTimestampGroupBreak } from './chatTimestampGrouping';

describe('isTimestampGroupBreak', () => {
    const base = 1_700_000_000_000;

    it('同一时刻和三分钟以内的相邻消息共用一个时间标志', () => {
        expect(isTimestampGroupBreak(base, base)).toBe(false);
        expect(isTimestampGroupBreak(base + CHAT_TIMESTAMP_MERGE_WINDOW_MS, base)).toBe(false);
        expect(isTimestampGroupBreak(base - (CHAT_TIMESTAMP_MERGE_WINDOW_MS - 1), base)).toBe(false);
    });

    it('超过三分钟才开始新的时间标志', () => {
        expect(isTimestampGroupBreak(base + CHAT_TIMESTAMP_MERGE_WINDOW_MS + 1, base)).toBe(true);
    });

    it('首条或旧数据缺少时间时保守地保留时间标志', () => {
        expect(isTimestampGroupBreak(base, undefined)).toBe(true);
        expect(isTimestampGroupBreak(undefined, base)).toBe(true);
    });
});
