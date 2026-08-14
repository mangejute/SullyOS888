import type { CharacterProfile, CharacterWorldLocation, CharacterWorldNpc, CharacterWorldState, DailySchedule, ScheduleSlot } from '../types';

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
    return {
        ...slot,
        ...(resolved ? { locationId: resolved.id, location: resolved.name } : {}),
        travelMinutes: Number.isFinite(slot.travelMinutes) ? slot.travelMinutes : undefined,
        participantNpcIds: Array.isArray(slot.participantNpcIds) ? slot.participantNpcIds.filter(Boolean) : undefined,
    };
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
    const current = locationById(char, state.currentLocationId);
    const home = locationById(char, state.homeLocationId);
    const work = locationById(char, state.workLocationId);
    const active = currentScheduleSlot(schedule || null, now);
    const lines: string[] = ['### 【你的城市世界状态】', '以下是地图、NPC、日程和家园共同使用的事实。地点必须优先按 ID 理解，不要凭空改名或瞬移。'];
    if (char.worldMap?.referenceCity) lines.push(`参考城市：${char.worldMap.referenceCity}`);
    if (current) lines.push(`当前所在：${current.name}（${current.description || current.purpose}）`);
    if (home) lines.push(`你的家：${home.name}`);
    if (work) lines.push(`你的工作场所：${work.name}`);
    if (active) {
        const activeLocation = resolveSlotLocation(char, active);
        lines.push(`当前日程：${active.startTime} ${active.activity}${activeLocation ? `，地点=${activeLocation.name}` : active.location ? `，地点=${active.location}` : ''}`);
    }
    if (locations.length) {
        lines.push('地点索引：');
        for (const location of locations.slice(0, 80)) {
            const links = location.connectedLocationIds?.map(id => locationById(char, id)?.name).filter(Boolean).join('、');
            lines.push(`- ${location.id}｜${location.name}｜${location.purpose || location.category}${links ? `｜相连：${links}` : ''}`);
        }
    }
    if (npcs.length) {
        lines.push('附近与关系网络：');
        for (const npc of npcs.slice(0, 60)) {
            const rawNpc = npc as CharacterWorldNpc & { homeLocationName?: string; workLocationName?: string; frequentLocationNames?: string[] };
            const npcLocation = locationById(char, npc.currentLocationId || npc.workLocationId || npc.homeLocationId)
                || locationByName(char, rawNpc.workLocationName || rawNpc.homeLocationName || rawNpc.frequentLocationNames?.[0]);
            lines.push(`- ${npc.id}｜${npc.name}｜${npc.role}｜年龄：${npc.age}｜性别：${npc.gender}｜关系：${npc.relation}${npcLocation ? `｜常在：${npcLocation.name}` : ''}${npc.description ? `｜${npc.description}` : ''}`);
        }
    }
    lines.push('行动约束：从一个地点去另一个地点需要经过相连地点或合理的移动时间；聊天中只有明确说出“去/回/到某地”等行动时，才改变当前所在。');
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

/** 只响应明确的移动动词，避免把普通聊天里的“在哪里”误判成位置变更。 */
export function parseExplicitLocationAction(char: CharacterProfile, text: string): CharacterWorldLocation | undefined {
    const input = (text || '').trim();
    const match = input.match(/(?:^|[，。！？\s])(?:去|回|到|前往|走到|赶到|抵达)\s*(?:了\s*)?([^，。！？\s]{1,24})/);
    return match ? locationByName(char, match[1]) : undefined;
}
