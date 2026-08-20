import type { APIConfig, CharacterProfile, CityLifeBranchChoice, CityLifeEvent, CityLifeGoal, CityLifeThread, CharacterCityLifeState, DailySchedule } from '../types';
import { DB } from './db';
import { extractContent, extractJson, safeResponseJson } from './safeApi';
import { getLocalDateKey } from './localDate';
import { nowInTimeZone, resolveCharTimeZone } from './timezone';
import { getCharacterLocations, getCharacterNpcs, locationById } from './characterWorld';

type CityLifeApiConfig = Pick<APIConfig, 'baseUrl' | 'apiKey' | 'model'>;

function addDays(date: string, days: number): string {
    const d = new Date(`${date}T12:00:00`);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

function eventPhaseAt(event: Pick<CityLifeEvent, 'startDate' | 'endDate'>, date: string): NonNullable<CityLifeEvent['phase']> {
    if (date < event.startDate) return 'upcoming';
    if (date <= event.endDate) return 'active';
    return date <= addDays(event.endDate, 2) ? 'aftermath' : 'ended';
}

function datesToSettle(lastDate: string | undefined, today: string): string[] {
    if (!lastDate || lastDate >= today) return [];
    const dates: string[] = [];
    for (let date = lastDate; date < today; date = addDays(date, 1)) dates.push(date);
    return dates;
}

export function characterCityDate(char: CharacterProfile, at = new Date()): string {
    return getLocalDateKey(nowInTimeZone(resolveCharTimeZone(char), at));
}

function clampDate(value: unknown, fallback: string): string {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? String(value) : fallback;
}

function clampText(value: unknown, fallback: string, max: number): string {
    return String(value || fallback).trim().slice(0, max) || fallback;
}

function normalizeEvent(raw: any, index: number, today: string): CityLifeEvent | null {
    const title = String(raw?.title || '').trim();
    if (!title) return null;
    const startDate = clampDate(raw?.startDate, addDays(today, Math.min(index, 30)));
    const durationDays = Math.max(1, Math.min(14, Math.round(Number(raw?.durationDays) || 1)));
    const endDate = clampDate(raw?.endDate, addDays(startDate, durationDays - 1));
    const intensity = Math.max(1, Math.min(5, Math.round(Number(raw?.intensity) || 2))) as 1 | 2 | 3 | 4 | 5;
    return {
        id: String(raw?.id || `city-event-${Date.now()}-${index}`), title: title.slice(0, 60),
        category: String(raw?.category || '城市日常').slice(0, 24),
        description: String(raw?.description || '城市里发生了一件值得留意的事。').slice(0, 240),
        district: String(raw?.district || '').slice(0, 40) || undefined,
        startDate, endDate, durationDays, intensity,
        phase: startDate > today ? 'upcoming' : endDate >= today ? 'active' : 'ended',
        affectedLocationIds: Array.isArray(raw?.affectedLocationIds) ? raw.affectedLocationIds.slice(0, 8).map(String) : undefined,
        affectedNpcIds: Array.isArray(raw?.affectedNpcIds) ? raw.affectedNpcIds.slice(0, 8).map(String) : undefined,
        homeImpact: String(raw?.homeImpact || '').slice(0, 160) || undefined,
        scheduleImpact: String(raw?.scheduleImpact || '').slice(0, 160) || undefined,
        characterAwareness: String(raw?.characterAwareness || '从城市公告、聊天或亲身经历得知。').slice(0, 120),
        dailyUpdate: String(raw?.dailyUpdate || '').slice(0, 180) || undefined,
    };
}

function normalizeGoal(raw: any, index: number, today: string): CityLifeGoal | null {
    const title = String(raw?.title || '').trim();
    if (!title) return null;
    const horizon = ['short', 'mid', 'long'].includes(raw?.horizon) ? raw.horizon : index === 0 ? 'short' : index === 1 ? 'mid' : 'long';
    const months = horizon === 'short' ? 2 : horizon === 'mid' ? 4 : 9;
    const targetDate = clampDate(raw?.targetDate, addDays(today, months * 30));
    return {
        id: String(raw?.id || `life-goal-${Date.now()}-${index}`), title: title.slice(0, 60), horizon,
        description: String(raw?.description || '').slice(0, 220), progress: Math.max(0, Math.min(100, Number(raw?.progress) || 0)),
        startDate: clampDate(raw?.startDate, today), targetDate,
        nextAction: String(raw?.nextAction || '安排一次专注时间推进它。').slice(0, 140),
        actionLocationId: typeof raw?.actionLocationId === 'string' ? raw.actionLocationId : undefined,
        relatedNpcIds: Array.isArray(raw?.relatedNpcIds) ? raw.relatedNpcIds.slice(0, 5).map(String) : undefined,
        homeLink: String(raw?.homeLink || '').slice(0, 140) || undefined,
        scheduleLink: String(raw?.scheduleLink || '').slice(0, 140) || undefined,
        completionBenefit: String(raw?.completionBenefit || '获得成就感，并改善相关生活状态。').slice(0, 160),
        setbackImpact: String(raw?.setbackImpact || '短暂的压力上升，目标顺延一周。').slice(0, 160),
        status: 'active',
    };
}

function normalizeBranchChoice(raw: any, index: number): CityLifeBranchChoice | null {
    const label = clampText(raw?.label, '', 50);
    const followUpTitle = clampText(raw?.followUpTitle, '', 60);
    if (!label || !followUpTitle) return null;
    const intensity = Math.max(1, Math.min(5, Math.round(Number(raw?.followUpIntensity) || 3))) as CityLifeBranchChoice['followUpIntensity'];
    return {
        id: String(raw?.id || `branch-choice-${Date.now()}-${index}`),
        label,
        description: clampText(raw?.description, '这条选择会改变接下来几天的城市生活。', 180),
        leadNpcId: typeof raw?.leadNpcId === 'string' ? raw.leadNpcId : undefined,
        outcome: clampText(raw?.outcome, '事情暂时得到处理，但城市会留下新的余波。', 180),
        followUpTitle,
        followUpDescription: clampText(raw?.followUpDescription, raw?.outcome, 240),
        followUpDurationDays: Math.max(1, Math.min(14, Math.round(Number(raw?.followUpDurationDays) || 3))),
        followUpIntensity: intensity,
        followUpAffectedLocationIds: Array.isArray(raw?.followUpAffectedLocationIds) ? raw.followUpAffectedLocationIds.slice(0, 8).map(String) : undefined,
        followUpAffectedNpcIds: Array.isArray(raw?.followUpAffectedNpcIds) ? raw.followUpAffectedNpcIds.slice(0, 8).map(String) : undefined,
        followUpHomeImpact: clampText(raw?.followUpHomeImpact, '', 160) || undefined,
        followUpScheduleImpact: clampText(raw?.followUpScheduleImpact, '', 160) || undefined,
        followUpDailyUpdate: clampText(raw?.followUpDailyUpdate, '', 180) || undefined,
    };
}

function buildPrompt(char: CharacterProfile, today: string): string {
    const locations = getCharacterLocations(char).slice(0, 24).map(x => `${x.id}=${x.name}`).join('、') || '（暂无地图地点）';
    const npcs = getCharacterNpcs(char).slice(0, 18).map(x => `${x.id}=${x.name}(${x.relation})`).join('、') || '（暂无 NPC）';
    const city = char.worldMap?.referenceCity || '角色所在城市';
    return `为角色「${char.name}」的城市生活生成第一批可持续状态。允许明显戏剧化，但仍要能落到日程、家园、地图和 NPC。今天是 ${today}，城市是「${city}」。\n角色人设：${(char.description || char.systemPrompt || '').slice(0, 5000)}\n地图地点：${locations}\nNPC：${npcs}\n\n严格只输出 JSON：{"events":[...],"goals":[...]}。events 生成 20-80 条，分散在未来 60 天；每条含 id,title,category,description,startDate,endDate,durationDays(1-14),intensity(1-5),district,affectedLocationIds,affectedNpcIds,homeImpact,scheduleImpact,characterAwareness,dailyUpdate。每天 0-2 条常见事件，至少一部分持续 2-5 天。goals 生成 1-3 个 short（1-3个月）、1-3 个 mid（3-6个月）、1-3 个 long（6-12个月），每条含 id,title,horizon,description,progress(0-30),startDate,targetDate,nextAction,actionLocationId,relatedNpcIds,homeLink,scheduleLink,completionBenefit,setbackImpact。`;
}

export async function generateCityLife(char: CharacterProfile, api: CityLifeApiConfig): Promise<CharacterCityLifeState | null> {
    if (!api.baseUrl || !api.apiKey || !api.model) return null;
    const today = characterCityDate(char);
    try {
        const response = await fetch(`${api.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${api.apiKey}` },
            body: JSON.stringify({ model: api.model, messages: [{ role: 'user', content: buildPrompt(char, today) }], temperature: 0.9, max_tokens: 12000 }),
        });
        if (!response.ok) return null;
        const parsed = extractJson(extractContent(await safeResponseJson(response)));
        const events = (Array.isArray(parsed?.events) ? parsed.events : []).map((x: any, i: number) => normalizeEvent(x, i, today)).filter(Boolean).slice(0, 80) as CityLifeEvent[];
        const goals = (Array.isArray(parsed?.goals) ? parsed.goals : []).map((x: any, i: number) => normalizeGoal(x, i, today)).filter(Boolean).slice(0, 9) as CityLifeGoal[];
        const constrainedGoals = (['short', 'mid', 'long'] as const).flatMap(horizon => goals.filter(goal => goal.horizon === horizon).slice(0, 3));
        if (events.length < 20 || constrainedGoals.some(goal => !goal) || !constrainedGoals.some(goal => goal.horizon === 'short') || !constrainedGoals.some(goal => goal.horizon === 'mid') || !constrainedGoals.some(goal => goal.horizon === 'long')) return null;
        const state: CharacterCityLifeState = { generatedAt: Date.now(), cityName: char.worldMap?.referenceCity || '所在城市', events, goals: constrainedGoals, lastSettledDate: today };
        const nextChar = { ...char, cityLife: state };
        await DB.saveCharacter(nextChar);
        await syncCityLifeToTodaySchedule(nextChar);
        return state;
    } catch (error) { console.warn('[CityLife] generation failed', error); return null; }
}

