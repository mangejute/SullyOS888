import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CharacterProfile } from '../types';

vi.mock('./db', () => ({
    DB: {
        getDailySchedule: vi.fn(async () => null),
        saveCharacter: vi.fn(),
        saveDailySchedule: vi.fn(),
    },
}));

import { DB } from './db';
import { advanceGoal, applyCityLifeToSchedule, buildCityLifeContext, chooseEventBranch, generateCityLife, generateEventThread, getCityLifeEventArchive, getRelevantCityEvents, settleCityLife, settleCityLifeState } from './cityLife';

const makeCharacter = (): CharacterProfile => ({
    id: 'city-life-test',
    name: '测试角色',
    description: '住在一座有河岸和市集的城市。',
    cityLife: {
        generatedAt: 0,
        cityName: '测试城',
        lastSettledDate: '2026-08-17',
        events: [
            { id: 'active', title: '河岸暴雨', category: '天气', description: '河岸道路积水。', startDate: '2026-08-20', endDate: '2026-08-22', durationDays: 3, intensity: 4 },
            { id: 'upcoming', title: '夜市开幕', category: '活动', description: '摊位正在搭建。', startDate: '2026-08-21', endDate: '2026-08-21', durationDays: 1, intensity: 2 },
            { id: 'aftermath', title: '街区停电', category: '公共服务', description: '商户正在复电。', startDate: '2026-08-17', endDate: '2026-08-19', durationDays: 3, intensity: 3 },
            { id: 'later', title: '远期展览', category: '活动', description: '不应提前占用今天的上下文。', startDate: '2026-08-30', endDate: '2026-08-30', durationDays: 1, intensity: 1 },
        ],
        goals: [{
            id: 'goal', title: '完成作品集', horizon: 'short', description: '整理近期作品。', progress: 0,
            startDate: '2026-08-01', targetDate: '2026-09-30', nextAction: '整理两页作品并写说明。',
            completionBenefit: '获得更稳定的自信。', setbackImpact: '短暂焦虑后重新安排。', status: 'active', actionLocationId: 'studio',
        }],
    },
} as CharacterProfile);

beforeEach(() => vi.clearAllMocks());

describe('城市事件分阶段联动', () => {
    it('同时保留近期预告、进行中事件与余波，并明确阶段行为', () => {
        const char = makeCharacter();
        const events = getRelevantCityEvents(char, '2026-08-20');
        expect(events.map(event => `${event.id}:${event.phase}`)).toEqual(['aftermath:aftermath', 'active:active', 'upcoming:upcoming']);
        const context = buildCityLifeContext(char, '2026-08-20');
        expect(context).toContain('预告');
        expect(context).toContain('进行中');
        expect(context).toContain('余波');
        expect(context).not.toContain('远期展览');
    });

    it('把事件地点和目标行动一起写进当天日程', () => {
        const char = makeCharacter();
        const schedule = applyCityLifeToSchedule(char, {
            id: 'city-life-test_2026-08-20', charId: char.id, date: '2026-08-20', generatedAt: 0,
            slots: [
                { startTime: '10:00', activity: '创作', locationId: 'studio', location: '工作室' },
                { startTime: '20:00', activity: '休息' },
            ],
        });
        expect(schedule.slots[0].cityEventIds).toContain('active');
        expect(schedule.slots[0].goalIds).toContain('goal');
        expect(schedule.slots[0].description).toContain('目标行动');
    });

    it('跨日结算只更新阶段，不删除历史事件', () => {
        const char = makeCharacter();
        const settled = settleCityLifeState(char, new Date(2026, 7, 23));
        expect(settled?.events.map(event => event.id)).toEqual(['active', 'upcoming', 'aftermath', 'later']);
        expect(settled?.events.find(event => event.id === 'active')?.phase).toBe('aftermath');
        expect(settled?.events.find(event => event.id === 'aftermath')?.phase).toBe('ended');
    });

    it('事件档案展示所有事件，而不是只取上下文窗口', () => {
        const archive = getCityLifeEventArchive(makeCharacter(), '2026-08-20');
        expect(archive.map(event => event.id)).toEqual(['aftermath', 'active', 'upcoming', 'later']);
        expect(archive.at(-1)?.phase).toBe('upcoming');
    });
});

