import type { CharacterProfile, DailySchedule, ScheduleSlot, WorldCharBeat, WorldDaySegmentKey, WorldLifePlan, WorldProfile } from '../../types';
import { DB } from '../db';
import { extractContent, extractJson, safeFetchJson } from '../safeApi';
import { getLocalDateKey } from '../localDate';
import { worldNow } from './prompts';
import { getCharacterNpcs, locationById, locationByName } from '../characterWorld';

type ApiConfig = { baseUrl: string; apiKey: string; model: string };

const SEGMENTS: WorldDaySegmentKey[] = ['morning', 'noon', 'evening', 'latenight'];
const SEGMENT_LABEL: Record<WorldDaySegmentKey, string> = {
    morning: '早上（06:00-11:59）',
    noon: '中午（12:00-17:59）',
    evening: '晚上（18:00-23:59）',
    latenight: '凌晨（00:00-05:59，属于前一晚的延续）',
};
const pendingPlans = new Map<string, Promise<WorldLifePlan | null>>();

export function worldSegmentForHour(hour: number): WorldDaySegmentKey {
    if (hour < 6) return 'latenight';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'noon';
    return 'evening';
}

export function worldSegmentFromClock(world: WorldProfile): WorldDaySegmentKey {
    const segment = world.realClock?.seg;
    const key = typeof segment === 'number' ? SEGMENTS[segment] : worldSegmentForHour(worldNow(world).getHours());
    return key || 'morning';
}

export function worldLifeDayKey(world: WorldProfile): string {
    return getLocalDateKey(worldNow(world));
}

/** Find the one active real-time home that owns this character's linked daily life. */
export async function getLinkedWorldForCharacter(charId: string): Promise<WorldProfile | null> {
    const worlds = await DB.getWorlds();
    return worlds.find(world =>
        world.lifeLinkEnabled === true
        && (world.timeMode || 'real') === 'real'
        && world.memberIds.includes(charId)
    ) || null;
}

function cleanMemberPlan(raw: any, charId: string) {
    const activity = String(raw?.activity || '').trim();
    const location = String(raw?.location || '').trim();
    if (!activity || !location) return null;
    return {
        charId,
        activity: activity.slice(0, 40),
        location: location.slice(0, 60),
        locationId: typeof raw?.locationId === 'string' ? raw.locationId.trim() || undefined : undefined,
        description: String(raw?.description || '').trim().slice(0, 180) || undefined,
        mood: String(raw?.mood || '').trim().slice(0, 24) || undefined,
        participantNpcIds: Array.isArray(raw?.participantNpcIds)
            ? raw.participantNpcIds.map((id: unknown) => String(id || '').trim()).filter(Boolean).slice(0, 8)
            : undefined,
    };
}

function normalizeLifePlan(raw: any, world: WorldProfile, members: CharacterProfile[], dayKey: string): WorldLifePlan | null {
    if (!Array.isArray(raw?.segments)) return null;
    const byKey = new Map<string, any>(raw.segments.map((segment: any) => [segment?.key, segment]));
    const segments = SEGMENTS.map(key => {
        const source = byKey.get(key);
        if (!source) return null;
        const memberById = new Map<string, any>();
        for (const item of Array.isArray(source.members) ? source.members : []) {
            const char = members.find(member => member.id === item?.charId || member.name === item?.name);
            if (char) memberById.set(char.id, item);
        }
        const plannedMembers = members
            .map(member => cleanMemberPlan(memberById.get(member.id), member.id))
            .filter(Boolean);
        if (plannedMembers.length !== members.length) return null;
        return {
            key,
            event: String(source.event || '').trim().slice(0, 220) || `${world.name}的${SEGMENT_LABEL[key]}生活`,
            members: plannedMembers,
        };
    });
    if (segments.some(segment => !segment)) return null;
    return { dayKey, generatedAt: Date.now(), segments: segments as WorldLifePlan['segments'] };
}