function buildThreadPrompt(char: CharacterProfile, event: CityLifeEvent, today: string): string {
    const locations = getCharacterLocations(char).slice(0, 24).map(x => `${x.id}=${x.name}`).join('、') || '（暂无地图地点）';
    const npcs = getCharacterNpcs(char).slice(0, 18).map(x => `${x.id}=${x.name}(${x.relation})`).join('、') || '（暂无 NPC）';
    return [
        `为城市事件「${event.title}」生成一条可继续发展的 NPC 主导事件链。今天是 ${today}。允许明显戏剧化，但必须能落到已有地图地点、日程、家园和 NPC，不能凭空创建不存在的 NPC 或地点。`,
        `角色：${char.name}。人设：${(char.description || char.systemPrompt || '').slice(0, 3500)}`,
        `当前事件：${event.description}；影响日期：${event.startDate} 至 ${event.endDate}；影响地点：${(event.affectedLocationIds || []).join('、') || '未指定'}；影响 NPC：${(event.affectedNpcIds || []).join('、') || '未指定'}`,
        `地图地点：${locations}`,
        `NPC：${npcs}`,
        '严格只输出 JSON：{"title":"事件链标题","summary":"当前冲突或转折","leadNpcId":"主导 NPC ID","choices":[{"id":"choice-1","label":"选择按钮文字","description":"选择会怎样","outcome":"选择后的结果","followUpTitle":"后续事件标题","followUpDescription":"后续事件描述","followUpDurationDays":3,"followUpIntensity":3,"followUpAffectedLocationIds":[],"followUpAffectedNpcIds":[],"followUpHomeImpact":"家园影响","followUpScheduleImpact":"日程影响","followUpDailyUpdate":"每天变化"}]}。choices 必须正好 2-3 个，方向明显不同；leadNpcId 和所有 ID 只能从上面的索引中选择。',
    ].join('\n');
}

