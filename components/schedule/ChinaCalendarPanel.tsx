import React, { useMemo, useState } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { calendarMonthDays, getChinaCalendarDay } from '../../utils/chinaCalendar2026';

const labels = ['日', '一', '二', '三', '四', '五', '六'];
const tone = (kind: string) => kind === 'holiday' ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200' : kind === 'makeup_workday' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' : kind === 'weekend' ? 'text-indigo-500' : 'text-slate-600';

const ChinaCalendarPanel: React.FC = () => {
  const today = new Date();
  const initialMonth = today.getFullYear() === 2026 ? today.getMonth() : 0;
  const [month, setMonth] = useState(initialMonth);
  const days = useMemo(() => calendarMonthDays(2026, month), [month]);
  const todayKey = today.getFullYear() === 2026 ? today.toISOString().slice(0, 10) : '';
  const focus = getChinaCalendarDay(`2026-${String(month + 1).padStart(2, '0')}-01`);
  return <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
    <div className="flex items-center justify-between"><button aria-label="上个月" disabled={month === 0} onClick={() => setMonth(value => value - 1)} className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 disabled:opacity-25"><CaretLeft size={16}/></button><div className="text-center"><p className="text-sm font-bold text-slate-700">2026 年 {month + 1} 月</p><p className="text-[10px] text-slate-400">中国法定节假日与调休补班</p></div><button aria-label="下个月" disabled={month === 11} onClick={() => setMonth(value => value + 1)} className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 disabled:opacity-25"><CaretRight size={16}/></button></div>
    <div className="mt-3 grid grid-cols-7 gap-1 text-center">{labels.map(label => <span key={label} className="py-1 text-[10px] font-bold text-slate-400">{label}</span>)}{days.map((day, index) => day ? <div key={day.date} title={day.label} className={`min-h-[42px] rounded-lg px-0.5 pt-1 text-[11px] font-semibold ${tone(day.kind)} ${day.date === todayKey ? 'ring-2 ring-indigo-500' : ''}`}><div>{Number(day.date.slice(-2))}</div>{(day.kind === 'holiday' || day.kind === 'makeup_workday') && <div className="mt-0.5 truncate text-[8px] leading-tight">{day.kind === 'makeup_workday' ? '补班' : day.label}</div>}</div> : <span key={`empty-${index}`}/>)}</div>
    <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-100 pt-2 text-[10px] text-slate-500"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-400"/>放假</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-400"/>补班</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-indigo-400"/>周末</span><span className="ml-auto">{focus.label}</span></div>
  </div>;
};
export default ChinaCalendarPanel;
