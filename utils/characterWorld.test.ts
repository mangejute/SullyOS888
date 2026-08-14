import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import type { CharacterProfile, DailySchedule } from '../types';
import { buildCharacterWorldContext, deriveCharacterWorldClock } from './characterWorld';

const originalTimeZone = process.env.TZ;

beforeEach(() => {
    process.env.TZ = 'Asia/Shanghai';
});

afterAll(() => {
    if (originalTimeZone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimeZone;
});

describe('character world context', () => {
    it('keeps the chat context focused on the active part of a large map', () => {
        const locations = Array.from({ length: 30 }, (_, index) => ({
            id: `place-${index}`,
            name: `地点${index}`,
            description: '',
            purpose: '日常活动',
            distance: '',
            category: '地点',
            x: index,
            y: index,
        }));
        const char = {
            id: 'char-1',
            name: '测试角色',
            worldMap: { referenceCity: '', sourceText: '', updatedAt: 0, locations },
            worldState: { mapVersion: 1, currentLocationId: 'place-0' },
        } as CharacterProfile;

        const context = buildCharacterWorldContext(char);
        expect(context).toContain('地点0');
        expect(context).not.toContain('地点29');
        expect(context).toContain('其余 29 个远处地点暂不展开');
    });

    it('uses the character local hour when placing NPCs', () => {
        const char = {
            id: 'char-1',
            name: '测试角色',
            customTimezoneEnabled: true,
            customTimezone: 'America/New_York',
            worldMap: {
                referenceCity: '', sourceText: '', updatedAt: 0,
                locations: [
                    { id: 'home', name: '家', description: '', purpose: '', distance: '', category: '', x: 0, y: 0 },
                    { id: 'work', name: '工作室', description: '', purpose: '', distance: '', category: '', x: 1, y: 1 },
                ],
            },
            worldNpcs: [{ id: 'npc-1', name: '同事', age: '', gender: '', role: '', relation: '', description: '', homeLocationId: 'home', workLocationId: 'work' }],
        } as CharacterProfile;
        const schedule: DailySchedule = { id: 's', charId: 'char-1', date: '2026-08-14', generatedAt: 0, slots: [] };

        // 北京晚上 21 点时，纽约仍是上午 9 点，NPC 应在工作地点。
        const updated = deriveCharacterWorldClock(char, schedule, new Date('2026-08-14T13:00:00.000Z'));
        expect(Array.isArray(updated?.worldNpcs) && updated?.worldNpcs[0].currentLocationId).toBe('work');
    });

    it('uses the active schedule slot as the single current-location fact', () => {
        const char = {
            id: 'char-1',
            name: '测试角色',
            worldMap: {
                referenceCity: '', sourceText: '', updatedAt: 0,
                locations: [
                    { id: 'home', name: '家', description: '', purpose: '', distance: '', category: '', x: 0, y: 0 },
                    { id: 'studio', name: '工作室', description: '', purpose: '', distance: '', category: '', x: 1, y: 1 },
                ],
            },
            worldState: { mapVersion: 1, currentLocationId: 'home' },
        } as CharacterProfile;
        const schedule: DailySchedule = {
            id: 's', charId: 'char-1', date: '2026-08-14', generatedAt: 0,
            slots: [{ startTime: '14:00', activity: '工作', locationId: 'studio', location: '工作室' }],
        };
        const context = buildCharacterWorldContext(char, schedule, new Date(2026, 7, 14, 15, 0));
        expect(context).toContain('当前所在：工作室');
        expect(context).toContain('当前日程：14:00 工作，地点=工作室');
        expect(context).not.toContain('正在前往工作室');
    });
});