function buildLifePlanPrompt(world: WorldProfile, members: CharacterProfile[], dayKey: string, recentSummary: string): string {
    const residents = members.map(member => {
        const persona = (member.description || member.systemPrompt || '').replace(/\s+/g, ' ').trim().slice(0, 260);
        const places = Array.isArray(member.worldMap?.locations)
            ? member.worldMap!.locations.slice(0, 24).map(location => `${location.id}=${location.name}`).join('、')
            : '';
        const npcs = getCharacterNpcs(member).slice(0, 16).map(npc => `${npc.id}=${npc.name}`).join('、');
        return `- ${member.name}（id: ${member.id}）：${persona || '请按已有角色设定安排'}${places ? `\n  地图地点（必须优先使用 ID）：${places}` : ''}${npcs ? `\n  可同行 NPC：${npcs}` : ''}`;
    }).join('\n');
    return `你是共同家园「${world.name}」的当日生活规划器。现在要为 ${dayKey} 先排出共同生活的四段骨架；这只是计划，不是已经发生的剧情。

## 世界观
${world.worldview || '一个安静、真实的共同生活世界'}

## 住户
${residents}

## 最近世界进展
${recentSummary || '（暂无，安排一个自然、有生活感的开始）'}

## 时间段
${SEGMENTS.map(key => `- ${key}: ${SEGMENT_LABEL[key]}`).join('\n')}

要求：
1. 每个时间段都给每位住户一份安排；安排之间可以在地点、事件或人物上产生自然关联，但不要让所有人整天绑定在一起。
2. 这是日程骨架：活动要真实、具体、能被后续剧情合理打断；不要写已经发生的结果，不要替角色做重大决定。
3. 同一角色四段安排要连贯，贴合其职业、性格与世界观。凌晨是上一晚的收尾，不要排成新的清晨活动。
4. event 是该段可供多人接住的公共背景事件；没有公共事件时也写平静的生活背景。
5. 严格输出 JSON，不要 Markdown：
{
  "segments": [
    {
      "key": "morning",
      "event": "这一段的共同背景",
      "members": [
        { "charId": "角色id", "activity": "2-8字活动", "location": "地点", "locationId": "地图地点ID（如果上下文有）", "participantNpcIds": ["同行NPC ID（如果有）"], "description": "一句具体安排", "mood": "1-4字心情" }
      ]
    }
  ]
}`;
}

/** Generate at most once per world-local day. It plans life but never advances a world episode. */
export async function ensureWorldLifePlan(world: WorldProfile, api: ApiConfig): Promise<WorldLifePlan | null> {
    if (!world.lifeLinkEnabled || (world.timeMode || 'real') !== 'real' || !api.baseUrl) return null;
    const dayKey = worldLifeDayKey(world);
    if (world.lifePlan?.dayKey === dayKey && world.lifePlan.segments?.length === SEGMENTS.length) return world.lifePlan;

    const pendingKey = `${world.id}:${dayKey}`;
    const pending = pendingPlans.get(pendingKey);
    if (pending) return pending;

    const task = (async () => {
        try {
            const allCharacters = await DB.getAllCharacters();
            const members = world.memberIds.map(id => allCharacters.find(char => char.id === id)).filter(Boolean) as CharacterProfile[];
            if (members.length === 0) return null;
            const recent = await DB.getWorldEpisodes(world.id, 1);
            const data = await safeFetchJson(`${api.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${api.apiKey || 'sk-none'}` },
                body: JSON.stringify({
                    model: api.model,
                    messages: [{ role: 'user', content: buildLifePlanPrompt(world, members, dayKey, recent[0]?.summary || '') }],
                    temperature: 0.8,
                    max_tokens: 5000,
                }),
            }, 1, 0, { appName: '家园', purpose: `生成当日生活计划 · ${world.name}` });
            const parsed = extractJson(extractContent(data));
            const plan = normalizeLifePlan(parsed, world, members, dayKey);
            if (!plan) return null;
            await DB.saveWorld({ ...world, lifePlan: plan, updatedAt: Date.now() });
            return plan;
        } catch (error) {
            console.warn('[WorldHome] daily life plan failed:', error);
            return null;
        } finally {
            pendingPlans.delete(pendingKey);
        }
    })();
    pendingPlans.set(pendingKey, task);
    return task;
}

export type WorldLifeContext = {
    world: WorldProfile;
    plan: WorldLifePlan;
    member: WorldLifePlan['segments'][number]['members'][number];
};

export async function getWorldLifeContextForCharacter(charId: string, api: ApiConfig): Promise<WorldLifeContext | null> {
    const world = await getLinkedWorldForCharacter(charId);
    if (!world) return null;
    const plan = await ensureWorldLifePlan(world, api);
    if (!plan) return null;
    const member = plan.segments.flatMap(segment => segment.members).find(item => item.charId === charId);
    return member ? { world, plan, member } : null;
}

export function formatWorldLifeContext(context: WorldLifeContext): string {
    const planLines = context.plan.segments.map(segment => {
        const mine = segment.members.find(member => member.charId === context.member.charId);
        const location = mine?.locationId || mine?.location;
        const npcNames = (mine?.participantNpcIds || [])
            .map(id => context.world.npcs.find(npc => npc.id === id)?.name)
            .filter(Boolean)
            .join('、');
        return `- ${SEGMENT_LABEL[segment.key]}：家园背景「${segment.event}」；你的安排「${mine?.activity || '自然生活'}」${location ? `（${location}）` : ''}${npcNames ? `；同行：${npcNames}` : ''}${mine?.description ? `，${mine.description}` : ''}`;
    }).join('\n');
    return `\n## 家园当日生活计划（必须遵循）\n你正在共同家园「${context.world.name}」中生活。以下是今天的共享生活骨架；请把日程展开得丰富具体，但不得和这些已定的地点、公共事件、关系安排冲突。每个早/中/晚/凌晨段至少安排一条细日程。\n${planLines}\n`;
}