export async function generateEventThread(char: CharacterProfile, eventId: string, api: CityLifeApiConfig): Promise<CharacterCityLifeState | null> {
    const state = char.cityLife;
    const event = state?.events.find(item => item.id === eventId);
    if (!state || !event || !api.baseUrl || !api.apiKey || !api.model) return null;
    const existing = state.threads?.find(thread => thread.rootEventId === event.id && thread.status === 'open');
    if (existing) return state;
    try {
        const response = await fetch(`${api.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${api.apiKey}` },
            body: JSON.stringify({ model: api.model, messages: [{ role: 'user', content: buildThreadPrompt(char, event, characterCityDate(char)) }], temperature: 0.95, max_tokens: 5000 }),
        });
        if (!response.ok) return null;
        const parsed = extractJson(extractContent(await safeResponseJson(response)));
        const choices = (Array.isArray(parsed?.choices) ? parsed.choices : []).map(normalizeBranchChoice).filter(Boolean).slice(0, 3) as CityLifeBranchChoice[];
        if (choices.length < 2) return null;
        const locationIds = new Set(getCharacterLocations(char).map(location => location.id));
        const npcIds = new Set(getCharacterNpcs(char).map(npc => npc.id));
        const leadNpcId = npcIds.has(String(parsed?.leadNpcId || '')) ? String(parsed.leadNpcId) : event.affectedNpcIds?.find(id => npcIds.has(id));
        const normalizedChoices = choices.map(choice => ({
            ...choice,
            leadNpcId: choice.leadNpcId && npcIds.has(choice.leadNpcId) ? choice.leadNpcId : leadNpcId,
            followUpAffectedLocationIds: choice.followUpAffectedLocationIds?.filter(id => locationIds.has(id)),
            followUpAffectedNpcIds: choice.followUpAffectedNpcIds?.filter(id => npcIds.has(id)),
        }));
        const thread: CityLifeThread = {
            id: `city-thread-${Date.now()}`, rootEventId: event.id,
            title: clampText(parsed?.title, `${event.title}的后续`, 70),
            summary: clampText(parsed?.summary, '城市事件出现了新的转折。', 220),
            leadNpcId, choices: normalizedChoices, status: 'open', createdAt: Date.now(),
        };
        const next = { ...state, threads: [...(state.threads || []), thread] };
        await DB.saveCharacter({ ...char, cityLife: next });
        Object.assign(char, { cityLife: next });
        return next;
    } catch (error) {
        console.warn('[CityLife] thread generation failed', error);
        return null;
    }
}

