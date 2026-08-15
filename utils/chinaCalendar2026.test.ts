import { describe, expect, it } from 'vitest';
import { getChinaCalendarDay } from './chinaCalendar2026';

describe('2026 中国节假日安排', () => {
  it('正确识别法定假期', () => {
    expect(getChinaCalendarDay('2026-02-17')).toMatchObject({ kind: 'holiday', label: '春节', isRestDay: true });
    expect(getChinaCalendarDay('2026-10-01')).toMatchObject({ kind: 'holiday', label: '国庆节', isRestDay: true });
  });

  it('调休补班覆盖周末', () => {
    expect(getChinaCalendarDay('2026-01-04')).toMatchObject({ kind: 'makeup_workday', isWorkday: true });
    expect(getChinaCalendarDay('2026-10-10')).toMatchObject({ kind: 'makeup_workday', isWorkday: true });
  });
});
