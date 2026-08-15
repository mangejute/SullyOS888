export type ChinaDayKind = 'holiday' | 'makeup_workday' | 'weekend' | 'workday';
export type ChinaCalendarDay = { date: string; kind: ChinaDayKind; label: string; isRestDay: boolean; isWorkday: boolean };

const HOLIDAYS: Array<[string, string, string]> = [
  ['2026-01-01', '2026-01-03', '元旦'], ['2026-02-15', '2026-02-23', '春节'],
  ['2026-04-04', '2026-04-06', '清明节'], ['2026-05-01', '2026-05-05', '劳动节'],
  ['2026-06-19', '2026-06-21', '端午节'], ['2026-09-25', '2026-09-27', '中秋节'],
  ['2026-10-01', '2026-10-07', '国庆节'],
];
const MAKEUP_WORKDAYS: Record<string, string> = {
  '2026-01-04': '元旦调休补班', '2026-02-14': '春节调休补班', '2026-02-28': '春节调休补班',
  '2026-05-09': '劳动节调休补班', '2026-09-20': '国庆节调休补班', '2026-10-10': '国庆节调休补班',
};
const weekNames = ['日', '一', '二', '三', '四', '五', '六'];

function ymd(date: Date | string): string {
  if (typeof date === 'string') return date.slice(0, 10);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function weekday(key: string): number {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day).getDay();
}
function between(key: string, start: string, end: string) { return key >= start && key <= end; }

/** 2026 国务院办公厅国办发明电〔2025〕7号的放假、调休补班安排。 */
export function getChinaCalendarDay(date: Date | string): ChinaCalendarDay {
  const key = ymd(date);
  const week = weekday(key);
  if (MAKEUP_WORKDAYS[key]) return { date: key, kind: 'makeup_workday', label: MAKEUP_WORKDAYS[key], isRestDay: false, isWorkday: true };
  const holiday = HOLIDAYS.find(([start, end]) => between(key, start, end));
  if (holiday) return { date: key, kind: 'holiday', label: holiday[2], isRestDay: true, isWorkday: false };
  if (week === 0 || week === 6) return { date: key, kind: 'weekend', label: '周末', isRestDay: true, isWorkday: false };
  return { date: key, kind: 'workday', label: '工作日', isRestDay: false, isWorkday: true };
}

export function formatChinaCalendarContext(date: Date | string): string {
  const day = getChinaCalendarDay(date);
  const week = weekNames[weekday(day.date)];
  const status = day.kind === 'holiday' ? `法定节假日（${day.label}，默认放假）` : day.kind === 'makeup_workday' ? `调休补班日（${day.label}，按工作日执行）` : day.kind === 'weekend' ? '周末休息日' : '普通工作日';
  return `今天是 ${day.date}，星期${week}，中国日历：${status}。`;
}

export function calendarMonthDays(year: number, month: number): Array<ChinaCalendarDay | null> {
  const first = new Date(year, month, 1).getDay();
  const length = new Date(year, month + 1, 0).getDate();
  return [...Array(first).fill(null), ...Array.from({ length }, (_, i) => getChinaCalendarDay(`${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`))];
}
