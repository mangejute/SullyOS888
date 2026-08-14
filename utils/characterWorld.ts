import type { CharacterProfile, CharacterWorldLocation, CharacterWorldNpc, CharacterWorldState, DailySchedule, ScheduleSlot } from '../types';
import { nowInTimeZone, resolveCharTimeZone } from './timezone';

type LegacyNpcEnvelope = { sourceText?: string; npcs?: CharacterWorldNpc[]; updatedAt?: number };

export function getCharacterLocations(char: CharacterProfile): CharacterWorldLocation[] {
    return Array.isArray(char.worldMap?.locations) ? char.worldMap!.locations : [];
}

export function getCharacterNpcs(char: CharacterProfile): CharacterWorldNpc[] {
    const value = char.worldNpcs as CharacterWorldNpc[] | LegacyNpcEnvelope | undefined;
    if (Array.isArray(value)) return value;
    return Array.isArray(value?.npcs) ? value.npcs : [];
}

export function getCharacterWorldState(char: CharacterProfile): CharacterWorldState {
    const locations = getCharacterLocations(char);
    const npcs = getCharacterNpcs(char);
    const home = char.worldState?.homeLocationId || locations.find(x => x.isHome)?.id;
    const work = char.worldState?.workLocationId || locations.find(x => x.isWork)?.id;
    const current = char.worldState?.currentLocationId || home || work;
    return {
        mapVersion: char.worldState?.mapVersion || 1,
        ...char.worldState,
        homeLocationId: home,
        workLocationId: work,
        frequentLocationIds: char.worldState?.frequentLocationIds || locations.filter(x => !x.isHome && !x.isWork).slice(0, 3).map(x => x.id),
        currentLocationId: current,
    };
}

export function locationById(char: CharacterProfile, id?: string): CharacterWorldLocation | undefined {
    return id ? getCharacterLocations(char).find(location => location.id === id) : undefined;
}

export function locationByName(char: CharacterProfile, name?: string): CharacterWorldLocation | undefined {
    const normalized = (name || '').trim().toLowerCase();
    if (!normalized) return undefined;
    return getCharacterLocations(char).find(location => location.name.trim().toLowerCase() === normalized)
        || getCharacterLocations(char).find(location => normalized.includes(location.name.trim().toLowerCase()) || location.name.trim().toLowerCase().includes(normalized));
}

export function resolveSlotLocation(char: CharacterProfile, slot: ScheduleSlot): CharacterWorldLocation | undefined {
    return locationById(char, slot.locationId) || locationByName(char, slot.location);
}

/** 规范化 AI/旧日程输出：地点名只用于展示，内部始终优先使用 locationId。 */
export function normalizeScheduleSlot(char: CharacterProfile, slot: ScheduleSlot): ScheduleSlot {
    const resolved = resolveSlotLocation(char, slot);
    const knownNpcIds = new Set(getCharacterNpcs(char).map(npc => npc.id));
    return {
        ...slot,
        ...(resolved ? { locationId: resolved.id, location: resolved.name } : {}),
        travelMinutes: Number.isFinite(slot.travelMinutes) ? slot.travelMinutes : undefined,
        participantNpcIds: Array.isArray(slot.participantNpcIds)
            ? slot.participantNpcIds.filter(id => Boolean(id) && knownNpcIds.has(id))
            : undefined,
    };
}

/** 给日程补齐地点之间的移动时间，并保留无法在地图上连通的警告信息。 */
export function applyScheduleTravelModel(char: CharacterProfile, slots: ScheduleSlot[]): ScheduleSlot[] {
    let previous = getCharacterWorldState(char).homeLocationId;
    return slots.map(slot => {
        const location = resolveSlotLocation(char, slot);
        const minutes = location && previous ? travelMinutesBetween(char, previous, location.id) : undefined;
        const next = {
            ...slot,
            ...(location ? { locationId: location.id, location: location.name } : {}),
            ...(slot.travelMinutes == null && minutes != null ? { travelMinutes: minutes } : {}),
        };
        if (location) previous = location.id;
        return next;
    });
}

