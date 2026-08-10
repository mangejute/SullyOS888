import { describe, expect, it } from 'vitest';
import { worldSegmentForHour } from './lifeLink';

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
