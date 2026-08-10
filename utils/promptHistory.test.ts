import { describe, expect, it } from 'vitest';
import { getPromptHistory, recordPromptHistory } from './promptHistory';

describe('提示词历史', () => {
    it('新一轮提示词会追加保存，不覆盖前一轮', async () => {
        const charId = `prompt-history-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        await recordPromptHistory(charId, 'schedule', '第一轮完整日程提示词');
        await recordPromptHistory(charId, 'schedule', '第二轮完整日程提示词');

        const entries = await getPromptHistory(charId, 'schedule');
        expect(entries).toHaveLength(2);
        expect(entries.map(item => item.content)).toEqual(expect.arrayContaining([
            '第一轮完整日程提示词',
            '第二轮完整日程提示词',
        ]));
    });
});