export function currentScheduleSlot(schedule: DailySchedule | null, now = new Date()): ScheduleSlot | null {
    if (!schedule?.slots?.length) return null;
    const minutes = now.getHours() * 60 + now.getMinutes();
    let current: ScheduleSlot | null = null;
    for (const slot of schedule.slots) {
        const [h, m] = slot.startTime.split(':').map(Number);
        if (Number.isFinite(h) && Number.isFinite(m) && minutes >= h * 60 + m) current = slot;
    }
    return current;
}

export function buildCharacterWorldContext(char: CharacterProfile, schedule?: DailySchedule | null, now = new Date()): string {
    const locations = getCharacterLocations(char);
    const npcs = getCharacterNpcs(char);
    if (locations.length === 0 && npcs.length === 0 && !char.worldState) return '';
    const state = getCharacterWorldState(char);
    const active = currentScheduleSlot(schedule || null, now);
    const activeLocation = resolveSlotLocation(char, active || {} as ScheduleSlot);
    // 日程是当前地点的唯一事实源；worldState 只是未生成日程时的持久化缓存。
    const current = activeLocation || locationById(char, state.currentLocationId);
    const home = locationById(char, state.homeLocationId);
    const work = locationById(char, state.workLocationId);
    // 地图是完整资料库，但聊天只需要此刻可影响行动的那一小块。
    // 否则地点和 NPC 越积越多，每一轮对话都会无意义地膨胀上下文。
    const relevantLocationIds = new Set<string>([
        current?.id,
        state.homeLocationId,
        state.workLocationId,
        resolveSlotLocation(char, active || {} as ScheduleSlot)?.id,
    ].filter(Boolean) as string[]);
    for (const id of Array.from(relevantLocationIds)) {
        locationById(char, id)?.connectedLocationIds?.forEach(linkedId => relevantLocationIds.add(linkedId));
    }
    const contextLocations = locations.filter(location => relevantLocationIds.has(location.id));
    if (!contextLocations.length) contextLocations.push(...locations.slice(0, 12));
    const samePlaceNpcs = npcs.filter(npc => npc.currentLocationId && npc.currentLocationId === current?.id);
    const relatedNpcs = npcs.filter(npc =>
        npc.currentLocationId && relevantLocationIds.has(npc.currentLocationId)
        || npc.homeLocationId && relevantLocationIds.has(npc.homeLocationId)
        || npc.workLocationId && relevantLocationIds.has(npc.workLocationId)
    );
    const contextNpcs = Array.from(new Map([...samePlaceNpcs, ...relatedNpcs, ...npcs].map(npc => [npc.id, npc])).values()).slice(0, 20);
    const lines: string[] = ['### 【你的城市世界状态】', '以下是地图、NPC、日程和家园共同使用的事实。地点必须优先按 ID 理解，不要凭空改名或瞬移。'];
    if (char.worldMap?.referenceCity) lines.push(`参考城市：${char.worldMap.referenceCity}`);
    if (current) lines.push(`当前所在：${current.name}（${current.description || current.purpose}）`);
    if (home) lines.push(`你的家：${home.name}`);
    if (work) lines.push(`你的工作场所：${work.name}`);
    if (active) {
        lines.push(`当前日程：${active.startTime} ${active.activity}${activeLocation ? `，地点=${activeLocation.name}` : active.location ? `，地点=${active.location}` : ''}`);
        const activeNpcNames = (active.participantNpcIds || [])
            .map(id => findNpcById(char, id)?.name)
            .filter(Boolean)
            .join('、');
        if (activeNpcNames) lines.push(`当前同行 NPC：${activeNpcNames}`);
        if (active.worldEvent) lines.push(`当前家园实况：${active.worldEvent}${active.worldMood ? `（${active.worldMood}）` : ''}`);
    }
    if (schedule?.slots?.length) {
        lines.push('今日已确定日程（地点和同行者必须保持一致）：');
        for (const slot of schedule.slots) {
            const slotLocation = resolveSlotLocation(char, slot);
            const slotNpcNames = (slot.participantNpcIds || [])
                .map(id => findNpcById(char, id)?.name)
                .filter(Boolean)
                .join('、');
            lines.push(`- ${slot.startTime} ${slot.activity}${slotLocation ? `｜地点：${slotLocation.name}` : slot.location ? `｜地点：${slot.location}` : ''}${slotNpcNames ? `｜同行：${slotNpcNames}` : ''}`);
        }
    }
    if (locations.length) {
        lines.push('地点索引：');
        for (const location of contextLocations.slice(0, 24)) {
            const links = location.connectedLocationIds?.map(id => locationById(char, id)?.name).filter(Boolean).join('、');
            lines.push(`- ${location.id}｜${location.name}｜${location.purpose || location.category}${links ? `｜相连：${links}` : ''}`);
        }
        if (locations.length > contextLocations.length) lines.push(`（其余 ${locations.length - contextLocations.length} 个远处地点暂不展开，用户明确提到时再按地图资料理解。）`);
    }
    if (npcs.length) {
        lines.push('附近与关系网络：');
        const samePlace = samePlaceNpcs.map(npc => npc.name);
        if (samePlace.length) lines.push(`同地点 NPC：${samePlace.join('、')}（可以自然相遇，但不要替他们编造内心）`);
        for (const npc of contextNpcs) {
            const rawNpc = npc as CharacterWorldNpc & { homeLocationName?: string; workLocationName?: string; frequentLocationNames?: string[] };
            const npcLocation = locationById(char, npc.currentLocationId || npc.workLocationId || npc.homeLocationId)
                || locationByName(char, rawNpc.workLocationName || rawNpc.homeLocationName || rawNpc.frequentLocationNames?.[0]);
            lines.push(`- ${npc.id}｜${npc.name}｜${npc.role}｜年龄：${npc.age}｜性别：${npc.gender}｜关系：${npc.relation}${npcLocation ? `｜常在：${npcLocation.name}` : ''}${npc.description ? `｜${npc.description}` : ''}`);
        }
        if (npcs.length > contextNpcs.length) lines.push(`（其余 ${npcs.length - contextNpcs.length} 位 NPC 不在当前场景，不要主动让他们出现。）`);
    }
    lines.push('行动约束：当前时间段优先服从日程地点和同行 NPC；从一个地点去另一个地点需要经过相连地点或合理的移动时间。只有明确发生了移动，才在后续时间段改变地点。');
    return lines.join('\n') + '\n';
}