export async function chooseEventBranch(char: CharacterProfile, threadId: string, choiceId: string): Promise<CharacterProfile> {
    const state = char.cityLife;
    const thread = state?.threads?.find(item => item.id === threadId);
    const choice = thread?.choices.find(item => item.id === choiceId);
    if (!state || !thread || !choice || thread.status !== 'open') return char;
    const today = characterCityDate(char);
    const startDate = addDays(today, 1);
    const followUpEvent: CityLifeEvent = {
        id: `city-event-chain-${Date.now()}`, parentEventId: thread.rootEventId,
        title: choice.followUpTitle, category: `事件链·${thread.title}`.slice(0, 24),
        description: choice.followUpDescription, startDate,
        endDate: addDays(startDate, choice.followUpDurationDays - 1), durationDays: choice.followUpDurationDays,
        intensity: choice.followUpIntensity, phase: 'upcoming',
        affectedLocationIds: choice.followUpAffectedLocationIds,
        affectedNpcIds: choice.followUpAffectedNpcIds?.length ? choice.followUpAffectedNpcIds : (choice.leadNpcId || thread.leadNpcId ? [choice.leadNpcId || thread.leadNpcId!] : undefined),
        homeImpact: choice.followUpHomeImpact, scheduleImpact: choice.followUpScheduleImpact,
        dailyUpdate: choice.followUpDailyUpdate, characterAwareness: `角色已知情：${choice.outcome}`,
    };
    const threads = (state.threads || []).map(item => item.id !== thread.id ? item : {
        ...item, status: 'resolved' as const, selectedChoiceId: choice.id,
        resolutionNote: choice.outcome, resolvedAt: Date.now(),
    });
    const next = { ...state, events: [...state.events, followUpEvent], threads };
    await DB.saveCharacter({ ...char, cityLife: next });
    Object.assign(char, { cityLife: next });
    await syncCityLifeToTodaySchedule(char);
    return char;
}

/** 每日幂等结算：推进多日事件、恢复短暂挫折，并清理过期事件。 */
export function settleCityLifeState(char: CharacterProfile, at = new Date()): CharacterCityLifeState | null {
    const state = char.cityLife;
    if (!state) return null;
    const today = characterCityDate(char, at);
    const events: CityLifeEvent[] = state.events.map(event => ({
        ...event,
        phase: eventPhaseAt(event, today),
    })).filter(event => event.phase !== 'ended');
    const goals = state.goals.map(goal => {
        // 保留截止日作为结算记录；这样离线补算前几天时，仍能知道当时目标处于受挫恢复期。
        if (goal.setbackUntil && goal.setbackUntil <= today) return { ...goal, status: 'active' as const };
        return goal;
    });
    return { ...state, events, goals, lastSettledDate: today };
}

