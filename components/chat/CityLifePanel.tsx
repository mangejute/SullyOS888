import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDots, Target, Sparkle, ArrowClockwise, CheckCircle, Info, GitBranch, UsersThree, X } from '@phosphor-icons/react';
import type { APIConfig, CharacterProfile, CityLifeEvent, CityLifeGoal, CityLifeThread } from '../../types';
import { generateCityLife, settleCityLife, advanceGoal, characterCityDate, getCityLifeEventArchive, generateEventThread, chooseEventBranch } from '../../utils/cityLife';
import { getCharacterNpcs } from '../../utils/characterWorld';

type Props = { char: CharacterProfile; apiConfig: APIConfig; mode: 'events' | 'goals'; onClose: () => void; onChange: (char: CharacterProfile) => void };

const horizonLabel: Record<CityLifeGoal['horizon'], string> = { short: '短期', mid: '中期', long: '远期' };

const CityLifePanel: React.FC<Props> = ({ char, apiConfig, mode, onClose, onChange }) => {
    const [working, setWorking] = useState(false);
    const [branchWorking, setBranchWorking] = useState(false);
    const [notice, setNotice] = useState('');
    const [eventCount, setEventCount] = useState(char.cityLife?.eventGenerationCount || 40);
    const [infoGoalId, setInfoGoalId] = useState<string | null>(null);
    const today = characterCityDate(char);
    const phasedEvents = useMemo(() => getCityLifeEventArchive(char, today), [char, today]);
    const activeEvents = phasedEvents.filter(event => event.phase === 'active');
    const upcomingEvents = phasedEvents.filter(event => event.phase === 'upcoming');
    const aftermathEvents = phasedEvents.filter(event => event.phase === 'aftermath');
    const endedEvents = phasedEvents.filter(event => event.phase === 'ended');
    const goals = char.cityLife?.goals || [];
    const threads = char.cityLife?.threads || [];
    const npcLabel = (id?: string) => getCharacterNpcs(char).find(npc => npc.id === id)?.name || id || '相关 NPC';

    useEffect(() => { if (!char.cityLife) void generate(); }, [char.id]);

    async function generate() {
        setWorking(true); setNotice('AI 正在观察城市、家园和角色关系…');
        const state = await generateCityLife(char, apiConfig, eventCount);
        if (state) { const next = { ...char, cityLife: state }; onChange(next); setNotice('已生成城市事件池与目标树'); }
        else setNotice('生成失败，请检查 API 配置后重试');
        setWorking(false);
    }
    async function refresh() {
        setWorking(true); const next = await settleCityLife(char); onChange(next); setWorking(false); setNotice('已按今天的真实日期推进');
    }
    async function goalAction(goal: CityLifeGoal) {
        setWorking(true); const next = await advanceGoal(char, goal.id); onChange(next); setWorking(false); setNotice('已记录一步完成，目标进度已推进');
    }
    async function createThread(event: CityLifeEvent) {
        setBranchWorking(true); setNotice('AI 正在听取 NPC 的意见…');
        const state = await generateEventThread(char, event.id, apiConfig);
        if (state) { onChange({ ...char, cityLife: state }); setNotice('已生成事件分支'); }
        else setNotice('分支生成失败，请检查 API 配置后重试');
        setBranchWorking(false);
    }
    async function resolveThread(thread: CityLifeThread, choiceId: string) {
        setBranchWorking(true); const next = await chooseEventBranch(char, thread.id, choiceId);
        onChange(next); setBranchWorking(false); setNotice('已选择分支，后续事件会进入明日城市生活');
    }

    return <div className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-950/40 p-4" onClick={onClose}>
        <div className="w-full max-w-lg max-h-[84vh] overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2"><div className="rounded-2xl bg-indigo-50 p-2 text-indigo-600">{mode === 'events' ? <CalendarDots size={22} weight="bold" /> : <Target size={22} weight="bold" />}</div><div><h2 className="text-base font-black text-slate-800">{mode === 'events' ? '城市动态' : '人生目标'}</h2><p className="text-[11px] text-slate-400">{char.cityLife?.cityName || '所在城市'} · {today}</p></div></div>
                <div className="flex items-center gap-1"><button onClick={refresh} disabled={working} title="按今天推进" className="rounded-full p-2 text-slate-400 hover:bg-slate-100"><ArrowClockwise size={17} /></button><button onClick={onClose} title="关闭" className="rounded-full p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div>
            </div>
            <div className="max-h-[calc(84vh-76px)] overflow-y-auto p-4">
                {notice && <div className="mb-3 rounded-2xl bg-indigo-50 px-3 py-2 text-xs text-indigo-700">{notice}</div>}
                {!char.cityLife && <div className="py-12 text-center"><Sparkle size={30} className="mx-auto mb-3 text-indigo-400" /><p className="text-sm font-semibold text-slate-700">AI 正在准备生活状态</p></div>}
                {char.cityLife && mode === 'events' && <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500"><span>已生成事件 <b className="text-slate-700">{char.cityLife.events.length}</b> 条</span><label className="flex items-center gap-1.5">下次生成 <input aria-label="下次生成事件数量" type="number" min={20} max={80} step={1} value={eventCount} onChange={e => setEventCount(Math.max(20, Math.min(80, Number(e.target.value) || 20)))} className="w-14 rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-center text-[11px]" /> 条</label></div>
                    <Section title="正在发生" items={activeEvents} empty="今天城市很安静，角色可以按自己的节奏生活。" threads={threads} npcLabel={npcLabel} onGenerateThread={createThread} onChooseBranch={resolveThread} branchWorking={branchWorking} />
                    <Section title="即将发生" items={upcomingEvents} empty="暂时没有已排定的城市事件。" threads={threads} npcLabel={npcLabel} onGenerateThread={createThread} onChooseBranch={resolveThread} branchWorking={branchWorking} />
                    <Section title="事件余波" items={aftermathEvents} empty="最近没有需要收尾的城市事件。" threads={threads} npcLabel={npcLabel} onGenerateThread={createThread} onChooseBranch={resolveThread} branchWorking={branchWorking} />
                    <Section title="已结束档案" items={endedEvents} empty="还没有结束的事件。" threads={threads} npcLabel={npcLabel} onGenerateThread={createThread} onChooseBranch={resolveThread} branchWorking={branchWorking} />
                    <button onClick={generate} disabled={working} className="w-full rounded-2xl border border-indigo-100 bg-indigo-50 py-3 text-xs font-bold text-indigo-700">重新生成一批城市生活</button>
                </div>}
                {char.cityLife && mode === 'goals' && <div className="space-y-3">
                    {(['short', 'mid', 'long'] as const).map(horizon => <div key={horizon}><div className="mb-2 text-xs font-black text-slate-500">{horizonLabel[horizon]}目标</div><div className="space-y-2">{goals.filter(g => g.horizon === horizon).map(goal => <div key={goal.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3"><div className="flex items-start justify-between gap-3"><div><div className="text-sm font-bold text-slate-800">{goal.title}</div><div className="mt-1 text-[11px] leading-relaxed text-slate-500">{goal.description}</div></div><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${goal.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : goal.status === 'setback' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>{goal.status === 'completed' ? '已完成' : goal.status === 'setback' ? '短暂受挫' : `${goal.progress}%`}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${goal.progress}%` }} /></div><div className="mt-2 text-[11px] text-slate-500">预计 {goal.targetDate} · 下一步：{goal.nextAction}</div>{goal.status === 'completed' && <div className="mt-2 text-[11px] text-emerald-700">完成收获：{goal.completionBenefit}</div>}{goal.status === 'setback' && <div className="mt-2 text-[11px] text-amber-700">{goal.setbackImpact}，预计 {goal.setbackUntil || '稍后'} 恢复。</div>}{goal.status !== 'completed' && <div className="mt-2 flex gap-2"><button onClick={() => goalAction(goal)} title="记录已完成一步" className="flex-1 rounded-xl bg-emerald-50 py-2 text-[11px] font-bold text-emerald-700"><CheckCircle className="mr-1 inline" />记录已完成一步</button><button onClick={() => setInfoGoalId(infoGoalId === goal.id ? null : goal.id)} title="查看目标规则" aria-label="查看目标规则" className="rounded-xl bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-500"><Info /></button></div>}{infoGoalId === goal.id && <div className="mt-2 rounded-xl bg-slate-100 px-3 py-2 text-[11px] leading-relaxed text-slate-600">“记录已完成一步”表示你确实完成了目标的下一步：{goal.nextAction}。每次推进 15%；负面影响由错过目标期限或城市事件自动产生，不会因为查看说明而触发。</div>}</div>)}</div></div>)}
                    <button onClick={generate} disabled={working} className="w-full rounded-2xl border border-indigo-100 bg-indigo-50 py-3 text-xs font-bold text-indigo-700">重新生成事件与目标</button>
                </div>}
            </div>
        </div>
    </div>;
};

type SectionProps = {
    title: string;
    items: Array<CityLifeEvent & { phase?: string }>;
    empty: string;
    threads: CityLifeThread[];
    npcLabel: (id?: string) => string;
    onGenerateThread: (event: CityLifeEvent) => void;
    onChooseBranch: (thread: CityLifeThread, choiceId: string) => void;
    branchWorking: boolean;
};

const Section: React.FC<SectionProps> = ({ title, items, empty, threads, npcLabel, onGenerateThread, onChooseBranch, branchWorking }) => <section><div className="mb-2 text-xs font-black text-slate-500">{title}</div>{items.length ? <div className="space-y-2">{items.map(event => {
    const thread = threads.find(item => item.rootEventId === event.id);
    return <div key={event.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
        <div className="flex items-start justify-between gap-2"><div className="text-sm font-bold text-slate-800">{event.title}</div><span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-500">{event.category}</span></div>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{event.description}</p>
        <div className="mt-2 text-[10px] text-slate-400">{event.startDate} 至 {event.endDate} · 影响 {event.durationDays} 天{event.homeImpact ? ` · 家园：${event.homeImpact}` : ''}</div>
        {thread && <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/70 p-2.5"><div className="flex items-center gap-1 text-[11px] font-bold text-indigo-700"><GitBranch size={14} />{thread.title}</div><p className="mt-1 text-[11px] leading-relaxed text-indigo-700/80">{thread.summary}</p><div className="mt-1 flex items-center gap-1 text-[10px] text-indigo-500"><UsersThree size={13} />{npcLabel(thread.leadNpcId)}</div>{thread.status === 'open' ? <div className="mt-2 space-y-1.5">{thread.choices.map(choice => <button key={choice.id} disabled={branchWorking} onClick={() => onChooseBranch(thread, choice.id)} className="flex w-full items-start gap-2 rounded-lg bg-white px-2.5 py-2 text-left text-[11px] text-slate-700 shadow-sm hover:bg-indigo-100"><span className="font-bold text-indigo-600">{choice.label}</span><span className="text-slate-500">{choice.description}</span></button>)}</div> : <div className="mt-2 text-[11px] text-emerald-700">已选择：{thread.choices.find(choice => choice.id === thread.selectedChoiceId)?.label || '已处理'} · {thread.resolutionNote}</div>}</div>}
        {!thread && event.phase === 'active' && <button disabled={branchWorking} onClick={() => onGenerateThread(event)} title="生成 NPC 事件分支" className="mt-3 flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-2 text-[11px] font-bold text-indigo-700"><GitBranch size={14} />生成 NPC 分支</button>}
    </div>;
})}</div> : <div className="rounded-2xl bg-slate-50 px-3 py-4 text-center text-xs text-slate-400">{empty}</div>}</section>;

export default CityLifePanel;