export function findNpcById(char: CharacterProfile, id?: string): CharacterWorldNpc | undefined {
    return id ? getCharacterNpcs(char).find(npc => npc.id === id) : undefined;
}

export function deriveWorldStatePatch(char: CharacterProfile, slot?: ScheduleSlot, now = Date.now()): Partial<CharacterWorldState> {
    const resolved = slot ? resolveSlotLocation(char, slot) : undefined;
    return {
        mapVersion: getCharacterWorldState(char).mapVersion,
        ...(resolved ? { currentLocationId: resolved.id, currentLocationSince: now } : {}),
        ...(slot ? { lastScheduleId: `${char.id}:${slot.startTime}`, lastTransitionAt: now } : {}),
    };
}

export function travelMinutesBetween(char: CharacterProfile, fromId?: string, toId?: string): number | undefined {
    if (!fromId || !toId || fromId === toId) return 0;
    const from = locationById(char, fromId);
    const direct = from?.travelMinutes?.[toId];
    if (Number.isFinite(direct)) return direct;
    if (from?.connectedLocationIds?.includes(toId)) {
        const target = locationById(char, toId);
        if (target && from) return Math.max(3, Math.round(Math.hypot(from.x - target.x, from.y - target.y) * 0.7));
    }
    return undefined;
}