describe('城市事件生成数量', () => {
    it('按用户指定数量生成并保存数量配置', async () => {
        const char = makeCharacter();
        const events = Array.from({ length: 20 }, (_, i) => ({ id: `event-${i}`, title: `事件${i}`, startDate: '2026-08-20', endDate: '2026-08-20', durationDays: 1, intensity: 2 }));
        const goals = [
            { title: '短目标', horizon: 'short' }, { title: '中目标', horizon: 'mid' }, { title: '远目标', horizon: 'long' },
        ];
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ events, goals }) } }] }), { status: 200, headers: { 'content-type': 'application/json' } })));
        const state = await generateCityLife(char, { baseUrl: 'https://example.test', apiKey: 'key', model: 'model' }, 20);
        expect(state?.events).toHaveLength(20);
        expect(state?.eventGenerationCount).toBe(20);
        expect((vi.mocked(DB.saveCharacter).mock.calls.at(-1)?.[0] as CharacterProfile).cityLife?.eventGenerationCount).toBe(20);
        vi.unstubAllGlobals();
    });
});

describe('目标按真实日期自动结算', () => {
    it('记录一次行动只推进目标，不制造负面影响', async () => {
        const char = makeCharacter();
        const next = await advanceGoal(char, 'goal');
        const goal = next.cityLife!.goals[0];
        expect(goal.progress).toBe(15);
        expect(goal.status).toBe('active');
        expect(goal.setbackUntil).toBeUndefined();
    });

    it('补齐离线期间每一天已排定的目标行动', async () => {
        const char = makeCharacter();
        vi.mocked(DB.getDailySchedule).mockImplementation(async (_charId, date) => (
            ['2026-08-17', '2026-08-18', '2026-08-19'].includes(date)
                ? { id: `${char.id}_${date}`, charId: char.id, date, generatedAt: 0, slots: [{ startTime: '20:00', activity: '目标行动', goalIds: ['goal'] }] }
                : null
        ));
        const settled = await settleCityLife(char, new Date(2026, 7, 20, 12));
        const goal = settled.cityLife!.goals[0];
        expect(goal.progress).toBe(24);
        expect(goal.lastAdvancedDate).toBe('2026-08-19');
        expect(settled.cityLife!.lastSettledDate).toBe('2026-08-20');
    });
});

describe('NPC 事件链', () => {
    it('为进行中的事件生成 2-3 个可选分支', async () => {
        const char = makeCharacter();
        char.cityLife!.events = [char.cityLife!.events[0]];
        const threadPayload = { choices: [
            { id: 'choice-a', label: '去现场', followUpTitle: '现场处理', followUpDescription: '前往现场。', leadNpcId: 'npc-1' },
            { id: 'choice-b', label: '先观望', followUpTitle: '观望余波', followUpDescription: '暂时观望。', leadNpcId: 'npc-1' },
        ], title: '雨夜分歧', summary: 'NPC 提出两种处理方向。', leadNpcId: 'npc-1' };
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(threadPayload) } }] }), { status: 200, headers: { 'content-type': 'application/json' } })));
        const next = await generateEventThread(char, 'active', { baseUrl: 'https://example.test', apiKey: 'key', model: 'model' });
        expect(next?.threads?.[0].choices).toHaveLength(2);
        expect(next?.threads?.[0].status).toBe('open');
        vi.unstubAllGlobals();
    });

    it('选择分支后生成带父事件引用的后续城市事件', async () => {
        const char = makeCharacter();
        char.cityLife!.threads = [{
            id: 'thread-1', rootEventId: 'active', title: '雨夜的求助', summary: 'NPC 带来一个请求。', leadNpcId: 'npc-1', status: 'open', createdAt: 0,
            choices: [{
                id: 'choice-1', label: '先去查看', description: '前往现场确认情况。', leadNpcId: 'npc-1', outcome: '角色决定亲自确认。',
                followUpTitle: '雨后的现场', followUpDescription: '角色在雨后前往现场处理积水。', followUpDurationDays: 2, followUpIntensity: 3,
                followUpAffectedLocationIds: ['river'], followUpAffectedNpcIds: ['npc-1'], followUpHomeImpact: '需要晾晒被雨打湿的物品。',
            }],
        }];
        const next = await chooseEventBranch(char, 'thread-1', 'choice-1');
        const followUp = next.cityLife!.events.find(event => event.parentEventId === 'active');
        expect(followUp?.title).toBe('雨后的现场');
        expect(followUp?.affectedNpcIds).toContain('npc-1');
        expect(next.cityLife!.threads?.[0].status).toBe('resolved');
        expect(next.cityLife!.threads?.[0].resolutionNote).toContain('亲自确认');
    });
});