export async function settleCityLife(char: CharacterProfile, at = new Date()): Promise<CharacterProfile> {
    const next = settleCityLifeState(char, at);
    if (!next) return char;
    const settlementDates = datesToSettle(char.cityLife?.lastSettledDate, next.lastSettledDate!);
    for (const settledDate of settlementDates) {
        const schedule = await DB.getDailySchedule(char.id, settledDate).catch(() => null);
        const scheduledActions = new Set(schedule?.slots.flatMap(slot => slot.goalIds || []) || []);
        next.goals = next.goals.map(goal => {
            if (goal.status === 'completed') return goal;
            if (goal.setbackUntil && settledDate < goal.setbackUntil) return goal;
            if (goal.status === 'setback' && goal.setbackUntil && settledDate >= goal.setbackUntil) goal = { ...goal, status: 'active' as const };
            if (goal.status === 'active' && scheduledActions.has(goal.id) && goal.lastAdvancedDate !== settledDate) {
                const progress = Math.min(100, goal.progress + 8);
                return { ...goal, progress, status: progress >= 100 ? 'completed' as const : 'active' as const, lastAdvancedDate: settledDate };
            }
            if (goal.status === 'active' && goal.targetDate < settledDate) {
                return { ...goal, status: 'setback' as const, setbackUntil: addDays(settledDate, 10), targetDate: addDays(goal.targetDate, 14) };
            }
            return goal;
        });
    }
    const changed = JSON.stringify(next) !== JSON.stringify(char.cityLife);
    if (!changed) {
        await syncCityLifeToTodaySchedule(char);
        return char;
    }
    await DB.saveCharacter({ ...char, cityLife: next });
    Object.assign(char, { cityLife: next });
    await syncCityLifeToTodaySchedule(char);
    return char;
}

export function getActiveCityEvents(char: CharacterProfile, date = characterCityDate(char)): CityLifeEvent[] {
    return (char.cityLife?.events || []).filter(event => eventPhaseAt(event, date) === 'active');
}

export function getRelevantCityEvents(char: CharacterProfile, date = characterCityDate(char)): Array<CityLifeEvent & { phase: NonNullable<CityLifeEvent['phase']> }> {
    return (char.cityLife?.events || []).map(event => ({ ...event, phase: eventPhaseAt(event, date) }))
        .filter(event => event.phase === 'active' || event.phase === 'aftermath' || (event.phase === 'upcoming' && event.startDate <= addDays(date, 2)))
        .sort((a, b) => a.startDate.localeCompare(b.startDate) || b.intensity - a.intensity)
        .slice(0, 8);
}

export function buildCityLifeContext(char: CharacterProfile, date = characterCityDate(char)): string {
    const events = getRelevantCityEvents(char, date);
    const goals = (char.cityLife?.goals || []).filter(goal => goal.status !== 'completed').slice(0, 9);
    const completedGoals = (char.cityLife?.goals || []).filter(goal => goal.status === 'completed').slice(0, 3);
    const threads = (char.cityLife?.threads || []).slice(-5);
    if (!events.length && !goals.length && !completedGoals.length && !threads.length) return '';
    const lines = ['### 【城市事件与人生目标】', `今日：${date}`];
    events.forEach(event => {
        const phase = event.phase === 'upcoming' ? '预告' : event.phase === 'active' ? '进行中' : '余波';
        const phaseImpact = event.phase === 'upcoming'
            ? '角色应提前得知、预留准备或调整出行，不要当作已经发生。'
            : event.phase === 'active'
                ? '事件正在发生，日程、家园行动、地点与 NPC 反应必须受此影响。'
                : '事件刚结束，保留清理、恢复、讨论或情绪余韵，不要继续写成高峰现场。';
        lines.push(`- 城市事件「${event.title}」[${event.category}/${phase}]：${event.description}；影响 ${event.startDate} 至 ${event.endDate}；${phaseImpact} 日程影响：${event.scheduleImpact || '按实际情况调整'}；家园影响：${event.homeImpact || '留意居住空间变化'}；知情：${event.characterAwareness || '角色已知情'}`);
    });
    goals.forEach(goal => lines.push(`- ${goal.horizon === 'short' ? '短期' : goal.horizon === 'mid' ? '中期' : '远期'}目标「${goal.title}」：${goal.progress}%；预计 ${goal.targetDate} 完成；下一步：${goal.nextAction}；${goal.status === 'setback' ? `正处于短暂受挫期（至 ${goal.setbackUntil || '恢复日'}），影响：${goal.setbackImpact}；` : ''}关联家园：${goal.homeLink || '无'}；日程：${goal.scheduleLink || '安排专注时段'}`));
    completedGoals.forEach(goal => lines.push(`- 已完成目标「${goal.title}」：正面影响是${goal.completionBenefit}。角色应把这项收获自然带入近期家园生活、日程反馈与和 NPC 的互动。`));
    threads.forEach(thread => {
        if (thread.status === 'open') {
            lines.push(`- 事件链「${thread.title}」正在等待处理：${thread.summary}；由 NPC ${thread.leadNpcId || '相关人物'} 推动。角色知道可选方向：${thread.choices.map(choice => choice.label).join('、')}。`);
        } else if (thread.resolutionNote) {
            lines.push(`- 事件链「${thread.title}」已作出选择，结果：${thread.resolutionNote}。后续影响应继续体现在日程、家园、地图和 NPC 互动中。`);
        }
    });
    lines.push('这些是角色已经知道的事实。日程、家园、地图和 NPC 反应必须与之保持一致。');
    return lines.join('\n');
}