function npcLocationForClock(char: CharacterProfile, npc: CharacterWorldNpc, hour: number): string | undefined {
    const raw = npc as CharacterWorldNpc & { homeLocationName?: string; workLocationName?: string; frequentLocationNames?: string[] };
    const home = npc.homeLocationId || locationByName(char, raw.homeLocationName)?.id;
    const work = npc.workLocationId || locationByName(char, raw.workLocationName)?.id;
    const frequent = npc.frequentLocationIds?.[0] || locationByName(char, raw.frequentLocationNames?.[0])?.id;
    if (hour < 7 || hour >= 22) return home || work || frequent;
    if (hour >= 8 && hour < 18) return work || frequent || home;
    return frequent || home || work;
}

/** 根据当前日程和世界钟计算角色/NPC位置，不负责持久化。 */
export function deriveCharacterWorldClock(char: CharacterProfile, schedule: DailySchedule | null, at = new Date()): CharacterProfile | null {
    if (!char.worldMap && !char.worldNpcs && !char.worldState) return null;
    const localNow = nowInTimeZone(resolveCharTimeZone(char), at);
    const active = currentScheduleSlot(schedule, localNow);
    const oldState = getCharacterWorldState(char);
    const target = active ? resolveSlotLocation(char, active) : locationById(char, oldState.currentLocationId);
    const now = at.getTime();
    const currentLocationId = target?.id || oldState.currentLocationId;
    const stateChanged = currentLocationId !== oldState.currentLocationId;
    const travelMinutes = stateChanged ? travelMinutesBetween(char, oldState.currentLocationId, currentLocationId) : undefined;
    const nextState: CharacterWorldState = {
        ...oldState,
        ...(currentLocationId ? { currentLocationId } : {}),
        ...(stateChanged ? {
            currentLocationSince: now,
            lastTransitionAt: now,
            lastTravelFromLocationId: oldState.currentLocationId,
            lastTravelToLocationId: currentLocationId,
            ...(travelMinutes != null ? { lastTravelMinutes: travelMinutes } : {}),
        } : {}),
        ...(active ? { lastScheduleId: `${char.id}:${schedule?.date || ''}:${active.startTime}` } : {}),
    };
    const npcs = getCharacterNpcs(char);
    const hour = localNow.getHours();
    const nextNpcs = npcs.map(npc => ({ ...npc, currentLocationId: npcLocationForClock(char, npc, hour) || npc.currentLocationId }));
    const npcsChanged = nextNpcs.some((npc, i) => npc.currentLocationId !== npcs[i]?.currentLocationId);
    const nextWorldNpcs = Array.isArray(char.worldNpcs)
        ? nextNpcs
        : char.worldNpcs
            ? {
                sourceText: (char.worldNpcs as LegacyNpcEnvelope).sourceText || '',
                updatedAt: (char.worldNpcs as LegacyNpcEnvelope).updatedAt || 0,
                npcs: nextNpcs,
            }
            : char.worldNpcs;
    if (!stateChanged && !npcsChanged && char.worldState?.lastScheduleId === nextState.lastScheduleId) return null;
    return { ...char, worldState: nextState, ...(nextWorldNpcs ? { worldNpcs: nextWorldNpcs } : {}) };
}

/** 只响应明确的移动动词，避免把普通聊天里的“在哪里”误判成位置变更。 */
export function parseExplicitLocationAction(char: CharacterProfile, text: string): CharacterWorldLocation | undefined {
    const input = (text || '').trim();
    const match = input.match(/(?:^|[，。！？\s])(?:去|回|到|前往|走到|赶到|抵达)\s*(?:了\s*)?([^，。！？\s]{1,24})/);
    return match ? locationByName(char, match[1]) : undefined;
}
