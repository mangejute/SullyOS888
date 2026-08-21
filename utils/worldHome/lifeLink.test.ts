import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CharacterProfile, WorldProfile } from '../../types';

vi.mock('../db', () => ({
    DB: {
        getWorlds: vi.fn(async () => []),
        saveWorld: vi.fn(),
    },
}));

import { DB } from '../db';
import { syncCityLifeToLinkedWorldPlan, worldLifeDayKey, worldSegmentForHour } from './lifeLink';

beforeEach(() => vi.clearAllMocks());

describe('家园生活联动的四段时间轴', () => {
    it('按凌晨、早上、中午、晚上划分全天', () => {
        expect(worldSegmentForHour(0)).toBe('latenight');
        expect(worldSegmentForHour(5)).toBe('latenight');
        expect(worldSegmentForHour(6)).toBe('morning');
        expect(worldSegmentForHour(11)).toBe('morning');
        expect(worldSegmentForHour(12)).toBe('noon');
        expect(worldSegmentForHour(17)).toBe('noon');
        expect(worldSegmentForHour(18)).toBe('evening');
        expect(worldSegmentForHour(23)).toBe('evening');
    });
});

describe('城市事件同步到已生成的家园计划', () => {
    it('把正在发生的暴雨和家园处置写入每个生活段，而不等待明天重新规划', async () => {
        const world = { id: 'world-1', name: '测试家园', lifeLinkEnabled: true, timeMode: 'real', memberIds: ['char-1'], lifePlan: { dayKey: '', generatedAt: 0, segments: ['morning', 'noon', 'evening', 'latenight'].map(key => ({ key, event: '平静的共同生活', members: [{ charId: 'char-1', activity: '整理样本', location: '公寓', description: '在客厅处理工作。' }] })) } } as WorldProfile;
        world.lifePlan!.dayKey = worldLifeDayKey(world);
        const char = {
            id: 'char-1', name: '测试角色', cityLife: {
                generatedAt: 0, cityName: '测试城', lastSettledDate: world.lifePlan!.dayKey,
                events: [{ id: 'rain', title: '盛夏暴雨', category: '天气', description: '午后雨势很大。', startDate: world.lifePlan!.dayKey, endDate: world.lifePlan!.dayKey, durationDays: 1, intensity: 4, homeImpact: '关闭窗户并给设备除湿。' }],
                goals: [],
            },
        } as CharacterProfile;
        vi.mocked(DB.getWorlds).mockResolvedValue([world]);

        await syncCityLifeToLinkedWorldPlan(char);

        const saved = vi.mocked(DB.saveWorld).mock.calls[0][0] as WorldProfile;
        expect(saved.lifePlan!.segments.every(segment => segment.event.includes('盛夏暴雨'))).toBe(true);
        expect(saved.lifePlan!.segments.every(segment => segment.members[0].description?.includes('给设备除湿'))).toBe(true);
    });
});
