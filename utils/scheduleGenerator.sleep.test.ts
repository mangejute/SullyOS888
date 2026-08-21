import { describe, expect, it } from 'vitest';
import type { ScheduleSlot } from '../types';
import { ensureSleepSlotForRoutine } from './scheduleGenerator';

const baseSlots: ScheduleSlot[] = [
    { startTime: '08:00', activity: '工作' },
    { startTime: '19:00', activity: '晚餐' },
    { startTime: '22:00', activity: '看剧' },
    { startTime: '03:30', activity: '刷手机' },
];

const character = (workSleep: string, restSleep: string) => ({
    id: 'sleep-test',
    name: '测试角色',
    routineProfile: {
        summary: '稳定作息',
        workday: { wakeTime: '07:30', breakfastTime: '08:00', lunchTime: '12:00', dinnerTime: '19:00', sleepTime: workSleep },
        restday: { wakeTime: '09:00', breakfastTime: '09:30', lunchTime: '13:00', dinnerTime: '19:30', sleepTime: restSleep },
        updatedAt: Date.now(),
    },
} as any);

describe('ensureSleepSlotForRoutine', () => {
    it('工作日把 23:30 作为日程最后一条，并移除之后的凌晨活动', () => {
        const slots = [...baseSlots, { startTime: '23:20', activity: '关灯入睡', description: '收好东西后关灯。' }];
        const result = ensureSleepSlotForRoutine(character('23:30', '00:30'), '2026-08-21', slots);
        expect(result.at(-1)).toMatchObject({ startTime: '23:30', activity: '关灯入睡' });
        expect(result.some(slot => slot.startTime === '03:30')).toBe(false);
        expect(result.at(-1)?.description).toContain('关灯');
    });

    it('休息日 00:30 保留真实时间并排在当天时间轴开头', () => {
        const slots = [
            { startTime: '00:30', activity: '关灯读完最后一页', description: '把书签夹好，准备睡觉。' },
            ...baseSlots,
        ];
        const result = ensureSleepSlotForRoutine(character('23:30', '00:30'), '2026-08-22', slots);
        expect(result[0]).toMatchObject({ startTime: '00:30', activity: '关灯读完最后一页' });
        expect(result[0]?.description).toContain('书签');
        expect(result.some(slot => slot.startTime === '03:30')).toBe(false);
    });

    it('已有接近睡点的洗漱安排时复用该条，不重复添加', () => {
        const slots: ScheduleSlot[] = [
            { startTime: '08:00', activity: '工作' },
            { startTime: '23:00', activity: '洗漱休息', description: '洗漱后关灯睡觉。' },
        ];
        const result = ensureSleepSlotForRoutine(character('23:30', '00:30'), '2026-08-21', slots);
        expect(result).toHaveLength(2);
        expect(result.at(-1)).toMatchObject({ startTime: '23:30', activity: '洗漱休息' });
        expect(result.at(-1)?.description).toContain('关灯');
    });
});
