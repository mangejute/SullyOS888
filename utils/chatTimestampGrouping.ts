/** 同一轮聊天只保留一个时间标志的窗口：三分钟以内（含三分钟）合并。 */
export const CHAT_TIMESTAMP_MERGE_WINDOW_MS = 3 * 60 * 1000;

export function isTimestampGroupBreak(
    currentTimestamp: number | null | undefined,
    adjacentTimestamp: number | null | undefined,
): boolean {
    if (!Number.isFinite(currentTimestamp) || !Number.isFinite(adjacentTimestamp)) return true;
    return Math.abs(currentTimestamp - adjacentTimestamp) > CHAT_TIMESTAMP_MERGE_WINDOW_MS;
}