export function applyCityLifeToSchedule(char: CharacterProfile, schedule: DailySchedule): DailySchedule {
    const active = getActiveCityEvents(char, schedule.date);
    const goals = (char.cityLife?.goals || []).filter(g => g.status === 'active').sort((a, b) => a.horizon.localeCompare(b.horizon)).slice(0, 1);
    if (!active.length && !goals.length) return schedule;
    const linkedSlots = schedule.slots.map(slot => {
        const affecting = active.filter(event => !event.affectedLocationIds?.length || event.affectedLocationIds.includes(slot.locationId || ''));
        return affecting.length ? {
            ...slot,
            cityEventIds: Array.from(new Set([...(slot.cityEventIds || []), ...affecting.map(event => event.id)])),
            worldEvent: [slot.worldEvent, ...affecting.map(event => event.dailyUpdate || event.scheduleImpact || event.description)].filter(Boolean).join('；').slice(0, 180),
        } : slot;
    });
    const goal = goals[0];
    if (goal && linkedSlots.length) {
        const goalSlotIndex = Math.max(0, linkedSlots.length - 2);
        const goalSlot = linkedSlots[goalSlotIndex];
        const location = locationById(char, goal.actionLocationId);
        linkedSlots[goalSlotIndex] = {
            ...goalSlot,
            goalIds: Array.from(new Set([...(goalSlot.goalIds || []), goal.id])),
            description: `${goalSlot.description || goalSlot.activity}；目标行动：${goal.nextAction}`.slice(0, 220),
            ...(location ? { locationId: location.id, location: location.name } : {}),
            ...(goal.relatedNpcIds?.length ? { participantNpcIds: Array.from(new Set([...(goalSlot.participantNpcIds || []), ...goal.relatedNpcIds])) } : {}),
        };
    }
    return { ...schedule, slots: linkedSlots };
}

/** 城市状态在日程已经生成后才创建或发生变化时，仍立即补上当天的联动行动。 */
async function syncCityLifeToTodaySchedule(char: CharacterProfile): Promise<void> {
    const today = characterCityDate(char);
    const schedule = await DB.getDailySchedule(char.id, today).catch(() => null);
    if (!schedule) return;
    const linked = applyCityLifeToSchedule(char, schedule);
    if (JSON.stringify(linked) !== JSON.stringify(schedule)) await DB.saveDailySchedule(linked);
}

export async function advanceGoal(char: CharacterProfile, goalId: string, amount = 15): Promise<CharacterProfile> {
    const state = char.cityLife; if (!state) return char;
    const goals = state.goals.map(goal => goal.id !== goalId ? goal : { ...goal, progress: Math.min(100, goal.progress + amount), status: goal.progress + amount >= 100 ? 'completed' as const : 'active' as const, lastAdvancedDate: characterCityDate(char) });
    const next = { ...state, goals };
    await DB.saveCharacter({ ...char, cityLife: next }); Object.assign(char, { cityLife: next }); await syncCityLifeToTodaySchedule(char); return char;
}

export async function recordGoalSetback(char: CharacterProfile, goalId: string): Promise<CharacterProfile> {
    const state = char.cityLife; if (!state) return char;
    const until = addDays(characterCityDate(char), 10);
    const goals = state.goals.map(goal => goal.id !== goalId ? goal : { ...goal, status: 'setback' as const, setbackUntil: until, targetDate: addDays(goal.targetDate, 14) });
    const next = { ...state, goals }; await DB.saveCharacter({ ...char, cityLife: next }); Object.assign(char, { cityLife: next }); await syncCityLifeToTodaySchedule(char); return char;
}