/** 家园计划给出的地点是日程的硬约束；细日程可以更细，但不能换到另一个地方。 */
export function enforceWorldLifePlanOnSchedule(
    char: CharacterProfile,
    slots: ScheduleSlot[],
    context: WorldLifeContext,
): ScheduleSlot[] {
    return slots.map(slot => {
        const hour = Number(slot.startTime.split(':')[0] || 0);
        const segment = slot.worldSegment || worldSegmentForHour(hour);
        const member = context.plan.segments.find(item => item.key === segment)?.members.find(item => item.charId === context.member.charId);
        if (!member?.location) return slot;
        const location = member.locationId
            ? locationById(char, member.locationId)
            : locationByName(char, member.location);
        if (!location) return slot;
        const participantNpcIds = (member.participantNpcIds || [])
            .filter(id => getCharacterNpcs(char).some(npc => npc.id === id));
        return {
            ...slot,
            locationId: location.id,
            location: location.name,
            ...(participantNpcIds.length > 0 ? { participantNpcIds } : {}),
        };
    });
}

/** 日程重生成后回写家园计划，下一次家园演绎读取同一份地点和活动事实。 */
export async function syncScheduleToWorldLifePlan(schedule: DailySchedule): Promise<void> {
    const world = await getLinkedWorldForCharacter(schedule.charId);
    if (!world?.lifePlan || world.lifePlan.dayKey !== schedule.date) return;
    const characters = await DB.getAllCharacters();
    const char = characters.find(item => item.id === schedule.charId);
    if (!char) return;
    const nextSegments = world.lifePlan.segments.map(segment => {
        const segmentSlots = schedule.slots.filter(slot => (slot.worldSegment || worldSegmentForHour(Number(slot.startTime.split(':')[0] || 0))) === segment.key);
        if (segmentSlots.length === 0) return segment;
        const first = segmentSlots[0];
        const location = first.locationId ? locationById(char, first.locationId) : locationByName(char, first.location);
        const participantNpcIds = Array.from(new Set(segmentSlots.flatMap(slot => slot.participantNpcIds || [])))
            .filter(id => getCharacterNpcs(char).some(npc => npc.id === id));
        return {
            ...segment,
            members: segment.members.map(member => member.charId !== schedule.charId ? member : {
                ...member,
                activity: first.activity || member.activity,
                location: location?.name || first.location || member.location,
                locationId: location?.id || first.locationId || member.locationId,
                description: first.description || member.description,
                participantNpcIds: participantNpcIds.length > 0 ? participantNpcIds : member.participantNpcIds,
            }),
        };
    });
    await DB.saveWorld({
        ...world,
        lifePlan: { ...world.lifePlan, generatedAt: Date.now(), segments: nextSegments },
        updatedAt: Date.now(),
    });
}

/** Feed actual observed world facts into the linked schedule without replacing its detailed activities. */
export async function syncWorldBeatToSchedule(world: WorldProfile, beat: WorldCharBeat): Promise<void> {
    if (!world.lifeLinkEnabled || (world.timeMode || 'real') !== 'real' || !world.lifePlan) return;
    const schedule = await DB.getDailySchedule(beat.charId, world.lifePlan.dayKey);
    if (!schedule?.worldLink || schedule.worldLink.worldId !== world.id) return;
    const segment = worldSegmentFromClock(world);
    const event = (beat.timeline || []).map(item => item.event).filter(Boolean).join('；') || beat.narrative.slice(0, 120);
    if (!event) return;
    const char = (await DB.getAllCharacters()).find(item => item.id === beat.charId);
    const observedLocation = char ? locationByName(char, beat.location) : undefined;
    const slots = schedule.slots.map(slot => slot.worldSegment === segment
        ? {
            ...slot,
            worldEvent: event.slice(0, 180),
            worldMood: beat.mood,
            ...(observedLocation ? { locationId: observedLocation.id, location: observedLocation.name } : {}),
        }
        : slot);
    await DB.saveDailySchedule({ ...schedule, slots });
    if (observedLocation) {
        const lifePlan = {
            ...world.lifePlan,
            generatedAt: Date.now(),
            segments: world.lifePlan.segments.map(item => item.key !== segment ? item : ({
                ...item,
                members: item.members.map(member => member.charId !== beat.charId ? member : {
                    ...member,
                    location: observedLocation.name,
                    locationId: observedLocation.id,
                }),
            })),
        };
        await DB.saveWorld({ ...world, lifePlan, updatedAt: Date.now() });
    }
}
